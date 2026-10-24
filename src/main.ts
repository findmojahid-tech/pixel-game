import Phaser from 'phaser';
import { World } from './world';
import { Sideview } from './sideview/scene';
const legacy = new URLSearchParams(location.search).get('view') === 'district';
import './style.css';
/** Integer physical pixel scaling, including after orientation changes. */
function viewport() {
  const scale = Math.max(1, Math.min(3, Math.floor(Math.min(innerWidth / 640, innerHeight / 360))));
  return { scale, w: Math.ceil(innerWidth / scale), h: Math.ceil(innerHeight / scale) };
}
async function boot() {
  await Promise.all([document.fonts.load('18px Bengali'), document.fonts.load('10px Pixel')]);
  const v = viewport();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: v.w,
    height: v.h,
    backgroundColor: '#293e55',
    pixelArt: true,
    roundPixels: true,
    render: { antialias: false, pixelArt: true, roundPixels: true },
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH, zoom: v.scale },
    scene: [legacy ? World : Sideview],
    input: { activePointers: 4 },
    audio: { noAudio: true },
  });
  window.addEventListener('resize', () => {
    const next = viewport();
    game.scale.setZoom(next.scale);
    game.scale.resize(next.w, next.h);
    game.canvas.style.width = `${next.w * next.scale}px`;
    game.canvas.style.height = `${next.h * next.scale}px`;
    game.scale.refresh();
  });
}
void boot().catch((e) => {
  console.error(e);
  document.querySelector('#ui')!.innerHTML =
    '<div class="boot-error">The neighbourhood could not load. Please refresh in a browser with Canvas or WebGL support.</div>';
});
