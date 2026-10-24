# Visual system and provenance

## Technical frame

2D, front-facing three-quarter street and cutaway interior. Native viewport 640×360 on desktop/landscape, 360×360 on portrait mobile. Street world 1800×360; interior 640×360. Player frames 24×34, 4 directions × 4 poses. Vehicles 74×53. All sprite/terrain art is authored directly on an integer pixel grid in `src/art.ts`. Camera and renderer use round pixels, nearest filtering, and CSS pixelated scaling. Fonts and menus are rendered separately for legibility.

## Art direction

Warm late-afternoon ochre, tea-brown brick, rich green shutters, dusty teal road shadows, peach sky, and a desaturated layered skyline. Dark green outlines replace black. Top-left highlights, stepped silhouettes, corrugated tin lines, window mullions, woven/clay textures, mango piles, and worn plaster make each storefront distinct. The hero stall has a red/cream awning and a Bengali sign. Rickshaws have ornamental panels, a peaked canopy, pedals and spoked wheels; CNGs have green enclosed bodies, windscreens and headlamps.

This initial visual target was selected from the user's direction and inspected in actual desktop and mobile Chromium captures. It is an original fictional neighbourhood, not a geographic reconstruction.

## Asset manifest

| Asset family | Source | Terms / provenance | Runtime role |
| --- | --- | --- | --- |
| Street / shops / skyline | Original code in `src/art.ts` | Authored for this repository; no external image source | Static scenery / walkable street |
| Interior / counter / furniture | Original code in `src/art.ts` | Authored for this repository | Separate location with furniture collision |
| Trees / palms / leaves | Original code in `src/art.ts` | Authored for this repository | Layered foliage / ambient motion |
| Player / seller | Original code in `src/art.ts` | Authored for this repository | Animated player / dialogue seller |
| Rickshaw / CNG | Original code in `src/art.ts` | Authored for this repository | Moving yielding traffic |
| Sound effects | Original Web Audio synthesis in `src/audio.ts` | Authored for this repository; not field recordings | Footsteps / bird / bell / cup |
| Bengali voices | **Not present** | Licensed recordings and speaker consent required | Empty manifest, subtitle fallback |
| Press Start 2P | https://github.com/google/fonts/tree/main/ofl/pressstart2p | SIL OFL 1.1; notice in `public/fonts/PressStart2P-OFL.txt` | Pixel title / numerals |
| Noto Sans Bengali | https://github.com/google/fonts/tree/main/ofl/notosansbengali | SIL OFL 1.1; notice in `public/fonts/NotoSansBengali-OFL.txt` | Bengali interface / shop signage |

Fonts were downloaded via verified HTTPS from the Google Fonts repository. No paid provider, image-reference attachment, unlicensed recording, emoji sprite, 3D asset, or remote runtime font was used. Source artwork remains editable code; textures are generated once at startup rather than downloaded.
