import Phaser from 'phaser';
import { installArt, Pixel } from './art';
import { AudioSystem } from './audio';
import {
  direction,
  freshSave,
  loadSave,
  orderTea,
  persist,
  TEAS,
  type SaveData,
  type Tea,
} from './state';
import {
  blocked,
  BUILDINGS,
  DIRECTION_SIGNS,
  DOORS,
  PEOPLE,
  SIZE,
  TREES,
  zoneAt,
  ZONES,
  type Person,
  type Place,
} from './district';
import { UI } from './ui';
const shadowColor = () => '#28395733';
type Actor = {
  data: Person;
  sprite: Phaser.GameObjects.Image;
  target: number;
  clock: number;
  facing: number;
};
type Traffic = { sprite: Phaser.GameObjects.Image; speed: number; lane: number; clock: number };
export class World extends Phaser.Scene {
  state: SaveData = freshSave();
  ui!: UI;
  audioSystem = new AudioSystem();
  mode: 'menu' | 'playing' | 'paused' = 'menu';
  player!: Phaser.GameObjects.Image;
  private scenery: Record<Place, Phaser.GameObjects.Image[]> = {
    district: [],
    stall: [],
    books: [],
  };
  private actors: Actor[] = [];
  private traffic: Traffic[] = [];
  private leaves: Phaser.GameObjects.Image[] = [];
  private cloth: Phaser.GameObjects.Image[] = [];
  private cats: Phaser.GameObjects.Image[] = [];
  private treeSprites: { sprite: Phaser.GameObjects.Image; x: number; y: number }[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private vx = 0;
  private vy = 0;
  private facing = 0;
  private walkClock = 0;
  private stepClock = 0;
  private lastSave = 0;
  private sipUntil = 0;
  private cup!: Phaser.GameObjects.Image;
  private steam: Phaser.GameObjects.Rectangle[] = [];
  private transitioning = false;
  private activeNPC = '';
  private dialogueGeneration = 0;
  private storage: Storage | null = null;
  private currentPlace: Place = 'district';
  private reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor() {
    super('world');
  }
  create() {
    try {
      this.storage = localStorage;
    } catch {
      /* Continue without storage. */
    }
    installArt(this);
    const image = (place: Place, x: number, y: number, key: string, depth: number) => {
      const sprite = this.add.image(x, y, key).setOrigin(0).setDepth(depth);
      this.scenery[place].push(sprite);
      return sprite;
    };
    image('district', 0, 0, 'ground', -10000);
    BUILDINGS.forEach((b) => image('district', b.x - 24, b.y - 24, b.id, b.y + b.h));
    TREES.forEach((t, i) => {
      const palm = i % 3 === 1;
      const sprite = image(
        'district',
        t.x - 80,
        t.y - (palm ? 216 : 190),
        palm ? 'palm' : i % 2 ? 'tree' : 'tree2',
        t.y,
      );
      this.treeSprites.push({ sprite, x: t.x, y: t.y });
    });
    image('district', 1450, 450, 'umbrella', 563);
    image('district', 1024, 530, 'umbrella', 643);
    image('stall', 0, 0, 'stall-room', -10000);
    image('books', 0, 0, 'books-room', -10000);
    image('stall', 164, 143, 'stall-counter', 196);
    image('books', 252, 155, 'books-counter', 217);
    for (const p of PEOPLE) {
      const sprite = this.add
        .image(p.x, p.y, `person-${p.variant}-0-0`)
        .setOrigin(0.5, 1)
        .setDepth(p.y);
      this.actors.push({ data: p, sprite, target: 1, clock: 0, facing: 0 });
    }
    for (let i = 0; i < 9; i++) {
      const lane = i === 8 ? 626 : i % 2 ? 920 : 1018;
      const sprite = this.add
        .image(80 + i * 223, lane, i === 0 || i === 5 ? 'bus' : i % 2 ? 'rickshaw' : 'cng')
        .setOrigin(0.5, 1)
        .setDepth(lane)
        .setFlipX(i % 2 === 1);
      this.traffic.push({
        sprite,
        speed: (i % 2 ? -1 : 1) * (i % 3 === 0 ? 57 : 43),
        lane,
        clock: 0,
      });
    }
    for (const [x, y] of [
      [375, 791],
      [627, 811],
      [727, 779],
    ]) {
      const parked = this.add.image(x, y, 'rickshaw').setOrigin(0.5, 1).setDepth(y);
      this.scenery.district.push(parked);
    }
    // Overhead bunting, with each triangle authored on the same pixel grid as the world.
    const pennants = new Pixel(310, 67);
    for (let x = 0; x < 310; x++) {
      const y = 6 + Math.floor(Math.sin((x / 310) * Math.PI) * 17);
      pennants.r(x, y, 1, 1, '#283b59');
      if (x % 26 === 0)
        pennants.poly(
          [
            [x, y + 1],
            [x + 16, y + 3],
            [x + 8, y + 23],
          ],
          ['#ef7f76', '#ffd381', '#71c4b1', '#a78ecb'][Math.floor(x / 26) % 4],
        );
    }
    this.textures.addCanvas('bunting', pennants.canvas);
    for (const [x, y] of [
      [310, 347],
      [1070, 365],
      [1350, 585],
      [1280, 1130],
    ]) {
      const sprite = image('district', x, y, 'bunting', 3000);
      this.cloth.push(sprite);
    }
    const flag = new Pixel(60, 64);
    flag.r(3, 0, 3, 64, '#3d5570');
    flag.poly(
      [
        [6, 4],
        [53, 10],
        [51, 38],
        [6, 31],
      ],
      '#148864',
    );
    flag.ellipse(29, 21, 9, 10, '#ec5863');
    this.textures.addCanvas('flag', flag.canvas);
    const flagSprite = image('district', 575, 66, 'flag', 500);
    this.cloth.push(flagSprite);
    for (let i = 0; i < 32; i++)
      this.leaves.push(
        this.add
          .image(i * 61, 100 + ((i * 43) % 1200), 'leaf')
          .setDepth(3100)
          .setAlpha(0.8),
      );
    for (const [x, y] of [
      [1455, 502],
      [1370, 1120],
    ])
      this.cats.push(image('district', x, y, 'cat', y + 23));
    const cable = new Pixel(1920, 84);
    for (let x = 0; x < 1920; x++) {
      const sag = Math.sin(((x % 650) / 650) * Math.PI) * 32;
      cable.r(x, 5 + Math.floor(sag), 1, 1, '#334566');
      cable.r(x, 15 + Math.floor(sag), 1, 1, '#4a5268');
    }
    this.textures.addCanvas('cables', cable.canvas);
    image('district', 0, 305, 'cables', 3100);
    image('district', 0, 701, 'cables', 3100);
    const pole = new Pixel(56, 207);
    pole.ellipse(24, 201, 20, 4, shadowColor());
    pole.r(20, 4, 7, 196, '#354463');
    pole.r(21, 5, 2, 194, '#ba9d82');
    pole.r(8, 20, 34, 5, '#4d526c');
    pole.r(9, 13, 5, 9, '#b9ccc0');
    pole.r(35, 13, 5, 9, '#b9ccc0');
    pole.line(26, 46, 47, 47, '#304563', 3);
    pole.r(43, 45, 13, 7, '#3b526d');
    pole.r(45, 51, 9, 3, '#ffe5a4');
    pole.r(17, 103, 15, 22, '#bd8170');
    pole.r(18, 105, 13, 8, '#f4d28b');
    pole.r(20, 116, 10, 2, '#6a6b7e');
    this.textures.addCanvas('utility-pole', pole.canvas);
    for (const [x, y] of [
      [940, 474],
      [1050, 875],
      [1730, 730],
      [690, 1094],
    ])
      image('district', x - 23, y - 200, 'utility-pole', y);
    const notice = new Pixel(80, 95);
    notice.r(6, 75, 4, 20, '#51445b');
    notice.r(70, 75, 4, 20, '#51445b');
    notice.r(0, 0, 80, 79, '#283b58');
    notice.r(4, 4, 72, 70, '#b67b63');
    for (let i = 0; i < 6; i++) {
      const x = 8 + (i % 3) * 22,
        y = 10 + Math.floor(i / 3) * 31;
      notice.r(x, y, 19, 26, ['#f6d796', '#eb8d82', '#8acbbb'][i % 3]);
      notice.r(x + 3, y + 4, 13, 4, '#536378');
      for (let yy = y + 13; yy < y + 23; yy += 4) notice.r(x + 3, yy, 13, 1, '#8a8476');
    }
    this.textures.addCanvas('notice', notice.canvas);
    image('district', 810, 630, 'notice', 725);
    const signpost = new Pixel(140, 64);
    signpost.r(66, 22, 7, 42, '#46516a');
    signpost.r(68, 25, 2, 38, '#c0996d');
    signpost.r(0, 0, 140, 34, '#2b3e59');
    signpost.r(2, 2, 136, 30, '#ecd08b');
    signpost.r(4, 4, 132, 26, '#286b68');
    this.textures.addCanvas('direction', signpost.canvas);
    DIRECTION_SIGNS.forEach((s) => image('district', s.x, s.y, 'direction', s.y + 64));
    this.player = this.add.image(480, 420, 'person-0-0-0').setOrigin(0.5, 1).setDepth(420);
    this.cup = this.add.image(0, 0, 'cup').setVisible(false);
    for (let i = 0; i < 6; i++)
      this.steam.push(
        this.add.rectangle(0, 0, 1, 3, 0xffefbf, 0.7).setDepth(4000).setVisible(false),
      );
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyE') {
        e.preventDefault();
        this.interact();
      }
      if (e.code === 'KeyM' || e.code === 'Tab') {
        e.preventDefault();
        this.toggleMap();
      }
      if (e.code === 'KeyV') this.mute();
      if (e.code === 'Escape') {
        e.preventDefault();
        if (this.ui.isDialogue) this.closeDialogue();
        else if (this.mode === 'playing') this.pause();
        else if (this.mode === 'paused') this.resume();
        else this.ui.closeModal();
      }
    };
    const hidden = () => {
      if (document.hidden && this.mode === 'playing') this.pause();
    };
    const unload = () => {
      if (this.mode !== 'menu') this.save(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', unload);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', unload);
      this.audioSystem.destroy();
    });
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.ui.held.clear();
      this.vx = this.vy = 0;
    });
    this.ui = new UI({
      start: (l) => this.startJourney(l),
      interact: () => this.interact(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      save: () => this.save(true),
      menu: () => this.toMenu(),
      mute: () => this.mute(),
      order: (t) => this.buy(t),
      story: () => this.story(),
      closeDialogue: () => this.closeDialogue(),
      map: () => this.toggleMap(),
      bookmark: () => this.bookmark(),
    });
    this.audioSystem.setMuted(this.readSave()?.muted ?? false);
    this.showMenu();
    this.scale.on('resize', () => this.camera(true));
    Object.defineProperty(window, '__POTHE__', {
      configurable: true,
      get: () => ({
        mode: this.mode,
        place: this.state.place,
        zone: zoneAt(this.player.x, this.player.y, this.currentPlace),
        x: this.player.x,
        y: this.player.y,
        wallet: this.state.wallet,
        cups: this.state.cups,
        visited: [...this.state.visited],
        bookmark: this.state.bookmark,
        dialogue: this.ui.isDialogue,
        phaser: Phaser.VERSION,
        camera: {
          x: this.cameras.main.scrollX,
          y: this.cameras.main.scrollY,
          w: this.cameras.main.width,
          h: this.cameras.main.height,
        },
        scale: this.scale.zoom,
      }),
    });
  }
  private readSave() {
    return this.storage ? loadSave(this.storage) : null;
  }
  private showMenu() {
    this.mode = 'menu';
    this.applyPlace('district');
    this.player.setPosition(480, 420).setVisible(true);
    this.ui.menu(!!this.readSave());
    this.ui.sound(this.audioSystem.muted);
    this.camera(true);
  }
  private startJourney(load: boolean) {
    this.state = load ? (this.readSave() ?? freshSave()) : freshSave();
    this.state.muted = this.audioSystem.muted;
    this.mode = 'playing';
    this.vx = this.vy = 0;
    this.transitioning = false;
    this.sipUntil = 0;
    this.applyPlace(this.state.place);
    this.player.setPosition(this.state.x, this.state.y).setVisible(true);
    this.ui.hud(this.state);
    this.ui.sound(this.state.muted);
    this.camera(true);
    this.save(false);
    this.lastSave = this.time.now;
    void this.audioSystem.init();
    this.cameras.main.fadeIn(350, 35, 49, 78);
    this.ui.toast(
      load
        ? 'Welcome back. There’s still more to discover.'
        : 'Wander in any direction. M opens your neighbourhood map.',
    );
  }
  private applyPlace(place: Place) {
    this.currentPlace = place;
    this.state.place = place;
    for (const p of ['district', 'stall', 'books'] as const)
      this.scenery[p].forEach((s) => s.setVisible(p === place));
    this.actors.forEach((a) => a.sprite.setVisible(this.actorPlace(a.data) === place));
    this.traffic.forEach((t) => t.sprite.setVisible(place === 'district'));
    this.leaves.forEach((l) => l.setVisible(place === 'district'));
  }
  private actorPlace(p: Person): Place {
    return p.id === 'rahim' ? 'stall' : p.id === 'nila' ? 'books' : 'district';
  }
  private camera(snap = false, dt = 0.016) {
    const c = this.cameras.main;
    const w = this.currentPlace === 'district' ? SIZE.w : 720,
      h = this.currentPlace === 'district' ? SIZE.h : 520;
    c.setBounds(0, 0, w, h);
    const targetX =
      w < c.width
        ? -(c.width - w) / 2
        : Phaser.Math.Clamp(this.player.x - c.width / 2 + this.vx * 0.16, 0, w - c.width);
    const targetY =
      h < c.height
        ? -(c.height - h) / 2
        : Phaser.Math.Clamp(this.player.y - c.height * 0.64 + this.vy * 0.2, 0, h - c.height);
    const ease = snap ? 1 : 1 - Math.exp(-dt * 7);
    c.setScroll(
      Phaser.Math.Linear(c.scrollX, targetX, ease),
      Phaser.Math.Linear(c.scrollY, targetY, ease),
    );
  }
  private enter(place: Place) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.closeDialogue();
    this.ui.held.clear();
    this.ui.prompt('');
    this.vx = this.vy = 0;
    this.cameras.main.fadeOut(160, 255, 222, 165);
    this.time.delayedCall(175, () => {
      const previous = this.currentPlace;
      this.applyPlace(place);
      if (place === 'district') {
        const door = DOORS[previous as 'stall' | 'books'];
        this.player.setPosition(door.x, door.y + 22);
      } else this.player.setPosition(360, 390);
      this.sync();
      this.ui.hud(this.state);
      this.ui.sound(this.state.muted);
      this.camera(true);
      this.save(false);
      this.cameras.main.fadeIn(250, 255, 222, 165);
      this.transitioning = false;
      this.discover();
    });
  }
  private closest() {
    let best: Actor | undefined,
      dist = Infinity;
    this.actors.forEach((a) => {
      if (this.actorPlace(a.data) !== this.currentPlace) return;
      const d =
        Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y) +
        (a.data.route ? 18 : 0);
      if (d < dist) {
        dist = d;
        best = a;
      }
    });
    return { actor: best, distance: dist };
  }
  interact() {
    if (this.mode !== 'playing' || this.transitioning) return;
    void this.audioSystem.init();
    if (this.ui.isDialogue && this.activeNPC === 'rahim') {
      this.talk(this.actors.find((a) => a.data.id === 'rahim')!);
      return;
    }
    if (this.currentPlace === 'district') {
      for (const place of ['stall', 'books'] as const)
        if (Math.hypot(this.player.x - DOORS[place].x, this.player.y - DOORS[place].y) < 55) {
          this.enter(place);
          return;
        }
    } else if (this.player.y > 420 && Math.abs(this.player.x - 360) < 70) {
      this.enter('district');
      return;
    }
    const nearest = this.closest();
    if (nearest.actor && nearest.distance < (this.currentPlace === 'district' ? 76 : 110))
      this.talk(nearest.actor);
  }
  private talk(actor: Actor) {
    const p = actor.data;
    this.activeNPC = p.id;
    this.vx = this.vy = 0;
    actor.facing = 0;
    actor.sprite.setTexture(`person-${p.variant}-0-6`);
    this.say(
      p,
      p.line,
      p.translation,
      p.id === 'rahim' ? 'tea' : p.id === 'nila' && !this.state.bookmark ? 'book' : 'npc',
      p.id === 'rahim' ? 'seller.greeting' : undefined,
    );
    if (p.id === 'rahim') {
      this.state.metSeller = true;
      this.save(false);
    }
  }
  private say(
    p: Person,
    bn: string,
    en: string,
    kind: 'tea' | 'result' | 'npc' | 'book',
    voice?: string,
  ) {
    this.ui.dialogue(p.name, p.bn, bn, en, kind);
    this.ui.portrait(
      this.textures.get(`person-${p.variant}-0-0`).getSourceImage() as HTMLCanvasElement,
    );
    const generation = ++this.dialogueGeneration;
    if (voice)
      void this.audioSystem.voice(voice).then((recorded) => {
        if (generation === this.dialogueGeneration && this.ui.isDialogue)
          this.ui.voiceStatus(recorded);
      });
  }
  private buy(tea: Tea) {
    if (!this.ui.isDialogue || this.currentPlace !== 'stall' || this.activeNPC !== 'rahim') return;
    const result = orderTea(this.state, tea),
      rahim = PEOPLE.find((p) => p.id === 'rahim')!;
    if (!result.ok) {
      this.say(
        rahim,
        'টাকা কম পড়ছে? সমস্যা নাই, পরে আইসেন।',
        'A little short on cash? No worries, come back another time.',
        'result',
        'seller.insufficient',
      );
      return;
    }
    this.state = result.state;
    this.sipUntil = this.time.now + 9000;
    this.audioSystem.cup();
    this.burst(this.player.x, this.player.y - 28);
    const saved = this.save(false);
    this.say(
      rahim,
      tea === 'milk'
        ? 'এই নেন, গরম দুধ চা। সাবধানে খাইয়েন!'
        : 'এই নেন লেবু চা। মনটা জুড়ায়া যাবে!',
      tea === 'milk'
        ? 'Here you go, a hot milk tea. Careful, it’s warm!'
        : 'Here’s your lemon tea. A little refreshment for the soul!',
      'result',
      `seller.${tea}`,
    );
    this.ui.update(this.state, zoneAt(this.player.x, this.player.y, this.currentPlace));
    this.ui.toast(
      `${TEAS[tea].english} · −৳${TEAS[tea].price} · ${saved ? 'Journey saved' : 'Saving unavailable'}`,
    );
  }
  private story() {
    if (this.activeNPC !== 'rahim') return;
    this.say(
      PEOPLE.find((p) => p.id === 'rahim')!,
      'এই দোকানটা আমার আব্বার ছিল। কত মানুষ আসে, কত গল্প হয়! চায়ের কাপেই তো আড্ডা জমে।',
      'This shop was my father’s. So many people, so many stories! It’s a cup of tea that brings everyone together.',
      'result',
      'seller.story',
    );
  }
  private bookmark() {
    if (this.activeNPC !== 'nila' || this.state.bookmark) return;
    this.state.bookmark = true;
    this.burst(this.player.x, this.player.y - 30);
    this.audioSystem.bell();
    this.save(false);
    this.say(
      PEOPLE.find((p) => p.id === 'nila')!,
      'আবার আসবেন! পরেরবার আপনার গল্প শুনব।',
      'Come back soon. Next time, you can tell me your story.',
      'npc',
    );
    this.ui.toast('A little keepsake · Nila’s bookmark collected');
  }
  private burst(x: number, y: number) {
    for (let i = 0; i < 9; i++) {
      const s = this.add
        .rectangle(x, y, 2 + (i % 2), 2 + (i % 2), [0xffe49d, 0xef8b83, 0xa3d5a0][i % 3])
        .setDepth(4000);
      this.tweens.add({
        targets: s,
        x: x + Math.cos(i * 2.4) * 26,
        y: y - 15 + Math.sin(i * 2.4) * 18,
        alpha: 0,
        duration: this.reduceMotion ? 100 : 550,
        ease: 'Cubic.Out',
        onComplete: () => s.destroy(),
      });
    }
  }
  closeDialogue() {
    this.dialogueGeneration++;
    this.ui.closeDialogue();
    this.audioSystem.stopVoice();
    this.activeNPC = '';
    this.vx = this.vy = 0;
    this.keys && Object.values(this.keys).forEach((k) => k.reset());
  }
  pause() {
    if (this.mode !== 'playing' || this.transitioning) return;
    this.closeDialogue();
    this.mode = 'paused';
    this.vx = this.vy = 0;
    this.ui.pause();
    this.save(false);
  }
  resume() {
    this.mode = 'playing';
    this.ui.closeModal();
    this.ui.held.clear();
    Object.values(this.keys).forEach((k) => k.reset());
  }
  private toggleMap() {
    if (this.mode === 'menu' || this.transitioning) return;
    if (this.mode === 'paused') {
      this.resume();
      return;
    }
    this.closeDialogue();
    this.mode = 'paused';
    this.vx = this.vy = 0;
    this.sync();
    this.ui.map(this.state);
    this.save(false);
  }
  private toMenu() {
    this.save(false);
    this.closeDialogue();
    this.showMenu();
  }
  private mute() {
    this.audioSystem.setMuted(!this.audioSystem.muted);
    this.state.muted = this.audioSystem.muted;
    void this.audioSystem.init();
    this.ui.sound(this.state.muted);
    if (this.mode !== 'menu') this.save(false);
  }
  private sync() {
    this.state.x = this.player.x;
    this.state.y = this.player.y;
  }
  private save(notify: boolean) {
    if (this.mode === 'menu') return false;
    this.sync();
    const ok = this.storage ? persist(this.storage, this.state) : false;
    if (notify)
      this.ui.toast(
        ok ? 'Journey saved on this device.' : 'Saving unavailable. Please allow browser storage.',
      );
    return ok;
  }
  private discover() {
    const zone = zoneAt(this.player.x, this.player.y, this.currentPlace);
    if (!this.state.visited.includes(zone)) {
      this.state.visited.push(zone);
      this.ui.arrival(zone);
      this.audioSystem.tone(880, 0.4, 'sine');
      this.burst(this.player.x, this.player.y - 24);
      this.save(false);
      if (this.state.visited.length === 6)
        this.ui.toast('Every lane has a story · All six places discovered');
    }
  }
  update(time: number, delta: number) {
    if (!this.ui) return;
    const dt = Math.min(delta, 50) / 1000;
    if (this.mode !== 'paused') {
      this.actors.forEach((a, i) => {
        if (this.actorPlace(a.data) !== this.currentPlace) return;
        a.clock += dt;
        const route = a.data.route;
        let walking = false;
        if (route && !(this.ui.isDialogue && this.activeNPC === a.data.id)) {
          const target = route[a.target],
            dx = target.x - a.sprite.x,
            dy = target.y - a.sprite.y,
            d = Math.hypot(dx, dy);
          if (d < 3) {
            a.target = (a.target + 1) % route.length;
          } else if (Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y) > 32) {
            const speed = 20 + (i % 4) * 3,
              nx = a.sprite.x + (dx / d) * speed * dt,
              ny = a.sprite.y + (dy / d) * speed * dt;
            if (!blocked('district', nx, ny)) {
              a.sprite.setPosition(nx, ny);
              walking = true;
              a.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 2) : dy > 0 ? 0 : 3;
            } else a.target = (a.target + 1) % route.length;
          }
        }
        const frame = walking
          ? Math.floor(a.clock * 8) % 6
          : Math.floor(a.clock * 1.5) % 8 === 7
            ? 7
            : 6;
        a.sprite.setTexture(`person-${a.data.variant}-${a.facing}-${frame}`).setDepth(a.sprite.y);
      });
      this.traffic.forEach((t) => {
        const near =
          this.mode === 'playing' &&
          this.currentPlace === 'district' &&
          Math.abs(this.player.y - t.lane) < 18 &&
          Math.abs(this.player.x - t.sprite.x) < 95;
        if (!near) t.sprite.x += t.speed * dt;
        else if (time - t.clock > 6500) {
          t.clock = time;
          this.audioSystem.bell();
        }
        if (t.sprite.x > 2010) t.sprite.x = -90;
        if (t.sprite.x < -90) t.sprite.x = 2010;
        t.sprite.y = t.lane + (this.reduceMotion ? 0 : Math.sin(time / 150) * 0.4);
      });
      if (!this.reduceMotion) {
        this.leaves.forEach((l, i) => {
          l.x = (l.x + dt * (8 + (i % 7))) % SIZE.w;
          l.y = 60 + ((i * 49 + time / 110) % 1300);
        });
        this.cloth.forEach((s, i) =>
          s.setY(Math.round((i === 4 ? 66 : [347, 365, 585, 1130][i]) + Math.sin(time / 950 + i))),
        );
        this.cats.forEach((c, i) => {
          c.x = (i ? 1370 : 1455) + Math.sin(time / 5000 + i) * 18;
          c.setFlipX(Math.cos(time / 5000 + i) > 0);
        });
      }
    }
    const sipping = this.mode === 'playing' && time < this.sipUntil && !this.ui.isDialogue;
    this.cup
      .setVisible(sipping)
      .setPosition(this.player.x + 13, this.player.y - 20 - Math.max(0, Math.sin(time / 400)) * 4)
      .setDepth(this.player.y + 1);
    this.steam.forEach((s, i) => {
      const hot = this.currentPlace === 'stall' && this.mode !== 'menu';
      const lift = (time / 70 + i * 3) % 21;
      s.setVisible(sipping || hot)
        .setPosition(
          (sipping ? this.cup.x : 478) + Math.sin(time / 500 + i) * 3,
          (sipping ? this.cup.y - 12 : 116) - lift,
        )
        .setAlpha(0.65 * (1 - lift / 23));
    });
    if (this.mode === 'menu') {
      this.player.setTexture(`person-0-0-${Math.floor(time / 900) % 7 === 6 ? 7 : 6}`);
      const c = this.cameras.main;
      c.setScroll(
        Math.max(0, 480 - c.width / 2 + Math.sin(time / 16000) * 28),
        Math.max(0, 380 - c.height * 0.6),
      );
    }
    if (this.mode === 'playing' && !this.ui.isDialogue && !this.transitioning) {
      const held = this.ui.held,
        down = (...names: string[]) => names.some((k) => this.keys[k].isDown);
      const axis = direction(
        Number(down('D', 'RIGHT') || held.has('right')) -
          Number(down('A', 'LEFT') || held.has('left')),
        Number(down('S', 'DOWN') || held.has('down')) - Number(down('W', 'UP') || held.has('up')),
      );
      const speed = this.keys.SHIFT.isDown ? 192 : 125,
        ease = 1 - Math.exp(-dt * 21);
      this.vx = Phaser.Math.Linear(this.vx, axis.x * speed, ease);
      this.vy = Phaser.Math.Linear(this.vy, axis.y * speed, ease);
      const nx = this.player.x + this.vx * dt,
        ny = this.player.y + this.vy * dt;
      if (!blocked(this.currentPlace, nx, this.player.y)) this.player.x = nx;
      else this.vx = 0;
      if (!blocked(this.currentPlace, this.player.x, ny)) this.player.y = ny;
      else this.vy = 0;
      const moving = Math.hypot(this.vx, this.vy) > 5;
      if (moving) {
        this.walkClock += dt;
        this.stepClock += dt;
        this.facing =
          Math.abs(this.vx) > Math.abs(this.vy) ? (this.vx > 0 ? 1 : 2) : this.vy > 0 ? 0 : 3;
        if (this.stepClock > (this.keys.SHIFT.isDown ? 0.17 : 0.26)) {
          this.audioSystem.step();
          this.stepClock = 0;
        }
      } else this.walkClock = 0;
      const frame = moving
        ? Math.floor(this.walkClock * 11) % 6
        : Math.floor(time / 750) % 8 === 7
          ? 7
          : 6;
      this.player.setTexture(`person-0-${this.facing}-${frame}`).setDepth(this.player.y);
      this.sync();
      this.discover();
      this.camera(false, dt);
      this.ui.update(this.state, zoneAt(this.player.x, this.player.y, this.currentPlace));
      if (time - this.lastSave > 10000) {
        this.save(false);
        this.lastSave = time;
      }
    }
    this.treeSprites.forEach((t) => {
      const behind =
        this.player.y < t.y + 5 && this.player.y > t.y - 185 && Math.abs(this.player.x - t.x) < 75;
      t.sprite.setAlpha(this.mode === 'playing' && behind ? 0.42 : 1);
    });
    const bounds = this.game.canvas.getBoundingClientRect(),
      scale = this.scale.zoom,
      c = this.cameras.main;
    this.ui.frame(this.currentPlace, c.scrollX, c.scrollY, scale, bounds.left, bounds.top);
    if (this.mode === 'playing' && !this.ui.isDialogue && !this.transitioning) {
      let prompt = '';
      if (this.currentPlace === 'district') {
        for (const p of ['stall', 'books'] as const)
          if (Math.hypot(this.player.x - DOORS[p].x, this.player.y - DOORS[p].y) < 55)
            prompt = p === 'stall' ? 'Enter the tea stall' : 'Enter the reading room';
      } else if (this.player.y > 420 && Math.abs(this.player.x - 360) < 70)
        prompt = 'Step back outside';
      const close = this.closest();
      if (!prompt && close.actor && close.distance < (this.currentPlace === 'district' ? 76 : 110))
        prompt = `Talk to ${close.actor.data.name.split(' · ')[0]}`;
      this.ui.prompt(
        prompt,
        bounds.left + (this.player.x - c.scrollX) * scale,
        bounds.top + (this.player.y - c.scrollY) * scale + 15,
      );
    } else this.ui.prompt('');
  }
}
