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
}
const cup =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h13v9H4zM17 10h4v5h-4M3 21h16M7 2v4M12 1v5"/></svg>';
const sun =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 8h6v8H9zM11 1v4M11 19v4M1 11h4M19 11h4M4 4l3 3M17 17l3 3M4 20l3-3M17 7l3-3"/></svg>';
export class UI {
  root = document.querySelector<HTMLDivElement>('#ui')!;
  held = new Set<string>();
  isDialogue = false;
  private toastTimer?: number;
  private promptValue = '';
  constructor(private actions: UIActions) {}
  menu(hasSave: boolean) {
    this.held.clear();
    this.isDialogue = false;
    this.root.innerHTML = `
      <div class="menu-shade"></div>
      <header class="masthead"><a class="brand" href="#" aria-label="Pothe Pothe home">পথে পথে<span>POTHE POTHE</span></a><div class="edition"><span class="live-dot"></span> AN INDEPENDENT BANGLADESH ADVENTURE</div><button class="icon-button sound-button" data-action="mute" aria-label="Toggle audio">♫</button></header>
      <main class="main-menu">
        <div class="eyebrow"><span class="gold-line"></span> A LITTLE WAY HOME</div>
        <h1>POTHE<br><span>POTHE</span><span class="title-dot">.</span></h1>
        <p class="bengali-tag" lang="bn">চেনা পথ, নতুন গল্প।</p>
        <p class="menu-description">The warmth of a familiar street.<br>A cup of tea. A thousand little stories.</p>
        <button class="primary journey" data-action="new"><span>Begin your journey</span><span>→</span></button>
        <button class="continue" data-action="continue" ${hasSave ? '' : 'disabled'}>${hasSave ? 'Continue your journey' : 'Your story starts here'} <span>${hasSave ? '↗' : '01'}</span></button>
        <div class="menu-controls"><kbd>W A S D</kbd><span>move</span><kbd>E</kbd><span>interact</span><span class="touch-note">Touch controls on mobile</span></div>
      </main>
      <div class="scene-caption"><div class="caption-rule"></div><span>01 / DHAKA, BANGLADESH</span><h2>A street that feels like home.</h2><p>Late afternoon in the neighbourhood</p></div>
      <footer class="menu-footer"><span>CRAFTED WITH LOVE, ROOTED IN BANGLADESH</span><span class="milestone">FIRST PLAYABLE · v0.1</span><button data-action="credits">ABOUT & CREDITS <span>↗</span></button></footer>
      <div class="toast" role="status"></div><div id="modal-root"></div>`;
    this.bind('new', () => {
      if (hasSave) this.confirmNew();
      else this.actions.start(false);
    });
    this.bind('continue', () => this.actions.start(true));
    this.bind('mute', () => this.actions.mute());
    this.bind('credits', () => this.credits());
    this.root.querySelector('.brand')?.addEventListener('click', (e) => e.preventDefault());
  }
  private confirmNew() {
    this.modal(
      'A fresh beginning',
      'Starting a new journey replaces your local save. Your current story can still be continued if you go back.',
      `<button class="primary" data-action="confirm-new">Start a new journey</button><button class="secondary" data-action="cancel-new">Go back</button>`,
    );
    this.bind('confirm-new', () => this.actions.start(false));
    this.bind('cancel-new', () => this.closeModal());
  }
  hud(state: SaveData) {
    this.held.clear();
    this.isDialogue = false;
    this.promptValue = '';
    this.root.innerHTML = `
      <header class="hud-top"><div class="location"><div class="location-marker">◇</div><div><span class="eyebrow">DHAKA · LATE AFTERNOON</span><h2 id="place-name">${state.place === 'street' ? 'The neighbourhood' : 'Rahim Mama’s tea stall'}</h2><span class="location-bn" lang="bn">${state.place === 'street' ? 'আমাদের পাড়া' : 'রহিম মামার চায়ের দোকান'}</span></div></div><div class="hud-right"><div class="wallet"><span class="wallet-symbol">৳</span><div><small>POCKET MONEY</small><strong id="wallet">${state.wallet} <span>BDT</span></strong></div></div><button class="icon-button" data-action="mute" aria-label="Toggle audio">♫</button><button class="icon-button" data-action="pause" aria-label="Pause game"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg></button></div></header>
      <aside class="quest"><span class="quest-chapter">A LITTLE WAY HOME / 01</span><div class="quest-main">${cup}<div><strong id="quest-title">${state.cups ? 'A little taste of home' : 'First, a cup of tea'}</strong><p id="quest-copy">${state.cups ? 'Tea shared. A new story begun.' : 'Visit Rahim Mama’s tea stall.'}</p></div></div></aside>
      <div class="world-label"><span>রহিম মামার চা</span><small>RAHIM MAMA’S TEA STALL</small></div>
      <div class="interaction" id="interaction"><kbd>E</kbd><span>Enter tea stall</span><button data-action="interact" aria-label="Interact"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19L19 5M7 5h12v12"/></svg></button></div>
      <div class="bottom-help"><kbd>W A S D</kbd> Move <i>·</i> <kbd>E</kbd> Interact <i>·</i> <kbd>SHIFT</kbd> Run <i>·</i> <kbd>ESC</kbd> Pause</div>
      <div class="mini-map" aria-hidden="true"><span>N</span><div class="map-buildings"></div><div class="map-road"></div><div class="map-dot"></div><small>OLD DHAKA</small></div>
      <div class="touch-controls"><div class="dpad"><button data-dir="up" aria-label="Move up"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5L20 18H4Z"/></svg></button><button data-dir="left" aria-label="Move left"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5L20 18H4Z"/></svg></button><button data-dir="down" aria-label="Move down"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5L20 18H4Z"/></svg></button><button data-dir="right" aria-label="Move right"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5L20 18H4Z"/></svg></button></div><button class="touch-interact" data-action="touch-interact" aria-label="Interact">E<span>INTERACT</span></button></div>
      <div id="dialogue-root"></div><div id="modal-root"></div><div class="toast" role="status"></div>`;
    this.bind('pause', () => this.actions.pause());
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
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
        button.addEventListener(event, () => {
          this.held.delete(key);
          button.classList.remove('pressed');
        });
    });
  }
  update(state: SaveData) {
    const wallet = this.root.querySelector('#wallet');
    if (wallet && wallet.textContent !== `${state.wallet} BDT`)
      wallet.innerHTML = `${state.wallet} <span>BDT</span>`;
    const title = this.root.querySelector('#quest-title'),
      copy = this.root.querySelector('#quest-copy');
    if (title) title.textContent = state.cups ? 'A little taste of home' : 'First, a cup of tea';
    if (copy)
      copy.textContent = state.cups
        ? `${state.cups} cup${state.cups === 1 ? '' : 's'} enjoyed · Take a walk, stay a while.`
        : 'Visit Rahim Mama’s tea stall.';
    const dot = this.root.querySelector<HTMLElement>('.map-dot');
    if (dot) dot.style.left = `${Math.max(5, Math.min(90, (state.x / 1800) * 90))}%`;
  }
  prompt(text: string) {
    if (this.promptValue === text) return;
    this.promptValue = text;
    const el = this.root.querySelector<HTMLElement>('#interaction');
    if (el) {
      el.classList.toggle('visible', !!text);
      el.querySelector('span')!.textContent = text;
    }
  }
  dialogue(bn: string, en: string, result = false) {
    this.isDialogue = true;
    this.held.clear();
    const el = this.root.querySelector('#dialogue-root');
    if (!el) return;
    el.innerHTML = `<section class="dialogue" role="dialog" aria-modal="true" aria-label="Conversation with Rahim Mama"><div class="speaker-portrait"><canvas id="portrait" width="24" height="34"></canvas></div><div class="dialogue-content"><div class="speaker-heading"><strong>RAHIM MAMA <span lang="bn">রহিম মামা</span></strong><span class="voice-status">BENGALI SUBTITLES · VOICE NOT RECORDED</span><button data-action="close-dialogue" aria-label="Close conversation">×</button></div><p class="dialogue-bn" lang="bn">${bn}</p><p class="translation">${en}</p><div class="dialogue-choices">${result ? '<button data-action="another">Another cup?</button><button data-action="close-dialogue">Thank you, Mama →</button>' : '<button data-action="milk"><span lang="bn">দুধ চা</span> Milk tea <b>৳15</b></button><button data-action="lemon"><span lang="bn">লেবু চা</span> Lemon tea <b>৳10</b></button><button data-action="story">Tell me your story</button>'}</div></div></section>`;
    this.bind('milk', () => this.actions.order('milk'));
    this.bind('lemon', () => this.actions.order('lemon'));
    this.bind('story', () => this.actions.story());
    this.bind('close-dialogue', () => this.actions.closeDialogue());
    this.bind('another', () => this.actions.interact());
    this.root
      .querySelector<HTMLButtonElement>('.dialogue-choices button')
      ?.focus({ preventScroll: true });
  }
  voiceStatus(recorded: boolean) {
    const status = this.root.querySelector('.voice-status');
    if (status)
      status.textContent = recorded
        ? 'BENGALI VOICE · LICENSED RECORDING'
        : 'BENGALI SUBTITLES · VOICE NOT RECORDED';
  }
  closeDialogue() {
    this.isDialogue = false;
    const el = this.root.querySelector('#dialogue-root');
    if (el) el.innerHTML = '';
    this.held.clear();
  }
  portrait(canvas: HTMLCanvasElement) {
    const target = this.root.querySelector<HTMLCanvasElement>('#portrait');
    if (target) {
      const ctx = target.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, 0, 0);
    }
  }
  pause() {
    this.held.clear();
    this.modal(
      'Take a little breather.',
      'Your neighbourhood will be right here.',
      `<button class="primary" data-action="resume">Back to the street →</button><button class="secondary" data-action="save">Save journey</button><button class="secondary" data-action="menu">Save & main menu</button><p class="modal-footnote">Saved on this device · No account needed</p>`,
    );
    this.bind('resume', () => this.actions.resume());
    this.bind('save', () => this.actions.save());
    this.bind('menu', () => this.actions.menu());
  }
  credits() {
    this.modal(
      'Made for the little moments.',
      'POTHE POTHE is an original pixel-art love letter to Bangladesh. This first neighbourhood is a fictional interpretation of Old Dhaka.',
      `<div class="credits-copy"><p>Original pixel artwork and synthesized sound effects created for this project. Fonts: Press Start 2P and Noto Sans Bengali, SIL Open Font License.</p><p>Bengali dialogue includes English translations. Authentic voice recordings are not included yet. No paid services or reference images were used.</p><p>Tea purchases use fictional in-game BDT. No real money is processed.</p></div><button class="primary" data-action="close-credits">Back to the neighbourhood →</button>`,
    );
    this.bind('close-credits', () => this.closeModal());
  }
  private modal(title: string, copy: string, buttons: string) {
    const root = this.root.querySelector('#modal-root');
    if (root) {
      root.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${title}"><div class="eyebrow">${sun} POTHE POTHE</div><h2>${title}</h2><p>${copy}</p>${buttons}</section></div>`;
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
    const toast = this.root.querySelector('.toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3400);
  }
  sound(muted: boolean) {
    this.root.querySelectorAll<HTMLButtonElement>('[data-action="mute"]').forEach((el) => {
      el.textContent = muted ? '♪̸' : '♫';
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
