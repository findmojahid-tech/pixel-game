# District 01 visual system · revision 0.2

## Technical frame

Phaser 4, 2D three-quarter street/cutaway interiors. Outdoor map 1920×1400; each interior 720×520. Viewport dimensions follow the window at an integer 1×, 2× or 3× pixel scale. No fractional CSS stretching of the game canvas. Main character frames are 36×54 (four directions, six walk poses and two idle poses); vehicles include 74×53 rickshaws/CNGs and a 132×77 bus.

The revised palette uses navy silhouettes, warm ochre and peach paving, turquoise/coral/lavender roofs, clear blue shadows and saturated foliage. Roof pitches, shutters, balconies, patterned lintels, striped fabric, market carts, flowers, books, kettles, utility poles, draped wires, flags and parked traffic build the district's identity. Layered images are sorted by ground position; tree canopies fade when they hide the protagonist.

Bangla signage is **not baked into the pixel textures**. Local Noto Sans Bengali renders at native CSS sizes on integer screen coordinates above its world signboard. Press Start 2P is used for English HUD/title text, also at native sizes. Dialogue translations use a normal readable text font. This avoids enlarging tiny anti-aliased text with the canvas.

## Places and visual identity

- Tea courtyard: warm brick, teal tin roof, a coral/cream awning, decorated round paving, benches, flowers, bunting and coconut palm.
- Bazaar: peach paving, mint bookstore, low market roofs, produce and fish counters, umbrella carts and pedestrians.
- Crossing: deep-blue asphalt, zebra crossings, mustard/red bus, green CNGs, decorated rickshaws, repairs and a lily pond.
- Residential lane: garden greens, pastel houses, laundry, flowers and a bakul-tree gathering place.
- Tea interior: warm plaster, timber counter, glass cups, kettle, newspaper tables and woven rug.
- Reading room: shelves of colourful books, reading table, sofa, book stacks and a keepsake interaction.

The written user direction supplied the target qualities. There were no attached reference images to inspect or copy. The actual gameplay captures are the review artifacts; an exact reference-style match is not claimed.

## Asset provenance

| Family | Source | Provenance / rights |
| --- | --- | --- |
| Ground, buildings, trees, palms, umbrellas, interiors | Original code in `src/art.ts` | Authored for this repository; no external image source |
| Character and NPC animation frames | Original code in `src/art.ts` | Authored for this repository |
| Traffic, cat, cup, utility decorations | Original code in `src/art.ts` and `src/world.ts` | Authored for this repository |
| Audio effects | Original Web Audio synthesis in `src/audio.ts` | Not authentic field recordings |
| Bengali voices | **Not present** | Licensed human recordings and speaker consent required |
| Press Start 2P | https://github.com/google/fonts/tree/main/ofl/pressstart2p | SIL OFL; notice in `public/fonts/PressStart2P-OFL.txt` |
| Noto Sans Bengali | https://github.com/google/fonts/tree/main/ofl/notosansbengali | SIL OFL; notice in `public/fonts/NotoSansBengali-OFL.txt` |

All assets run locally. No paid provider, reference attachment, 3D asset or emoji sprite was used. Screenshots are captures of the running game and are not source artwork.
