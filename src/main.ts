import Phaser from 'phaser';
import { World } from './world';
import './style.css';
async function boot() {
  await Promise.all([document.fonts.load('12px Bengali'), document.fonts.load('12px Pixel')]);
  const viewportWidth = () =>
    window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches ? 360 : 640;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: viewportWidth(),
    height: 360,
    backgroundColor: '#163b3b',
    pixelArt: true,
    roundPixels: true,
    render: { antialias: false, pixelArt: true, roundPixels: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [World],
    input: { activePointers: 4 },
    audio: { noAudio: true }, // AudioSystem owns the Web Audio mix graph.
  });
  window.addEventListener('resize', () => {
    const width = viewportWidth();
    if (game.scale.gameSize.width !== width) game.scale.setGameSize(width, 360);
  });
}
void boot().catch((error) => {
  console.error(error);
  document.querySelector('#ui')!.innerHTML =
    '<div class="boot-error">The street could not load. Please refresh in a browser with Canvas or WebGL support.</div>';
});
