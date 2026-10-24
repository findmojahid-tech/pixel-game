import Phaser from 'phaser';
import { AudioSystem } from '../audio';
import { TEAS, type Tea } from '../state';
import { SideSession, SIDE_KEY, STREET_WIDTH, type SidePlace } from './state';
import { SideUI } from './ui';
import './style.css';
const DOOR = 462,
  BASE_FLOOR = 328;
interface Layer {
  image: Phaser.GameObjects.Image;
  baseY: number;
  place: SidePlace;
  factor: number;
}
interface Vehicle {
  sprite: Phaser.GameObjects.Sprite;
  speed: number;
  kind: string;
}
export class Sideview extends Phaser.Scene {
  private session!: SideSession;
  private ui!: SideUI;
  private audio = new AudioSystem();
  private mode: 'menu' | 'play' | 'pause' = 'menu';
  private place: SidePlace = 'street';
  private hero!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private seller!: Phaser.GameObjects.Sprite;
  private walkers: Phaser.GameObjects.Sprite[] = [];
  private traffic: Vehicle[] = [];
  private layers: Layer[] = [];
  private sky!: Phaser.GameObjects.TileSprite;
  private skyTop!: Phaser.GameObjects.TileSprite;
  private floor!: Phaser.GameObjects.TileSprite;
  private curb!: Phaser.GameObjects.TileSprite;
  private crate!: Phaser.GameObjects.Image;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private vx = 0;
  private vy = 0;
  private grounded = true;
  private facing = 1;
  private offset = 0;
  private transitioning = false;
  private footTime = 0;
  private lastSave = 0;
  private sipUntil = 0;
  private hasPosition = false;
  private storage: Storage | null = null;
  private errors: string[] = [];
  private reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor() {
    super('sideview');
  }
  preload() {
    const dir = '/assets/sideview/';
    for (const key of [
      'sky',
      'sky-top',
      'facades',
      'river',
      'interior',
      'palm',
      'banyan',
      'bananas',
      'lamp',
      'bench',
      'produce',
      'pavement',
      'curb',
      'shadow',
      'crate',
    ])
      this.load.image('sv-' + key, dir + key + '.png');
    for (const [key, w, h] of [
      ['hero-walk', 88, 96],
      ['hero-idle', 88, 96],
      ['rahim', 88, 96],
      ['pedestrian', 112, 96],
      ['rickshaw', 146, 112],
      ['cng', 146, 112],
    ] as const)
      this.load.spritesheet('sv-' + key, dir + key + '.png', { frameWidth: w, frameHeight: h });
    this.load.on('loaderror', (file: Phaser.Loader.File) => this.errors.push(file.key));
  }
  create() {
    if (this.errors.length) throw Error('Missing side-view assets: ' + this.errors.join(','));
    try {
      this.storage = localStorage;
      this.hasPosition = !!this.storage.getItem(SIDE_KEY);
    } catch {
      /* Private browsing can deny storage. */
    }
    this.session = new SideSession(this.storage);
    this.offset = this.verticalOffset();
    this.audio.setMuted(this.session.economy.muted);
    const anim = (key: string, texture: string, count: number, fps: number) => {
      if (!this.anims.exists(key))
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(texture, { start: 0, end: count - 1 }),
          frameRate: fps,
          repeat: -1,
        });
    };
    anim('sv-walk', 'sv-hero-walk', 6, 9);
    anim('sv-idle', 'sv-hero-idle', 6, 2);
    anim('sv-seller', 'sv-rahim', 3, 0.8);
    anim('sv-walker', 'sv-pedestrian', 3, 5);
    anim('sv-rickshaw', 'sv-rickshaw', 3, 5);
    anim('sv-cng', 'sv-cng', 3, 3);
    this.skyTop = this.add
      .tileSprite(0, 0, this.scale.width, Math.max(1, this.offset), 'sv-sky-top')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-110);
    this.sky = this.add
      .tileSprite(0, this.offset, this.scale.width, 360, 'sv-sky')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-100);
    const layer = (
      key: string,
      x: number,
      y: number,
      depth: number,
      place: SidePlace = 'street',
      factor = 1,
    ) => {
      const image = this.add
        .image(x, y + this.offset, 'sv-' + key)
        .setOrigin(0)
        .setDepth(depth)
        .setScrollFactor(factor, 0);
      this.layers.push({ image, baseY: y, place, factor });
      return image;
    };
    layer('palm', 150, 77, -30, 'street', 0.45);
    layer('banyan', 765, 87, -25, 'street', 0.65);
    layer('palm', 1040, 77, -30, 'street', 0.45);
    layer('facades', 30, 82, 0);
    layer('river', 1040, 137, 0);
    layer('bananas', 915, 199, 4);
    layer('bananas', 1740, 199, 4);
    layer('lamp', 675, 163, 5);
    layer('lamp', 1170, 163, 5);
    layer('lamp', 1780, 163, 5);
    layer('bench', 160, 299, 45, 'street', 1.08);
    layer('produce', 660, 303, 45, 'street', 1.12);
    layer('bench', 1235, 299, 45, 'street', 1.08);
    layer('produce', 1640, 303, 45, 'street', 1.12);
    layer('interior', 0, 0, -90, 'tea');
    this.floor = this.add
      .tileSprite(
        0,
        BASE_FLOOR - 8 + this.offset,
        STREET_WIDTH,
        Math.max(40, this.scale.height - BASE_FLOOR + 8 - this.offset),
        'sv-pavement',
      )
      .setOrigin(0)
      .setDepth(10);
    this.curb = this.add
      .tileSprite(
        0,
        BASE_FLOOR + 23 + this.offset,
        STREET_WIDTH,
        Math.max(35, this.scale.height - BASE_FLOOR - 23 - this.offset),
        'sv-curb',
      )
      .setOrigin(0)
      .setDepth(11);
    this.crate = this.add
      .image(790, BASE_FLOOR + this.offset, 'sv-crate')
      .setOrigin(0.5, 1)
      .setDepth(24);
    this.shadow = this.add.image(420, BASE_FLOOR + this.offset + 1, 'sv-shadow').setDepth(25);
    this.hero = this.add
      .sprite(420, BASE_FLOOR + this.offset, 'sv-hero-idle')
      .setOrigin(0.5, 90 / 96)
      .setDepth(30)
      .play('sv-idle');
    this.seller = this.add
      .sprite(488, BASE_FLOOR + this.offset, 'sv-rahim')
      .setOrigin(0.5, 90 / 96)
      .setDepth(28)
      .play('sv-seller');
    for (const [x, speed, kind] of [
      [120, 28, 'rickshaw'],
      [780, -41, 'cng'],
      [1310, 32, 'rickshaw'],
      [1760, -37, 'cng'],
    ] as const) {
      const sprite = this.add
        .sprite(x, BASE_FLOOR + this.offset - 2, 'sv-' + kind)
        .setOrigin(0.5, 106 / 112)
        .setDepth(19)
        .setFlipX(speed < 0)
        .play('sv-' + kind);
      this.traffic.push({ sprite, speed, kind });
    }
    for (const [x, flip] of [
      [220, false],
      [1160, true],
      [1520, false],
    ] as const) {
      const s = this.add
        .sprite(x, BASE_FLOOR + this.offset, 'sv-pedestrian')
        .setOrigin(0.5, 90 / 96)
        .setDepth(26)
        .setFlipX(flip)
        .play('sv-walker');
      s.setData('direction', flip ? -1 : 1);
      s.setData('home', x);
      this.walkers.push(s);
    }
    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,SHIFT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.ui = new SideUI({
      start: () => this.startWalk(),
      interact: () => this.interact(),
      hop: () => this.hop(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      save: () => this.save(true),
      menu: () => this.title(),
      mute: () => this.mute(),
      buy: (t) => this.buy(t),
      story: () => this.story(),
      close: () => this.closeDialogue(),
    });
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyE') {
        e.preventDefault();
        this.interact();
      }
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        this.hop();
      }
      if (e.code === 'KeyV') this.mute();
      if (e.code === 'Escape') {
        e.preventDefault();
        if (this.ui.dialogueOpen) this.closeDialogue();
        else if (this.mode === 'play') this.pause();
        else if (this.mode === 'pause') this.resume();
        else this.ui.closeModal();
      }
    };
    const hidden = () => {
      if (document.hidden && this.mode === 'play') this.pause();
    };
    const unload = () => {
      if (this.mode !== 'menu') this.save(false);
    };
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', unload);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', key);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', unload);
      this.audio.destroy();
    });
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.ui.held.clear();
      this.vx = 0;
    });
    this.scale.on('resize', () => this.resize());
    this.showPlace('street');
    this.title(false);
    Object.defineProperty(window, '__SIDEVIEW__', {
      configurable: true,
      get: () => ({
        mode: this.mode,
        place: this.place,
        section: this.place === 'tea' ? 'tea' : this.hero.x < 960 ? 'lalbagh' : 'river',
        x: this.hero.x,
        y: this.hero.y,
        floor: BASE_FLOOR + this.offset,
        vx: this.vx,
        vy: this.vy,
        grounded: this.grounded,
        wallet: this.session.economy.wallet,
        cups: this.session.economy.cups,
        visited: [...this.session.position.visited],
        dialogue: this.ui.dialogueOpen,
        animation: this.hero.anims.currentAnim?.key,
        frame: this.hero.frame.name,
        scale: this.scale.zoom,
        camera: { x: this.cameras.main.scrollX, width: this.cameras.main.width },
        layers: { sky: 0.12, foliage: 0.45, facades: 1, foreground: 1.12 },
        loadedMainArt: 'PNG',
        parallax: {
          sky: this.sky.tilePositionX,
          foliage:
            this.layers[0].image.x - this.cameras.main.scrollX * this.layers[0].image.scrollFactorX,
          facade:
            this.layers.find((l) => l.image.texture.key === 'sv-facades')!.image.x -
            this.cameras.main.scrollX,
          foreground:
            this.layers.find((l) => l.image.texture.key === 'sv-bench')!.image.x -
            this.cameras.main.scrollX * 1.08,
        },
        traffic: this.traffic.map((t) => ({
          kind: t.kind,
          x: t.sprite.x,
          frame: t.sprite.frame.name,
        })),
        commonSavePosition: {
          place: this.session.economy.place,
          x: this.session.economy.x,
          y: this.session.economy.y,
        },
      }),
    });
  }
  private verticalOffset() {
    return Math.round(Math.max(0, this.scale.height - 360) * 0.48) - 16;
  }
  private resize() {
    const previous = this.offset;
    this.offset = this.verticalOffset();
    const dy = this.offset - previous;
    this.layers.forEach((l) => (l.image.y = l.baseY + this.offset));
    this.hero.y += dy;
    this.shadow.y += dy;
    this.seller.y += dy;
    this.walkers.forEach((s) => (s.y += dy));
    this.traffic.forEach((t) => (t.sprite.y += dy));
    this.crate.y += dy;
    this.sky.setPosition(0, this.offset).setSize(this.scale.width, 360);
    this.skyTop.setSize(this.scale.width, Math.max(1, this.offset));
    this.floor
      .setPosition(0, BASE_FLOOR - 8 + this.offset)
      .setSize(STREET_WIDTH, Math.max(40, this.scale.height - BASE_FLOOR + 8 - this.offset));
    this.curb
      .setPosition(0, BASE_FLOOR + 23 + this.offset)
      .setSize(STREET_WIDTH, Math.max(35, this.scale.height - BASE_FLOOR - 23 - this.offset));
    this.camera(true);
  }
  private title(save = true) {
    if (save && this.mode !== 'menu') this.save(false);
    this.closeDialogue();
    this.mode = 'menu';
    this.vx = this.vy = 0;
    this.showPlace('street');
    this.hero
      .setPosition(420, BASE_FLOOR + this.offset)
      .play('sv-idle', true)
      .setFlipX(false);
    this.ui.menu(this.hasPosition, this.session.economy.wallet);
    this.camera(true);
  }
  private startWalk() {
    this.mode = 'play';
    this.vx = this.vy = 0;
    this.grounded = true;
    this.showPlace(this.session.position.place);
    this.hero.setPosition(this.session.position.x, BASE_FLOOR + this.offset);
    this.ui.hud(this.session);
    this.ui.sound(this.audio.muted);
    this.camera(true);
    this.lastSave = this.time.now;
    void this.audio.init();
    this.save(false);
    this.cameras.main.fadeIn(400, 28, 39, 54);
    this.ui.toast('A / D to walk · E to enter · Space or ↑ to hop. Two streets to explore.');
  }
  private showPlace(place: SidePlace) {
    this.place = place;
    this.layers.forEach((l) => l.image.setVisible(l.place === place));
    this.sky.setVisible(place === 'street');
    this.skyTop.setVisible(place === 'street');
    this.floor.setVisible(place === 'street');
    this.curb.setVisible(place === 'street');
    this.crate.setVisible(place === 'street');
    this.traffic.forEach((t) => t.sprite.setVisible(place === 'street'));
    this.walkers.forEach((s) => s.setVisible(place === 'street'));
    this.seller.setVisible(place === 'tea');
  }
  private camera(snap = false, dt = 0.016) {
    const c = this.cameras.main,
      w = this.place === 'tea' ? 640 : STREET_WIDTH;
    c.removeBounds();
    let target =
      w < c.width
        ? -(c.width - w) / 2
        : Phaser.Math.Clamp(
            this.hero.x - c.width * (this.facing > 0 ? 0.44 : 0.56),
            0,
            w - c.width,
          );
    if (this.mode === 'menu') target = Math.max(0, 320 - c.width * 0.4);
    const next = snap ? target : Phaser.Math.Linear(c.scrollX, target, 1 - Math.exp(-dt * 7));
    c.setScroll(Math.round(Math.abs(target - next) < 1 ? target : next), 0);
  }
  private go(place: SidePlace) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.closeDialogue();
    this.ui.held.clear();
    this.vx = this.vy = 0;
    this.cameras.main.fadeOut(150, 248, 213, 153);
    this.time.delayedCall(165, () => {
      this.showPlace(place);
      this.hero.setPosition(place === 'tea' ? 100 : DOOR + 25, BASE_FLOOR + this.offset);
      this.grounded = true;
      this.session.position.place = place;
      this.session.position.x = this.hero.x;
      this.discover(place === 'tea' ? 'tea' : 'lalbagh');
      this.save(false);
      this.camera(true);
      this.cameras.main.fadeIn(260, 248, 213, 153);
      this.transitioning = false;
    });
  }
  private interact() {
    if (this.mode !== 'play' || this.transitioning) return;
    void this.audio.init();
    if (this.place === 'tea') {
      if (this.ui.dialogueOpen || Math.abs(this.hero.x - 488) < 88) {
        this.greeting();
        return;
      }
      if (this.hero.x < 79) {
        this.go('street');
        return;
      }
    } else {
      if (Math.abs(this.hero.x - 790) < 69 && this.grounded) {
        this.hop();
        return;
      }
      if (Math.abs(this.hero.x - DOOR) < 48 && this.grounded) {
        this.go('tea');
        return;
      }
      if (this.hero.x < 74) {
        this.save(false);
        location.assign('?view=district');
        return;
      }
      if (this.hero.x > 1800) {
        this.ui.toast('Ferry Ghat → a future district connection. This art slice ends here.');
        return;
      }
      const npc = this.walkers.find((s) => Math.abs(s.x - this.hero.x) < 49);
      if (npc) {
        this.vx = 0;
        this.ui.dialogue(
          'নদীর পথটা ঘুরে আসেন। বিকেলের আলোয় খুব সুন্দর লাগে!',
          'Take a walk along River Road. It’s lovely in the afternoon light.',
          'neighbour',
        );
        return;
      }
    }
  }
  private greeting() {
    this.vx = 0;
    this.session.economy.metSeller = true;
    this.ui.dialogue(
      'আসেন ভাই! একটু বসেন। গরম চা দিই?',
      'Come in! Take a seat. Shall I make you a hot cup of tea?',
      'order',
    );
    void this.audio.voice('seller.greeting');
    this.save(false);
  }
  private buy(tea: Tea) {
    if (this.mode !== 'play' || this.place !== 'tea' || !this.ui.dialogueOpen) return;
    if (!this.session.order(tea)) {
      this.ui.dialogue(
        'টাকা কম পড়ছে? সমস্যা নাই, পরে আইসেন।',
        'A little short on cash? No worries, come back another time.',
        'result',
      );
      void this.audio.voice('seller.insufficient');
      return;
    }
    this.audio.cup();
    this.sipUntil = this.time.now + 7000;
    const saved = this.save(false);
    this.ui.dialogue(
      tea === 'milk'
        ? 'এই নেন, গরম দুধ চা। সাবধানে খাইয়েন!'
        : 'এই নেন লেবু চা। মনটা জুড়ায়া যাবে!',
      tea === 'milk'
        ? 'Here you go, a hot milk tea. Careful, it’s warm!'
        : 'Here’s your lemon tea. A little refreshment for the soul!',
      'result',
    );
    void this.audio.voice(`seller.${tea}`);
    this.ui.update(this.session.economy.wallet, 'tea');
    this.ui.toast(
      `${TEAS[tea].english} · −৳${TEAS[tea].price} · ${saved ? 'Journey saved' : 'Saving unavailable'}`,
    );
  }
  private story() {
    if (this.place !== 'tea') return;
    this.ui.dialogue(
      'এই দোকানটা আমার আব্বার ছিল। কত মানুষ আসে, কত গল্প হয়! চায়ের কাপেই তো আড্ডা জমে।',
      'This shop was my father’s. So many people, so many stories! A cup of tea brings everyone together.',
      'story',
    );
    void this.audio.voice('seller.story');
  }
  private closeDialogue() {
    this.ui?.close();
    this.audio.stopVoice();
    this.vx = 0;
    this.keys && Object.values(this.keys).forEach((k) => k.reset());
  }
  private hop() {
    if (this.mode !== 'play' || this.ui.dialogueOpen || this.transitioning || !this.grounded)
      return;
    this.grounded = false;
    this.vy = -260;
    this.audio.tone(220, 0.09, 'triangle', undefined, 0.07, 330);
  }
  private pause() {
    if (this.mode !== 'play' || this.transitioning) return;
    this.closeDialogue();
    this.mode = 'pause';
    this.vx = 0;
    this.ui.pause();
    this.save(false);
  }
  private resume() {
    this.mode = 'play';
    this.ui.closeModal();
    this.ui.held.clear();
    Object.values(this.keys).forEach((k) => k.reset());
  }
  private mute() {
    this.audio.setMuted(!this.audio.muted);
    this.session.economy.muted = this.audio.muted;
    void this.audio.init();
    this.ui.sound(this.audio.muted);
    if (this.mode !== 'menu') this.save(false);
  }
  private save(notify: boolean) {
    if (this.mode === 'menu') return false;
    this.session.position.place = this.place;
    this.session.position.x = this.hero.x;
    const ok = this.session.save();
    this.hasPosition = ok;
    if (notify)
      this.ui.toast(
        ok ? 'Walk saved on this device.' : 'Saving unavailable. Please allow browser storage.',
      );
    return ok;
  }
  private discover(id: string) {
    if (this.session.discover(id)) {
      this.audio.bell();
      this.save(false);
      if (id === 'river')
        this.ui.toast('নদীর ধারে · River Road discovered. Keep following the river.');
    }
  }
  update(time: number, delta: number) {
    if (!this.ui) return;
    const dt = Math.min(delta, 40) / 1000,
      ground = BASE_FLOOR + this.offset;
    if (this.mode !== 'pause') {
      this.traffic.forEach((t) => {
        if (this.place !== 'street') return;
        t.sprite.x += t.speed * dt;
        if (t.sprite.x > STREET_WIDTH + 150) t.sprite.x = -150;
        if (t.sprite.x < -150) t.sprite.x = STREET_WIDTH + 150;
        t.sprite.y = ground - 2 + (this.reduceMotion ? 0 : Math.round(Math.sin(time / 170) * 0.5));
      });
      this.walkers.forEach((s, i) => {
        if (this.place !== 'street') return;
        const direction = s.getData('direction') as number,
          home = s.getData('home') as number;
        s.x += direction * (14 + i * 3) * dt;
        if (s.x > home + 100 || s.x < home - 90) {
          s.setData('direction', -direction);
          s.setFlipX(direction > 0);
        }
      });
    }
    if (this.mode === 'play' && !this.ui.dialogueOpen && !this.transitioning) {
      const axis =
        Number(this.keys.D.isDown || this.keys.RIGHT.isDown || this.ui.held.has('right')) -
        Number(this.keys.A.isDown || this.keys.LEFT.isDown || this.ui.held.has('left'));
      const speed = this.keys.SHIFT.isDown ? 158 : 104;
      this.vx = Phaser.Math.Linear(this.vx, axis * speed, 1 - Math.exp(-dt * 20));
      const nextX = Phaser.Math.Clamp(
        this.hero.x + this.vx * dt,
        24,
        this.place === 'street' ? STREET_WIDTH - 24 : 616,
      );
      const crate =
        this.place === 'street' &&
        nextX + 11 > 772 &&
        nextX - 11 < 808 &&
        this.hero.y > ground - 20 + 1;
      if (!crate) this.hero.x = nextX;
      else this.vx = 0;
      if (!this.grounded) this.vy += 880 * dt;
      const nextY = this.hero.y + this.vy * dt;
      let support = ground;
      if (
        this.place === 'street' &&
        this.hero.x + 10 > 772 &&
        this.hero.x - 10 < 808 &&
        this.hero.y <= ground - 20 + 2 &&
        nextY >= ground - 20
      )
        support = ground - 20;
      if (nextY >= support && this.vy >= 0) {
        this.hero.y = support;
        this.vy = 0;
        this.grounded = true;
      } else {
        this.hero.y = nextY;
        this.grounded = false;
      }
      const moving = Math.abs(this.vx) > 5;
      if (moving) {
        this.facing = this.vx > 0 ? 1 : -1;
        this.footTime += dt;
        if (this.grounded && this.footTime > 0.27) {
          this.audio.step();
          this.footTime = 0;
        }
      }
      this.hero.setFlipX(this.facing < 0);
      if (!this.grounded) {
        this.hero.anims.stop();
        this.hero.setTexture('sv-hero-walk', 2);
      } else this.hero.play(moving ? 'sv-walk' : 'sv-idle', true);
      this.camera(false, dt);
      if (this.place === 'street') this.discover(this.hero.x < 960 ? 'lalbagh' : 'river');
      this.ui.update(
        this.session.economy.wallet,
        this.place === 'tea' ? 'tea' : this.hero.x < 960 ? 'lalbagh' : 'river',
      );
      if (time - this.lastSave > 9000) {
        this.save(false);
        this.lastSave = time;
      }
    } else if (this.mode === 'menu') {
      this.camera(false, dt);
    }
    this.sky.tilePositionX = Math.round(
      this.cameras.main.scrollX * 0.12 + (this.reduceMotion ? 0 : time / 22000),
    );
    this.shadow.setPosition(this.hero.x, ground + 1).setAlpha(this.grounded ? 1 : 0.45);
    const bounds = this.game.canvas.getBoundingClientRect();
    this.ui.layout(
      bounds,
      this.scale.zoom,
      this.cameras.main.scrollX,
      this.offset,
      this.place,
      this.hero.x,
      this.hero.y,
    );
    let prompt = '';
    if (this.mode === 'play' && !this.ui.dialogueOpen && !this.transitioning) {
      if (this.place === 'tea')
        prompt =
          this.hero.x < 79
            ? 'Step back outside'
            : Math.abs(this.hero.x - 488) < 88
              ? 'Talk to Rahim Mama'
              : '';
      else
        prompt =
          Math.abs(this.hero.x - DOOR) < 48
            ? 'Enter Rahim Mama’s tea stall'
            : this.hero.x < 74
              ? 'Explore the original district'
              : this.hero.x > 1800
                ? 'Read the district connection'
                : Math.abs(this.hero.x - 790) < 69
                  ? 'Hop the delivery crate'
                  : this.walkers.some((s) => Math.abs(s.x - this.hero.x) < 49)
                    ? 'Talk to a neighbour'
                    : '';
    }
    this.ui.prompt(prompt);
  }
}
