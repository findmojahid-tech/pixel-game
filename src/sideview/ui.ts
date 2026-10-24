import type { SideSession } from './state';
export interface SideActions {
  start(): void;
  interact(): void;
  hop(): void;
  pause(): void;
  resume(): void;
  save(): void;
  menu(): void;
  mute(): void;
  buy(tea: 'milk' | 'lemon'): void;
  story(): void;
  close(): void;
}
export class SideUI {
  root = document.querySelector<HTMLDivElement>('#ui')!;
  held = new Set<string>();
  dialogueOpen = false;
  menuOpen = false;
  private toastTimer?: number;
  private promptText = '';
  constructor(private actions: SideActions) {
    this.root.className = 'side-ui';
  }
  private shell() {
    return '<div class="sv-sign sv-tea-sign"><strong lang="bn">রহিম মামার চা</strong><small>RAHIM MAMA’S TEA</small></div><div class="sv-sign sv-river-sign"><strong lang="bn">নদীর ধারে</strong><small>BURIGANGA RIVER ROAD</small></div><div class="sv-room-menu" lang="bn"><strong>আজকের চা</strong><span>দুধ · ১৫ টাকা</span><span>লেবু · ১০ টাকা</span></div><div class="sv-toast" role="status"></div><div id="sv-dialogue"></div><div id="sv-modal"></div>';
  }
  menu(hasPosition: boolean, wallet: number) {
    this.menuOpen = true;
    this.dialogueOpen = false;
    this.held.clear();
    this.root.innerHTML = `${this.shell()}<div class="sv-menu-shade"></div><div class="sv-title"><p class="sv-kicker">SIDE-VIEW ART DIRECTION · 03</p><h1 lang="bn">পথে পথে</h1><h2>POTHE POTHE</h2><p class="sv-subtitle">A little way home, along the streets of Bangladesh.</p></div><div class="sv-menu-actions"><button class="sv-primary" data-action="start">${hasPosition ? 'Continue your walk' : 'Take a walk'} <span>→</span></button><a class="sv-fallback" href="?view=district">Revision 0.2 district</a><small>Your saved progress is preserved · ৳${wallet}</small></div><button class="sv-info" data-action="about" aria-label="About this art prototype">i</button>`;
    this.bind('start', () => this.actions.start());
    this.bind('about', () => this.about());
  }
  hud(session: SideSession) {
    this.menuOpen = false;
    this.dialogueOpen = false;
    this.held.clear();
    this.promptText = '';
    this.root.innerHTML = `${this.shell()}<header class="sv-hud"><div class="sv-location"><span class="sv-sun"></span><div><strong id="sv-location">Lalbagh Lane</strong><span id="sv-location-bn" lang="bn">লালবাগের পথ</span></div></div><div class="sv-tools"><div class="sv-wallet"><span lang="bn">৳</span><strong id="sv-wallet">${session.economy.wallet}</strong></div><button data-action="mute" aria-label="Toggle sound" class="sv-square"><svg viewBox="0 0 24 24"><path d="M3 10h4l5-5v14l-5-5H3ZM16 8q6 4 0 8"/></svg></button><button data-action="pause" aria-label="Pause game" class="sv-square"><svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg></button></div></header><div class="sv-prompt"><button data-action="interact"><kbd>E</kbd><span></span></button></div><div class="sv-route sv-route-west"><strong lang="bn">পুরনো পাড়া ←</strong><small>REVISION 0.2 DISTRICT · E</small></div><div class="sv-route sv-route-link"><strong lang="bn">নদীর পথ →</strong><small>RIVER ROAD · KEEP WALKING</small></div><div class="sv-route sv-route-east"><strong lang="bn">ঘাটের পথ →</strong><small>FUTURE DISTRICT · E TO READ</small></div><div class="sv-help">A / D <b>WALK</b> · SHIFT <b>RUN</b> · E <b>INTERACT</b> · SPACE <b>HOP</b></div><div class="sv-touch"><div class="sv-dpad">${['up', 'left', 'down', 'right'].map((d) => `<button data-dir="${d}" aria-label="Move ${d}"><svg viewBox="0 0 24 24"><path d="M12 5L20 18H4Z"/></svg></button>`).join('')}</div><button class="sv-touch-e" data-action="interact" aria-label="Interact">E</button></div>`;
    this.bind('interact', () => this.actions.interact());
    this.bind('pause', () => this.actions.pause());
    this.bind('mute', () => this.actions.mute());
    this.root.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((b) => {
      const key = b.dataset.dir!;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        this.held.add(key);
        b.classList.add('pressed');
        if (key === 'up') this.actions.hop();
      });
      for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
        b.addEventListener(name, () => {
          this.held.delete(key);
          b.classList.remove('pressed');
        });
    });
  }
  update(wallet: number, place: string) {
    const w = this.root.querySelector('#sv-wallet');
    if (w && w.textContent !== String(wallet)) w.textContent = String(wallet);
    const en = this.root.querySelector('#sv-location'),
      bn = this.root.querySelector('#sv-location-bn');
    if (en)
      en.textContent =
        place === 'tea' ? 'Rahim Mama’s' : place === 'river' ? 'River Road' : 'Lalbagh Lane';
    if (bn)
      bn.textContent =
        place === 'tea' ? 'রহিম মামার চা' : place === 'river' ? 'নদীর ধারে' : 'লালবাগের পথ';
  }
  layout(
    bounds: DOMRect,
    scale: number,
    camX: number,
    offset: number,
    place: string,
    playerX: number,
    playerY: number,
  ) {
    Object.assign(this.root.style, {
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
    });
    this.root.classList.toggle('sv-mobile', bounds.width < 600);
    const sign = (cls: string, x: number, y: number, w: number, show: boolean) => {
      const el = this.root.querySelector<HTMLElement>(cls);
      if (!el) return;
      el.hidden =
        !show ||
        (cls.startsWith('.sv-route') &&
          ((x - camX) * scale < 8 || (x - camX + w) * scale > bounds.width - 8));
      el.style.left = `${Math.round((x - camX) * scale)}px`;
      el.style.top = `${Math.round((y + offset) * scale)}px`;
      el.style.width = `${Math.round(w * scale)}px`;
      el.style.setProperty('--sv-sign-size', `${scale === 1 ? 17 : 24}px`);
    };
    sign('.sv-tea-sign', 307, 183, 140, place === 'street' && !this.menuOpen);
    sign('.sv-river-sign', 1300, 174, 92, place === 'street' && !this.menuOpen);
    sign('.sv-room-menu', 270, 82, 97, place === 'tea');
    sign('.sv-route-west', 22, 213, 145, place === 'street' && !this.menuOpen);
    sign('.sv-route-link', 817, 204, 168, place === 'street' && !this.menuOpen);
    sign('.sv-route-east', 1730, 190, 165, place === 'street' && !this.menuOpen);
    const p = this.root.querySelector<HTMLElement>('.sv-prompt');
    if (p) {
      p.style.left = `${Math.round((playerX - camX) * scale)}px`;
      p.style.top = `${Math.round(playerY * scale + 12)}px`;
    }
  }
  prompt(text: string) {
    if (this.promptText === text) return;
    this.promptText = text;
    const el = this.root.querySelector('.sv-prompt');
    if (el) {
      el.classList.toggle('visible', !!text);
      el.querySelector('span')!.textContent = text;
    }
  }
  dialogue(bn: string, en: string, kind: 'order' | 'result' | 'story' | 'neighbour' = 'order') {
    this.dialogueOpen = true;
    this.held.clear();
    this.prompt('');
    const choices =
      kind === 'order'
        ? '<button data-action="milk"><span lang="bn">দুধ চা</span> Milk tea <b>৳15</b></button><button data-action="lemon"><span lang="bn">লেবু চা</span> Lemon tea <b>৳10</b></button><button data-action="story">Your story?</button>'
        : kind === 'neighbour'
          ? '<button data-action="close">See you around</button>'
          : '<button data-action="another">Another cup?</button><button data-action="close">Thank you, Mama</button>';
    const root = this.root.querySelector('#sv-dialogue');
    if (root)
      root.innerHTML = `<section class="sv-dialogue" role="dialog" aria-modal="true" aria-label="${kind === 'neighbour' ? 'Conversation with a neighbour' : 'Conversation with Rahim Mama'}"><img class="sv-portrait" src="/assets/sideview/${kind === 'neighbour' ? 'pedestrian' : 'rahim'}-portrait.png" alt=""/><div class="sv-dialogue-body"><header><strong>${kind === 'neighbour' ? 'A neighbour' : 'RAHIM MAMA'} <span lang="bn">${kind === 'neighbour' ? 'পাড়ার মানুষ' : 'রহিম মামা'}</span></strong><button data-action="close" aria-label="Close conversation">×</button></header><p class="sv-bn" lang="bn">${bn}</p><p class="sv-translation">${en}</p><div class="sv-choices">${choices}</div></div></section>`;
    this.bind('milk', () => this.actions.buy('milk'));
    this.bind('lemon', () => this.actions.buy('lemon'));
    this.bind('story', () => this.actions.story());
    this.bind('another', () => this.actions.interact());
    this.bind('close', () => this.actions.close());
    root?.querySelector<HTMLButtonElement>('.sv-choices button')?.focus({ preventScroll: true });
  }
  close() {
    this.dialogueOpen = false;
    this.held.clear();
    const d = this.root.querySelector('#sv-dialogue');
    if (d) d.innerHTML = '';
  }
  pause() {
    this.held.clear();
    this.modal(
      'A little pause.',
      'Your walk and tea progress are saved on this device.',
      `<button class="sv-primary" data-action="resume">Back to the street →</button><button class="sv-secondary" data-action="save">Save walk</button><button class="sv-secondary" data-action="menu">Save & title screen</button><a class="sv-fallback" href="?view=district">Open the preserved revision 0.2</a>`,
    );
    this.bind('resume', () => this.actions.resume());
    this.bind('save', () => this.actions.save());
    this.bind('menu', () => this.actions.menu());
  }
  closeModal() {
    const e = this.root.querySelector('#sv-modal');
    if (e) e.innerHTML = '';
  }
  about() {
    this.modal(
      'A new point of view.',
      'An original, PNG-based side-view art direction prototype. Two outdoor sections and one enterable tea stall.',
      `<p class="sv-about-copy">Original image-assisted sprite families, normalized to a native pixel grid. AI-assisted animation still has repeated poses and needs a human pixel-animation pass. Bengali dialogue uses subtitles; human recordings remain missing. No reference artwork or copyrighted characters are used as game assets. Revision 0.2 and its save data remain available.</p><button class="sv-primary" data-action="about-close">Back to the title</button>`,
    );
    this.bind('about-close', () => this.closeModal());
  }
  private modal(title: string, copy: string, body: string) {
    const el = this.root.querySelector('#sv-modal');
    if (el) {
      el.innerHTML = `<div class="sv-modal-shade"><section class="sv-modal" role="dialog" aria-modal="true" aria-label="${title}"><small>POTHE POTHE · SIDE-VIEW REVIEW</small><h2>${title}</h2><p>${copy}</p>${body}</section></div>`;
      el.querySelector<HTMLButtonElement>('button')?.focus();
    }
  }
  toast(text: string) {
    const e = this.root.querySelector('.sv-toast');
    if (!e) return;
    e.textContent = text;
    e.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => e.classList.remove('show'), 3200);
  }
  sound(muted: boolean) {
    const b = this.root.querySelector<HTMLButtonElement>('[data-action="mute"]');
    if (b) {
      b.setAttribute('aria-pressed', String(muted));
      b.classList.toggle('muted', muted);
    }
  }
  private bind(action: string, fn: () => void) {
    this.root
      .querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`)
      .forEach((b) => b.addEventListener('click', fn));
  }
}
