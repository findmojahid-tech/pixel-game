import { BUILDINGS, DIRECTION_SIGNS, SIZE, ZONES, type Place, type ZoneId } from './district';
import type { SaveData } from './state';
export interface UIActions {
  start(load: boolean): void;
  interact(): void;
  pause(): void;
  resume(): void;
  save(): void;
  menu(): void;
  mute(): void;
  order(tea: 'milk' | 'lemon'): void;
  story(): void;
  closeDialogue(): void;
  map(): void;
  bookmark(): void;
}
const icons = {
  pause: '<path d="M8 5v14M16 5v14"/>',
  map: '<path d="M3 5l6-2 6 3 6-2v16l-6 2-6-3-6 2ZM9 3v16M15 6v16"/>',
  sound: '<path d="M3 10h4l5-5v14l-5-5H3ZM16 8q6 4 0 8M19 5q9 7 0 14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const svg = (key: keyof typeof icons) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key]}</svg>`;
export class UI {
  root = document.querySelector<HTMLDivElement>('#ui')!;
  held = new Set<string>();
  isDialogue = false;
  private toastTimer?: number;
  private zoneTimer?: number;
  private lastZone = '';
  private promptValue = '';
  constructor(private actions: UIActions) {}
  private shell() {
    return '<div id="world-signs"></div><div id="dialogue-root"></div><div id="modal-root"></div><div class="toast" role="status"></div>';
  }
  menu(hasSave: boolean) {
    this.root.classList.add('menu-mode');
    this.held.clear();
    this.isDialogue = false;
    this.root.innerHTML = `${this.shell()}<div class="menu-vignette"></div><main class="title-menu"><p class="title-bn" lang="bn">পথে পথে</p><p class="edition">A BANGLADESH ADVENTURE</p><h1>POTHE<br><span>POTHE</span></h1><p class="title-caption">A whole neighbourhood. A thousand little stories.</p><div class="title-actions"><button class="primary" data-action="new">Begin your journey ${svg('arrow')}</button><button class="secondary" data-action="continue" ${hasSave ? '' : 'disabled'}>Continue your journey</button><button class="text-button" data-action="credits">About this district</button></div></main><span class="menu-edition">DHAKA / DISTRICT 01<br>THE NEIGHBOURHOOD EDITION · v0.2</span><button class="icon-button menu-sound" data-action="mute" aria-label="Toggle audio">${svg('sound')}</button>`;
    this.bind('new', () => {
      if (hasSave) {
        this.modal(
          'A new journey?',
          'This replaces your local progress. Your saved journey is safe if you go back.',
          `<button class="primary" data-action="confirm">Start a new journey</button><button class="secondary" data-action="cancel">Go back</button>`,
        );
        this.bind('confirm', () => this.actions.start(false));
        this.bind('cancel', () => this.closeModal());
      } else this.actions.start(false);
    });
    this.bind('continue', () => this.actions.start(true));
    this.bind('mute', () => this.actions.mute());
    this.bind('credits', () => this.credits());
    this.signs();
  }
  hud(state: SaveData) {
    this.root.classList.remove('menu-mode');
    this.held.clear();
    this.isDialogue = false;
    this.lastZone = '';
    this.promptValue = '';
    this.root.innerHTML = `${this.shell()}<header class="hud"><div class="location"><span class="district-dot"></span><div><strong id="place-name">Cha-er Adda</strong><span id="place-bn" lang="bn">চায়ের আড্ডা</span></div></div><div class="hud-tools"><span class="wallet"><span lang="bn">৳</span><strong id="wallet">${state.wallet}</strong></span><button class="map-button" data-action="map" aria-label="Open district map">${svg('map')}<span id="visit-count">${state.visited.length}/6</span></button><button class="icon-button" data-action="mute" aria-label="Toggle audio">${svg('sound')}</button><button class="icon-button" data-action="pause" aria-label="Pause game">${svg('pause')}</button></div></header><div class="zone-arrival"><small>DISCOVERED</small><strong></strong><span lang="bn"></span></div><div id="interaction" class="interaction"><button data-action="interact" aria-label="Interact"><kbd>E</kbd><span></span></button></div><div class="keyboard-hint">WASD / ARROWS <b>MOVE</b><i>·</i> SHIFT <b>RUN</b><i>·</i> M <b>MAP</b></div><div class="touch-controls"><div class="dpad">${['up', 'left', 'down', 'right'].map((d) => `<button data-dir="${d}" aria-label="Move ${d}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5L20 18H4Z"/></svg></button>`).join('')}</div><button class="touch-interact" data-action="touch-interact" aria-label="Interact">E</button></div>`;
    this.bind('pause', () => this.actions.pause());
    this.bind('map', () => this.actions.map());
    this.bind('mute', () => this.actions.mute());
    this.bind('interact', () => this.actions.interact());
    this.bind('touch-interact', () => this.actions.interact());
    this.root.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((button) => {
      const key = button.dataset.dir!;
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        this.held.add(key);
        button.classList.add('pressed');
      });
      for (const e of ['pointerup', 'pointercancel', 'lostpointercapture'])
        button.addEventListener(e, () => {
          this.held.delete(key);
          button.classList.remove('pressed');
        });
    });
    this.signs();
  }
  private signs() {
    const root = this.root.querySelector('#world-signs');
    if (root)
      root.innerHTML =
        BUILDINGS.filter((b) => b.style !== 'house')
          .map(
            (b) =>
              `<div class="world-sign" data-sign="${b.id}"><strong lang="bn">${b.bn}</strong><span>${b.name}</span></div>`,
          )
          .join('') +
        DIRECTION_SIGNS.map(
          (s) =>
            `<div class="world-sign" data-direction="${s.id}"><strong lang="bn">${s.bn}</strong><span>${s.name}</span></div>`,
        ).join('');
  }
  frame(place: Place, camX: number, camY: number, scale: number, ox: number, oy: number) {
    this.root.querySelectorAll<HTMLElement>('[data-sign]').forEach((el) => {
      const b = BUILDINGS.find((b) => b.id === el.dataset.sign)!;
      const x = Math.round((b.x + 19 - camX) * scale + ox),
        y = Math.round((b.y + Math.min(82, Math.max(28, b.h - 120)) + 17 - camY) * scale + oy);
      el.hidden =
        place !== 'district' || x < -b.w * scale || y < -80 || x > innerWidth || y > innerHeight;
      if (!el.hidden) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${(b.w - 38) * scale}px`;
        el.style.setProperty('--sign-size', `${scale === 1 ? 15 : 24}px`);
        el.style.setProperty('--sign-small', `${scale === 1 ? 6 : 8}px`);
      }
    });
    this.root.querySelectorAll<HTMLElement>('[data-direction]').forEach((el) => {
      const s = DIRECTION_SIGNS.find((s) => s.id === el.dataset.direction)!;
      el.hidden = place !== 'district';
      el.style.left = `${Math.round((s.x - camX) * scale + ox)}px`;
      el.style.top = `${Math.round((s.y + 6 - camY) * scale + oy)}px`;
      el.style.width = `${s.w * scale}px`;
      el.style.setProperty('--sign-size', `${scale === 1 ? 15 : 24}px`);
      el.style.setProperty('--sign-small', `${scale === 1 ? 6 : 8}px`);
    });
  }
  update(state: SaveData, zone: ZoneId) {
    const wallet = this.root.querySelector('#wallet');
    if (wallet && wallet.textContent !== String(state.wallet))
      wallet.textContent = String(state.wallet);
    const count = this.root.querySelector('#visit-count');
    if (count) count.textContent = `${state.visited.length}/6`;
    if (zone === this.lastZone) return;
    this.lastZone = zone;
    const z = ZONES.find((z) => z.id === zone)!;
    const name = this.root.querySelector('#place-name'),
      bn = this.root.querySelector('#place-bn');
    if (name) name.textContent = z.name;
    if (bn) bn.textContent = z.bn;
  }
  arrival(id: ZoneId) {
    const z = ZONES.find((z) => z.id === id)!;
    const el = this.root.querySelector('.zone-arrival');
    if (!el) return;
    el.querySelector('strong')!.textContent = z.name;
    el.querySelector('span')!.textContent = z.bn;
    el.classList.add('show');
    clearTimeout(this.zoneTimer);
    this.zoneTimer = window.setTimeout(() => el.classList.remove('show'), 3000);
  }
  prompt(text: string, x?: number, y?: number) {
    const el = this.root.querySelector<HTMLElement>('#interaction');
    if (!el) return;
    if (this.promptValue !== text) {
      this.promptValue = text;
      el.classList.toggle('visible', !!text);
      el.querySelector('span')!.textContent = text;
    }
    if (x !== undefined) {
      el.style.left = `${Math.round(x)}px`;
      el.style.top = `${Math.round(y!)}px`;
    }
  }
  dialogue(
    name: string,
    bn: string,
    line: string,
    english: string,
    kind: 'tea' | 'result' | 'npc' | 'book' = 'npc',
  ) {
    this.isDialogue = true;
    this.held.clear();
    this.prompt('');
    const root = this.root.querySelector('#dialogue-root');
    if (!root) return;
    const choices =
      kind === 'tea'
        ? '<button data-action="milk"><span lang="bn">দুধ চা</span> Milk tea <b>৳15</b></button><button data-action="lemon"><span lang="bn">লেবু চা</span> Lemon tea <b>৳10</b></button><button data-action="story">Your story?</button>'
        : kind === 'result'
          ? '<button data-action="another">Another cup?</button><button data-action="close-dialogue">Thank you, Mama</button>'
          : kind === 'book'
            ? '<button data-action="bookmark">Keep the bookmark</button><button data-action="close-dialogue">See you soon</button>'
            : '<button data-action="close-dialogue">See you around</button>';
    root.innerHTML = `<section class="dialogue" role="dialog" aria-modal="true" aria-label="Conversation with ${name}"><canvas class="portrait" width="36" height="54"></canvas><div class="dialogue-body"><header><strong>${name} <span lang="bn">${bn}</span></strong><button data-action="close-dialogue" aria-label="Close conversation">${svg('close')}</button></header><p class="dialogue-bn" lang="bn">${line}</p><p class="translation">${english}</p><div class="dialogue-choices">${choices}</div></div></section>`;
    this.bind('milk', () => this.actions.order('milk'));
    this.bind('lemon', () => this.actions.order('lemon'));
    this.bind('story', () => this.actions.story());
    this.bind('close-dialogue', () => this.actions.closeDialogue());
    this.bind('another', () => this.actions.interact());
    this.bind('bookmark', () => this.actions.bookmark());
    root
      .querySelector<HTMLButtonElement>('.dialogue-choices button')
      ?.focus({ preventScroll: true });
  }
  portrait(canvas: HTMLCanvasElement) {
    const c = this.root.querySelector<HTMLCanvasElement>('.portrait');
    if (c) {
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, 0, 0);
    }
  }
  closeDialogue() {
    this.isDialogue = false;
    this.held.clear();
    const el = this.root.querySelector('#dialogue-root');
    if (el) el.innerHTML = '';
  }
  voiceStatus(recorded: boolean) {
    const el = this.root.querySelector('.dialogue');
    if (el) el.setAttribute('data-voice', recorded ? 'recorded' : 'subtitles');
  }
  pause() {
    this.held.clear();
    this.modal(
      'Stay a little longer.',
      'A neighbourhood to wander, a story to keep.',
      `<button class="primary" data-action="resume">Back to the neighbourhood</button><button class="secondary" data-action="save">Save journey</button><button class="secondary" data-action="menu">Save & main menu</button><p class="footnote">Autosaves on this device · Esc to resume</p>`,
    );
    this.bind('resume', () => this.actions.resume());
    this.bind('save', () => this.actions.save());
    this.bind('menu', () => this.actions.menu());
  }
  map(state: SaveData) {
    this.held.clear();
    const mx = state.place === 'district' ? state.x : state.place === 'stall' ? 480 : 1274,
      my = state.place === 'district' ? state.y : state.place === 'stall' ? 342 : 338;
    this.modal(
      'Your neighbourhood',
      `${state.visited.length} of 6 places discovered · ${state.cups ? 'Tea enjoyed' : 'Find a cup of tea'}${state.bookmark ? ' · Bookmark collected' : ''}`,
      `<div class="district-map"><svg viewBox="0 0 ${SIZE.w} ${SIZE.h}" role="img" aria-label="Connected district map"><rect width="1920" height="1400" fill="#5e995f"/><path d="M0 440H1920M480 0V1400M1420 0V1400M0 960H1920M980 0V1400" stroke="#efd097" stroke-width="115"/>${BUILDINGS.map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${b.roof}" stroke="#233353" stroke-width="12"/>`).join('')}${ZONES.map(
        (z, i) => {
          const xy = [
            [480, 495],
            [1460, 435],
            [480, 960],
            [1440, 1230],
            [480, 265],
            [1274, 255],
          ][i];
          return `<circle cx="${xy[0]}" cy="${xy[1]}" r="48" fill="${state.visited.includes(z.id) ? '#ffd17c' : '#304763'}" stroke="#233353" stroke-width="8"/><text x="${xy[0]}" y="${xy[1] + 17}" fill="${state.visited.includes(z.id) ? '#233353' : '#fff1bc'}" text-anchor="middle" font-family="monospace" font-size="55" font-weight="bold">${i + 1}</text>`;
        },
      ).join(
        '',
      )}<circle cx="${mx}" cy="${my}" r="32" fill="#fff6bd" stroke="#d45167" stroke-width="17"/></svg><span class="map-north">N ↑</span></div><div class="map-legend">${ZONES.map((z, i) => `<span class="${state.visited.includes(z.id) ? 'found' : ''}">${state.visited.includes(z.id) ? '•' : '○'} ${i + 1}. ${z.name}</span>`).join('')}</div><button class="primary" data-action="close-map">Keep wandering ${svg('arrow')}</button>`,
    );
    this.bind('close-map', () => this.actions.resume());
  }
  credits() {
    this.modal(
      'Pothe Pothe · পথে পথে',
      'A colourful, fictional Old Dhaka neighbourhood. Four outdoor areas, two interiors, and many ways to get there.',
      `<p class="credits">Original integer-grid pixel artwork and synthesized effects. Local fonts: Press Start 2P and Noto Sans Bengali (SIL OFL). Bengali dialogue has English translations. Human voice recordings are still missing; licensed-recording support is included. No reference images were available for this revision. No paid services used.</p><button class="primary" data-action="close-credits">Back to the district</button>`,
    );
    this.bind('close-credits', () => this.closeModal());
  }
  private modal(title: string, copy: string, body: string) {
    const root = this.root.querySelector('#modal-root');
    if (root) {
      root.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><small>POTHE POTHE / DISTRICT 01</small><h2>${title}</h2><p>${copy}</p>${body}</section></div>`;
      root.querySelector<HTMLButtonElement>('button')?.focus();
    }
  }
  closeModal() {
    const root = this.root.querySelector('#modal-root');
    if (root) root.innerHTML = '';
  }
  hasModal() {
    return !!this.root.querySelector('.modal');
  }
  toast(message: string) {
    const el = this.root.querySelector('.toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.remove('show'), 3000);
  }
  sound(muted: boolean) {
    this.root.querySelectorAll<HTMLButtonElement>('[data-action="mute"]').forEach((el) => {
      el.classList.toggle('muted', muted);
      el.setAttribute('aria-pressed', String(muted));
      el.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
    });
  }
  private bind(action: string, fn: () => void) {
    this.root
      .querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`)
      .forEach((el) => el.addEventListener('click', fn));
  }
}
