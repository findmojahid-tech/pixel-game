# Original side-view asset family

These PNGs were created for POTHE POTHE using the session's image-generation tool, then normalized offline. No user-reference pixels, characters, logos or layouts were used as production textures. The four user-uploaded references were inspected for perspective, proportions, layering and visual principles only.

| Source PNG | Original production brief |
| --- | --- |
| facades.png | Side-elevation Old Dhaka apartment / illuminated tea stall / bookshop facade family; empty signboard; transparent silhouette |
| sky.png | Original Bangladesh river, hazy city and bright-cloud panorama for slow parallax |
| hero.png | Original brown-skinned protagonist, dark swept hair, teal panjabi, red gamcha, cream trousers, ochre satchel; six-column two-row walk/idle atlas |
| hero-original.png | First version of the protagonist atlas, retained to document iteration; not used by the game |
| vehicles.png | Original decorated cycle rickshaw and green CNG, three source frames each, side profile |
| interior.png | Original side-view tea-stall room, warm lamps, jars, radio, carved timber, kettle and blank menu board |
| props.png | Original palm, banyan, banana plants, lamp, bench and market-produce props |
| river.png | Original low riverside office, kiosk and pavilion facades; transparent silhouette |
| npcs.png | Original tea seller and pedestrian, three source poses each |

Production outputs live in `public/assets/sideview`; the manifest records source hashes, output hashes, exact frame dimensions and fixed foot baselines. `tools/build-sideview-assets.py` performs cropping, object isolation, registration, nearest-neighbour resizing, binary-alpha cleanup and 128-visible-colour palette normalization. It does not generate the illustrations. The tiny contact-shadow PNG is an authored pixel accent; the main game art is loaded from PNGs rather than drawn with runtime canvas primitives.

The source illustration drafts are not themselves uniformly native pixel grids. Palette/grid normalization makes the shipped textures crisp, but this is **AI-assisted pixel-style production**, not a claim of manually painted pixel art. In particular, repeated walk phases and subtle vehicle registration/material inconsistencies still require a human pixel-art cleanup pass. See `docs/sideview/ART-REVIEW.md` and `ASSET-PRODUCTION-PLAN.md`. These assets are for an art-direction prototype pending user approval.

Rebuilding the artwork is optional and requires Python, Pillow, NumPy and SciPy. Application install/build/test/deployment use the committed PNGs and do not invoke image generation or need paid services. Font licensing remains documented in public/fonts and docs/ART.md.
