import Phaser from 'phaser';
import { installArt } from './art';
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
import { UI } from './ui';
type Traffic = { sprite: Phaser.GameObjects.Image; speed: number; lane: number; bellAt: number };
type Obstacle = { x: number; y: number; w: number; h: number };
export class World extends Phaser.Scene {
  state: SaveData = freshSave();
  ui!: UI;
  audioSystem = new AudioSystem();
  mode: 'menu' | 'playing' | 'paused' = 'menu';
  player!: Phaser.GameObjects.Image;
  private street!: Phaser.GameObjects.Image;
  private interior!: Phaser.GameObjects.Image;
  private seller!: Phaser.GameObjects.Image;
  private foliage: Phaser.GameObjects.Image[] = [];
  private traffic: Traffic[] = [];
  private leaves: Phaser.GameObjects.Image[] = [];
  private steam: Phaser.GameObjects.Rectangle[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private vx = 0;
  private vy = 0;
  private facing = 0;
  private walkClock = 0;
  private stepClock = 0;
  private lastSave = 0;
  private sipUntil = 0;
  private transitioning = false;
  private entered = false;
  private dialogueGeneration = 0;
  private storage: Storage | null = null;
  private streetObstacles: Obstacle[] = [
    { x: 576, y: 235, w: 44, h: 7 },
    { x: 742, y: 230, w: 15, h: 13 },
    { x: 352, y: 235, w: 118, h: 8 },
  ];
  private insideObstacles: Obstacle[] = [
    { x: 259, y: 177, w: 218, h: 44 },
    { x: 190, y: 246, w: 63, h: 21 },
    { x: 411, y: 255, w: 17, h: 12 },
    { x: 441, y: 269, w: 17, h: 12 },
    { x: 453, y: 228, w: 18, h: 18 },
  ];
  constructor() {
    super('world');
  }
  create() {
    try {
      this.storage = window.localStorage;
    } catch {
      /* Private browsing can disable storage. */
    }
    installArt(this);
    this.street = this.add.image(0, 0, 'street').setOrigin(0);
    this.interior = this.add.image(0, 0, 'interior').setOrigin(0).setVisible(false);
    for (const [x, y, key] of [
      [18, 242, 'tree'],
      [510, 245, 'tree'],
      [890, 244, 'palm'],
      [1278, 243, 'tree'],
      [1718, 242, 'palm'],
    ] as const) {
      const tree = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
      this.foliage.push(tree);
    }
    // Foreground foliage anchors the lower edge of the street.
    for (const x of [80, 1120, 1760]) {
      const t = this.add.image(x, 462, 'tree').setOrigin(0.5, 1).setDepth(500).setTint(0x668366);
      this.foliage.push(t);
    }
    for (let i = 0; i < 6; i++) {
      const cng = i % 2 === 0,
        lane = i % 2 ? 286 : 319,
        speed = (i % 2 ? -1 : 1) * (cng ? 36 : 23);
      const sprite = this.add
        .image(100 + i * 280, lane, cng ? 'cng' : 'rickshaw')
        .setOrigin(0.5, 1)
        .setDepth(lane)
        .setFlipX(speed < 0);
      this.traffic.push({ sprite, speed, lane, bellAt: 0 });
    }
    this.add
      .image(259, 177, 'counter-front')
      .setOrigin(0)
      .setDepth(221)
      .setName('counter-front')
      .setVisible(false);
    this.seller = this.add
      .image(376, 184, 'seller')
      .setOrigin(0.5, 1)
      .setDepth(173)
      .setVisible(false);
    this.player = this.add
      .image(650, 250, 'player-0-0')
      .setOrigin(0.5, 1)
      .setDepth(250)
      .setVisible(false);
    for (let i = 0; i < 14; i++)
      this.leaves.push(
        this.add
          .image(i * 135, 90 + ((i * 29) % 200), 'leaf')
          .setDepth(400)
          .setAlpha(0.65),
      );
    for (let i = 0; i < 7; i++)
      this.steam.push(
        this.add.rectangle(0, 0, 1, 2, 0xf7e4b9, 0.55).setDepth(450).setVisible(false),
      );
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ESC,SHIFT,M') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    // Handle actions directly: DOM focus changes during pause must not drop a queued key.
    const actionKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === 'KeyE') {
        event.preventDefault();
        this.interact();
      }
      if (event.code === 'KeyM') {
        event.preventDefault();
        this.mute();
      }
      if (event.code === 'Escape') {
        event.preventDefault();
        if (this.ui.isDialogue) {
          this.closeDialogue();
          return;
        }
        if (this.mode === 'playing') this.pause();
        else if (this.mode === 'paused') this.resume();
        else this.ui.closeModal();
      }
    };
    window.addEventListener('keydown', actionKey);
    this.events.once('shutdown', () => window.removeEventListener('keydown', actionKey));
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.ui.held.clear();
      this.vx = this.vy = 0;
    });
    window.addEventListener('pagehide', () => {
      if (this.mode !== 'menu') this.save(false);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'playing') this.pause();
    });
    this.ui = new UI({
      start: (load) => this.startJourney(load),
      interact: () => this.interact(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      save: () => this.save(true),
      menu: () => this.toMenu(),
      mute: () => this.mute(),
      order: (tea) => this.buy(tea),
      story: () => this.story(),
      closeDialogue: () => this.closeDialogue(),
    });
    this.audioSystem.setMuted(this.readSave()?.muted ?? false);
    this.showMenu();
    this.scale.on('resize', () => this.cameraForPlace());
    this.events.once('shutdown', () => this.audioSystem.destroy());
    // Read-only diagnostics used by browser smoke tests and local QA.
    Object.defineProperty(window, '__POTHE__', {
      configurable: true,
      get: () => ({
        mode: this.mode,
        place: this.state.place,
        x: this.player.x,
        y: this.player.y,
        wallet: this.state.wallet,
        cups: this.state.cups,
        dialogue: this.ui.isDialogue,
        phaser: Phaser.VERSION,
      }),
    });
  }
  private showMenu() {
    this.mode = 'menu';
    this.player.setVisible(false);
    this.applyPlace('street');
    this.cameras.main.stopFollow();
    this.cameras.main.setBounds(0, 0, 1800, 360);
    this.cameras.main.setScroll(235, 0);
    this.ui.menu(!!this.readSave());
    this.ui.sound(this.audioSystem.muted);
  }
  private readSave() {
    return this.storage ? loadSave(this.storage) : null;
  }
  private startJourney(load: boolean) {
    this.state = load ? (this.readSave() ?? freshSave()) : freshSave();
    this.state.muted = this.audioSystem.muted;
    this.mode = 'playing';
    this.transitioning = false;
    this.sipUntil = 0;
    this.vx = this.vy = 0;
    this.audioSystem.setMuted(this.state.muted);
    void this.audioSystem.init();
    this.applyPlace(this.state.place);
    this.player.setPosition(this.state.x, this.state.y).setVisible(true).setTexture('player-0-0');
    this.ui.hud(this.state);
    this.ui.sound(this.state.muted);
    this.lastSave = this.time.now;
    this.save(false);
    this.cameraForPlace();
    this.cameras.main.fadeIn(600, 18, 47, 46);
    this.ui.toast(
      load
        ? 'Welcome back. Your street missed you.'
        : 'Welcome home. Step inside Rahim Mama’s tea stall.',
    );
  }
  private applyPlace(place: 'street' | 'stall') {
    this.state.place = place;
    const outside = place === 'street';
    this.street.setVisible(outside);
    this.interior.setVisible(!outside);
    this.seller.setVisible(!outside);
    this.children.getByName('counter-front')?.setActive(!outside);
    (this.children.getByName('counter-front') as Phaser.GameObjects.Image).setVisible(!outside);
    this.foliage.forEach((t) => t.setVisible(outside));
    this.traffic.forEach((t) => t.sprite.setVisible(outside));
    this.leaves.forEach((t) => t.setVisible(outside));
    this.entered = false;
  }
  private cameraForPlace() {
    const c = this.cameras.main;
    c.stopFollow();
    if (this.state.place === 'street') {
      c.setBounds(0, 0, 1800, 360);
      c.setScroll(Phaser.Math.Clamp(this.player.x - c.width / 2, 0, 1800 - c.width), 0);
    } else {
      c.setBounds(0, 0, 640, 360);
      c.setScroll(Phaser.Math.Clamp(this.player.x - c.width / 2, 0, 640 - c.width), 0);
    }
  }
  private enter(place: 'street' | 'stall') {
    if (this.transitioning) return;
    this.transitioning = true;
    this.ui.held.clear();
    this.ui.prompt('');
    this.closeDialogue();
    this.vx = this.vy = 0;
    this.cameras.main.fadeOut(220, 18, 47, 46);
    this.time.delayedCall(230, () => {
      this.applyPlace(place);
      this.player.setPosition(place === 'stall' ? 320 : 655, place === 'stall' ? 278 : 251);
      this.syncState();
      this.ui.hud(this.state);
      this.ui.sound(this.state.muted);
      this.cameraForPlace();
      this.save(false);
      this.cameras.main.fadeIn(300, 18, 47, 46);
      this.transitioning = false;
      this.ui.toast(
        place === 'stall'
          ? 'A warm welcome. Walk up to the counter and press E.'
          : 'Back to the neighbourhood. Take the long way home.',
      );
    });
  }
  interact() {
    if (this.mode !== 'playing' || this.transitioning) return;
    void this.audioSystem.init();
    if (this.state.place === 'street') {
      if (Math.hypot(this.player.x - 655, this.player.y - 243) < 38) this.enter('stall');
      else if (Math.abs(this.player.x - 834) < 50 && this.player.y < 267)
        this.ui.toast('ধীরে চলুন — Take it slow. Every street has a story.');
      else this.ui.toast('Find the green tea stall. Get closer to its doorway.');
    } else {
      if (this.player.y > 292 && Math.abs(this.player.x - 320) < 42) {
        this.enter('street');
        return;
      }
      if (Math.hypot(this.player.x - 376, this.player.y - 193) < 81 || this.ui.isDialogue) {
        this.state.metSeller = true;
        this.say(
          'আসেন ভাই! একটু বসেন। গরম চা দিই?',
          'Come in, brother! Take a seat. Shall I make you some hot tea?',
          'seller.greeting',
        );
      } else this.ui.toast('Rahim Mama is at the counter. Walk a little closer.');
    }
  }
  private say(bn: string, en: string, id: string, result = false) {
    this.vx = this.vy = 0;
    this.ui.prompt('');
    this.ui.dialogue(bn, en, result);
    this.ui.portrait(this.textures.get('seller').getSourceImage() as HTMLCanvasElement);
    const generation = ++this.dialogueGeneration;
    void this.audioSystem.voice(id).then((recorded) => {
      if (generation === this.dialogueGeneration && this.ui.isDialogue)
        this.ui.voiceStatus(recorded);
    });
  }
  private buy(tea: Tea) {
    if (!this.ui.isDialogue || this.state.place !== 'stall' || this.mode !== 'playing') return;
    const result = orderTea(this.state, tea);
    if (!result.ok) {
      this.say(
        'টাকা কম পড়ছে? সমস্যা নাই, পরে আইসেন।',
        'A little short on cash? No worries, come back another time.',
        'seller.insufficient',
        true,
      );
      return;
    }
    this.state = result.state;
    this.audioSystem.cup();
    this.sipUntil = this.time.now + 6500;
    this.ui.update(this.state);
    const saved = this.save(false);
    this.say(
      tea === 'milk'
        ? 'এই নেন, গরম দুধ চা। সাবধানে খাইয়েন!'
        : 'এই নেন লেবু চা। মনটা জুড়ায়া যাবে!',
      tea === 'milk'
        ? 'Here you go, a hot milk tea. Careful, it’s warm!'
        : 'Here’s your lemon tea. A little refreshment for the soul!',
      `seller.${tea}`,
      true,
    );
    this.ui.toast(
      `${TEAS[tea].english} enjoyed · −৳${TEAS[tea].price} · ${saved ? 'Journey saved' : 'Saving unavailable'}`,
    );
  }
  private story() {
    this.say(
      'এই দোকানটা আমার আব্বার ছিল। কত মানুষ আসে, কত গল্প হয়! চায়ের কাপেই তো আড্ডা জমে।',
      'This shop was my father’s. So many people, so many stories! It’s a cup of tea that brings everyone together.',
      'seller.story',
      true,
    );
    this.save(false);
  }
  closeDialogue() {
    this.dialogueGeneration++;
    this.ui.closeDialogue();
    this.audioSystem.stopVoice();
    this.keys && Object.values(this.keys).forEach((key) => key.reset());
  }
  pause() {
    if (this.mode !== 'playing' || this.transitioning) return;
    this.mode = 'paused';
    this.closeDialogue();
    this.vx = this.vy = 0;
    this.ui.pause();
    this.save(false);
  }
  resume() {
    this.mode = 'playing';
    this.ui.closeModal();
    Object.values(this.keys).forEach((key) => key.reset());
  }
  private toMenu() {
    this.save(false);
    this.ui.closeDialogue();
    this.audioSystem.stopVoice();
    this.showMenu();
  }
  private mute() {
    this.audioSystem.setMuted(!this.audioSystem.muted);
    this.state.muted = this.audioSystem.muted;
    void this.audioSystem.init();
    this.ui.sound(this.state.muted);
    if (this.mode !== 'menu') this.save(false);
  }
  private syncState() {
    this.state.x = this.player.x;
    this.state.y = this.player.y;
  }
  private save(notify: boolean) {
    if (this.mode === 'menu') return false;
    this.syncState();
    const ok = this.storage ? persist(this.storage, this.state) : false;
    if (notify)
      this.ui.toast(
        ok
          ? 'Journey saved on this device.'
          : 'Saving is unavailable. Please allow browser storage.',
      );
    else if (!ok && !this.entered) {
      this.ui.toast('Browser storage is unavailable. This journey cannot be saved.');
      this.entered = true;
    }
    return ok;
  }
  private blocked(x: number, y: number) {
    const inside = this.state.place === 'stall';
    if (
      x < (inside ? 172 : 14) ||
      x > (inside ? 467 : 1786) ||
      y < (inside ? 194 : 236) ||
      y > (inside ? 309 : 343)
    )
      return true;
    return (inside ? this.insideObstacles : this.streetObstacles).some(
      (o) => x + 5 > o.x && x - 5 < o.x + o.w && y > o.y && y - 4 < o.y + o.h,
    );
  }
  update(time: number, delta: number) {
    if (!this.ui) return;
    const dt = Math.min(delta, 50) / 1000;
    if (this.mode === 'menu')
      this.cameras.main.scrollX =
        (this.cameras.main.width < 640 ? 655 - this.cameras.main.width / 2 : 235) +
        Math.sin(time / 24000) * 25;
    if (this.mode !== 'paused') {
      this.traffic.forEach((t, i) => {
        const near =
          this.mode === 'playing' &&
          this.state.place === 'street' &&
          Math.abs(this.player.y - t.lane) < 13 &&
          Math.abs(this.player.x - t.sprite.x) < 60;
        if (!near) t.sprite.x += t.speed * dt;
        else if (time > t.bellAt) {
          t.bellAt = time + 6500;
          if (i % 2) this.audioSystem.bell();
        }
        if (t.sprite.x > 1850) t.sprite.x = -60;
        if (t.sprite.x < -60) t.sprite.x = 1850;
        t.sprite.y = t.lane + Math.sin(time / 180 + i) * 0.3;
      });
      this.leaves.forEach((leaf, i) => {
        leaf.x = (leaf.x + dt * (5 + (i % 4))) % 1800;
        leaf.y = 65 + ((i * 27 + time / 140 + i * 12) % 240);
      });
    }
    this.steam.forEach((s, i) => {
      const interior = this.mode === 'playing' && this.state.place === 'stall';
      const sipping = time < this.sipUntil && !this.ui.isDialogue;
      const y = (time / 70 + i * 3) % 19;
      s.setVisible(this.mode !== 'menu' && (interior || sipping));
      s.setPosition(
        (sipping ? this.player.x + 7 : 435) + Math.sin(i + time / 400) * 2,
        (sipping ? this.player.y - 23 : 146) - y,
      ).setAlpha(0.5 * (1 - y / 20));
    });
    if (this.mode !== 'playing' || this.ui.isDialogue || this.transitioning) {
      this.ui.prompt('');
      return;
    }
    const held = this.ui.held,
      down = (...keys: string[]) => keys.some((k) => this.keys[k].isDown);
    const axis = direction(
      Number(down('D', 'RIGHT') || held.has('right')) -
        Number(down('A', 'LEFT') || held.has('left')),
      Number(down('S', 'DOWN') || held.has('down')) - Number(down('W', 'UP') || held.has('up')),
    );
    const speed = this.keys.SHIFT.isDown ? 113 : 72;
    const ease = 1 - Math.exp(-dt * 19);
    this.vx = Phaser.Math.Linear(this.vx, axis.x * speed, ease);
    this.vy = Phaser.Math.Linear(this.vy, axis.y * speed, ease);
    const nx = this.player.x + this.vx * dt,
      ny = this.player.y + this.vy * dt;
    if (!this.blocked(nx, this.player.y)) this.player.x = nx;
    else this.vx = 0;
    if (!this.blocked(this.player.x, ny)) this.player.y = ny;
    else this.vy = 0;
    const moving = Math.hypot(this.vx, this.vy) > 4;
    if (moving) {
      this.walkClock += dt;
      this.stepClock += dt;
      if (Math.abs(this.vx) > Math.abs(this.vy)) this.facing = this.vx > 0 ? 1 : 2;
      else this.facing = this.vy > 0 ? 0 : 3;
      if (this.stepClock > 0.28) {
        this.audioSystem.step();
        this.stepClock = 0;
      }
    } else this.walkClock = 0;
    const frame = moving ? 1 + (Math.floor(this.walkClock * 9) % 3) : 0;
    this.player.setTexture(`player-${this.facing}-${frame}`).setDepth(this.player.y);
    if (this.state.place === 'street') {
      const target = Phaser.Math.Clamp(
        this.player.x - this.cameras.main.width / 2,
        0,
        1800 - this.cameras.main.width,
      );
      this.cameras.main.scrollX = Phaser.Math.Linear(
        this.cameras.main.scrollX,
        target,
        1 - Math.exp(-dt * 6),
      );
      const near = Math.hypot(this.player.x - 655, this.player.y - 243) < 38;
      this.ui.prompt(
        near
          ? 'Enter Rahim Mama’s tea stall'
          : Math.abs(this.player.x - 834) < 50 && this.player.y < 267
            ? 'Read the wall painting'
            : '',
      );
    } else {
      const target = Phaser.Math.Clamp(
        this.player.x - this.cameras.main.width / 2,
        0,
        640 - this.cameras.main.width,
      );
      this.cameras.main.scrollX = Phaser.Math.Linear(
        this.cameras.main.scrollX,
        target,
        1 - Math.exp(-dt * 6),
      );
      this.ui.prompt(
        this.player.y > 292 && Math.abs(this.player.x - 320) < 42
          ? 'Step back outside'
          : Math.hypot(this.player.x - 376, this.player.y - 193) < 81
            ? 'Have a chat with Rahim Mama'
            : '',
      );
    }
    this.syncState();
    this.ui.update(this.state);
    if (time - this.lastSave > 10000) {
      this.save(false);
      this.lastSave = time;
    }
    const label = this.ui.root.querySelector<HTMLElement>('.world-label');
    if (label) {
      label.style.display = this.state.place === 'street' ? 'block' : 'none';
      label.style.left = `${((655 - this.cameras.main.scrollX) / 640) * 100}%`;
    }
  }
}
