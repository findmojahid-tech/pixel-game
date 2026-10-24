# POTHE POTHE · পথে পথে

**Revision 0.3 — side-view art-direction prototype, pending graphics approval.** Phaser 4.2.1, TypeScript and Vite. This review branch starts at `c7babe1` and preserves revision 0.2 as a working fallback.

The default game is now a real side-scrolling Bangladesh street with original PNG sprite families, two connected outdoor sections and an enterable tea stall. It is not a static concept-art page. The original overhead district remains playable with `?view=district` and its original branch remains unchanged.

## Run and play

Node 22.12+ (Node 24 pinned in `.nvmrc`).

```sh
npm ci
npm run dev
```

In this cloud environment use a writable npm cache when needed: `npm_config_cache=/tmp/pothe-pothe-npm npm ci`.

- **A/D or left/right:** walk; **Shift:** run.
- **E:** enter the tea stall, talk, leave or read a connection. Near the delivery crate, E also hops.
- **Space/W/up:** hop. Collision prevents walking through the delivery crate; hopping clears it.
- **Esc:** close dialogue, pause or resume. **V:** mute.
- **Mobile:** hold left/right on the existing D-pad, tap up to hop and E to interact.
- The pause menu saves the walk or returns to the title. Continue restores it after reload.

Start near Rahim Mama's tea-stall entrance. Enter, walk right to the seller, and press E. Milk tea costs fictional BDT 15 and lemon tea BDT 10. To leave, walk to the left doorway and interact. Continue right along the street, hop the delivery crate, and explore River Road. The far-right sign marks a future connection, not an implemented extra district. The west connection and title-screen link open the preserved revision 0.2.

## What is implemented

- A side-on floor plane and horizontally following, pixel-snapped camera.
- Detailed original Old Dhaka facades, bright sky/river/city layer, tropical foliage, street lights, bench and produce PNGs. Background, foliage, facades and foreground use different scroll factors.
- A larger original side-profile protagonist (80px visual height), six walk frames and six breathing/blink idle frames.
- Original side-profile rickshaw and CNG sheets, moving rear-lane traffic, pedestrians and an animated tea seller.
- A detailed warm tea-stall interior, Bengali dialogue with English translation, existing BDT purchase/refusal logic and local save/load.
- Native-size Bengali exterior signs/menu board, compact English pixel HUD, context prompts and touch controls.
- Two outdoor sections and one interior only. The rest of revision 0.2 was **not** converted.

## Art acceptance is still open

All four attached references were inspected before asset production. The new PNG-based presentation is a substantial method/perspective change, but **reference-quality parity is not claimed**. The generated walk sheet still repeats phases; a human pixel-animation pass is required for Reference 04's consistency and movement quality. Vehicle cycles and some dense material/edge clusters also need cleanup. See [art review](docs/sideview/ART-REVIEW.md), [reference study](docs/sideview/ART-DIRECTION.md) and [remaining asset plan](docs/sideview/ASSET-PRODUCTION-PLAN.md).

The original high-resolution image-assisted PNGs are retained in `assets/sideview/source`; normalized runtime PNGs and frame metadata are in `public/assets/sideview`. Main visual assets are not generated from canvas rectangles at runtime. The four copyrighted user references are reference-only and are not shipped as game textures or committed to the public repository. Local side-by-side review artifacts keep originals clearly separated from real gameplay captures.

## Saves and fallback

The existing validated revision-0.2 save remains authoritative for money, tea count, mute, bookmark and district discoveries. Side-view transactions reuse `orderTea` and update that economy without changing the old saved world/place/coordinates. Side-view coordinates/discoveries use a separate versioned key, `pothe-pothe.sideview.v1`, with last-good backup. Entering the prototype does not reset the existing BDT balance. A genuinely fresh save starts at BDT 100.

Open `?view=district` or use the title link to play revision 0.2. Its complete six-area map, two interiors, NPCs, bookmark and controls remain available. See [revision 0.2 report](docs/REVISION-02.md).

## Verify and capture

```sh
npm run build            # typecheck and production bundle
npm test                 # state/economy/preservation and PNG integrity checks
npm run test:e2e         # both presentations; keyboard/mobile/native-resolution checks
npm run assets:validate  # independent PNG alpha, colour and frame-registration QA
npm run preview          # serve dist
npm run capture -- /tmp/pothe-sideview-captures
npm run capture:district -- /tmp/pothe-district-captures
```

Browser tests build and serve a fresh production bundle. Set `PLAYWRIGHT_BASE_URL` to test a deployed preview instead. Capture scripts require a running server; set `CAPTURE_URL` to its address (including an authorized preview URL) and optionally `CHROMIUM_PATH`. Captures use real controls, not player teleports or fabricated gameplay images. PNG rebuilding is optional and requires Python/Pillow/NumPy/SciPy; standard Vite builds use the committed images. Raw asset provenance is in [SOURCES.md](assets/sideview/SOURCES.md).

All deployment work is review-only. `vercel.json` retains `npm run build` and `dist`; the existing Vercel Git integration can preview this new branch. No main merge or production promotion is authorized. No paid services were purchased, and no Dhallywood/Meme Mode features were implemented.

Authentic Bengali voice recordings are still missing. Existing recorded-voice integration and original synthesized effects remain; see `public/audio/voice/README.md`. Physical-device/Safari testing and human listening checks remain outstanding. The build retains the full-Phaser-engine size advisory.
