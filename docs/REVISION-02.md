# Revision 0.2 — district and visual overhaul

This replaces the original milestone's world structure and presentation. It is not a palette-only patch.

| Original milestone | Revision 0.2 |
| --- | --- |
| Horizontal 1800×360 scene with walking restricted to a narrow band | Continuous 1920×1400 outdoor map, two-axis camera, side paths and a complete district loop |
| Street and tea-stall interior | Four outdoor areas and two enterable interiors; six discoverable locations |
| Sparse street activity | Six named NPCs, twelve roaming pedestrians, two cats, bus/CNG/rickshaw traffic and a parked stand |
| 24×34 character texture | 36×54 protagonist, unique turquoise outfit/red scarf, six walk poses per direction and two idle poses |
| Muted foliage and repeated facades | Bright roof and wall families, stepped shaded canopy clusters, palms, low market kiosks, produce, flowers, banners, cables and signposts |
| Fixed-aspect canvas stretched fractionally | Full-window integer scaling, verified at desktop 2× and mobile 1× |
| Tiny text baked into world art | World-aligned native-size Bangla signs, separate English pixel text, native-size dialogue |
| Persistent quest panel and minimap | Compact location/wallet/tool strip, optional district map, contextual prompts |
| Tea transaction and local save | Retained tea payments, six-place discovery tracking, bookmark keepsake, version-two save with migration from milestone one |

## Review actual game captures

- Before: [original street](screenshots/street.png), [original interior](screenshots/interior.png).
- After: [tea courtyard](screenshots/v2/courtyard.png), [bazaar](screenshots/v2/bazaar.png), [residential lane](screenshots/v2/residential.png), [crossing](screenshots/v2/crossing.png), [lily pond](screenshots/v2/lily-pond.png).
- Interiors: [tea stall](screenshots/v2/tea-interior.png), [reading room](screenshots/v2/bookshop.png).
- Interface: [menu](screenshots/v2/menu.png), [dialogue](screenshots/v2/tea-dialogue.png), [district map](screenshots/v2/district-map.png), [mobile](screenshots/v2/mobile-courtyard.png).

These are captures of the production bundle using real movement and interactions. The capture script does not set player coordinates, teleport the camera or construct fake gameplay images. Original milestone captures remain for comparison.

## Verification

- Production build and TypeScript check passed.
- 13 unit tests passed: BDT purchases/refusal, save validation/recovery, legacy migration, keepsake persistence, diagonal speed, shared-collision reachability, district classification and an unobstructed main walking corridor.
- Three browser flows passed: the full six-place walking loop and both interiors; native mobile touch, tea purchase, pause and orientation change; integer rendering, compact HUD and migration.
- The full desktop route buys milk tea, meets Nila and collects her bookmark, visits the residential neighbour, returns via the rickshaw crossing, then saves and reloads all six discoveries.
- Final production capture tour also completed tea purchase and bookmark collection. Build retains the existing advisory for the full Phaser bundle size.

## Honest limits

One fictional district is implemented. Only the tea stall and reading room are enterable. Named conversations and exploration/keepsake progress are present; no larger quest chain or movie/meme systems were added. Human Bengali recordings, physical-device validation and a public Vercel deployment remain outstanding. No reference-image attachments were available, so exact reference-style fidelity was not evaluated. This visual direction should be judged from the actual captured game.
