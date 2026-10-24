# POTHE POTHE · পথে পথে

**District 01 — the neighbourhood edition.** A playable 2D Bangladesh adventure built with Phaser 4.2.1, TypeScript and Vite. Revision 0.2 replaces the first milestone's horizontal lane with a connected, two-axis district and a new visual system.

## Run

Node 22.12+ is required; Node 24 is pinned in `.nvmrc`.

```sh
npm ci
npm run dev
```

In this cloud environment, use `npm_config_cache=/tmp/pothe-pothe-npm npm ci` if the default home cache is unwritable.

## A neighbourhood, six places

The outdoor map is **1920 × 1400 native pixels**, with continuous routes and over 1.5 million collision-tested reachable square pixels. Four outdoor areas form a loop; two buildings open into their own interiors. There are no loading gates between the outdoor areas.

| Place | What to find | Connections |
| --- | --- | --- |
| Cha-er Adda | Tea courtyard, benches, flower seller, bunting | Bazaar east; crossing south; tea stall doorway |
| Shapla Bazaar | Fruit, fish and spice stalls, umbrella carts, pedestrians | Courtyard west; Bakul Lane south; reading-room doorway |
| Rickshaw Crossing | Yielding traffic, bus, rickshaw stand, repair shop, lily pond | Courtyard north; Bakul Lane east |
| Bakul Lane | Residential houses, gardens, laundry, a neighbour's story | Bazaar north; crossing west |
| Rahim Mama's tea stall | Counter, kettle, newspaper tables, Bengali conversation, milk/lemon tea | Courtyard |
| The Reading Room | Bookshelves, reading table, sofa, Nila's free bookmark | Bazaar |

Start at the tea courtyard. Walk north to Rahim Mama's doorway or east toward the bazaar. You can also head south toward the crossing and loop around through the residential lanes. **M opens the district map.** Discoveries, tea purchases and the bookmark persist.

## Controls

- **WASD / arrows:** walk; **Shift:** run.
- **E:** enter, talk or leave when the small prompt appears.
- **M / Tab:** open or close the district map.
- **Esc:** close dialogue, pause or resume.
- **V / sound button:** mute audio.
- **Mobile:** hold the directional controls and tap E. Portrait and landscape resizing are supported.

The pause menu provides manual saving and save-to-menu. Autosaves happen on transitions, purchases, discoveries and every 10 seconds. Continue restores the current location after a browser reload. Milestone-one saves migrate to the new courtyard while retaining money, tea progress and mute settings. Saves remain local to the current browser origin and device.

## What changed visually

- A bright ochre/coral/turquoise palette, navy outlines, stepped foliage, palm trees, varied roof heights, patterned lintels, market umbrellas, tiled courtyards, flower beds, balconies and local street details.
- A **36 × 54** protagonist with a turquoise outfit, red scarf, satchel, larger face, six walk poses and breathing/blinking idle poses. Named NPCs and twelve roaming pedestrians populate different activity pockets.
- Layered buildings and trees, transparent canopies when they hide the player, draped bunting, drifting leaves, cats, rickshaws, CNGs and a bus. Traffic yields to the player.
- Full-window, integer-scaled pixel rendering and smooth camera movement on both axes. Bangla signs render separately as native-size text aligned to world signboards, rather than being baked into low-resolution enlarged textures.
- A small location badge, wallet and map/pause controls replace the old quest panel and persistent minimap. Context prompts sit next to the character. Dialogue is shown only during conversations.
- Fast warm door fades, discovery chimes, brief particles, exact wallet feedback, and a visible tea cup after a purchase. Reduced-motion preferences suppress ambient animation and shorten particles.

Screenshots from actual gameplay are in [`docs/screenshots/v2`](docs/screenshots/v2); original milestone screenshots remain in [`docs/screenshots`](docs/screenshots). The capture script walks the district with real key input and enters buildings; it does not teleport the player or fabricate screenshots.

## Validate

```sh
npm run build      # TypeScript checking and production bundle
npm test           # state, migration, currency and collision-route tests
npm run test:e2e   # desktop district loop + touch/orientation + rendering/migration
npm run preview    # serve the built dist directory
npm run capture -- /tmp/pothe-pothe-v2  # requires an already running server
```

Browser tests use `/usr/bin/chromium`; override it with `CHROMIUM_PATH`. Set `CAPTURE_URL` when capturing the production preview instead of the development server.

The browser suite uses real keyboard input and native emulated touches. It visits all six areas in a loop, enters/exits both interiors, buys tea, talks to named NPCs, collects a bookmark, saves and reloads, checks pause, rotates the viewport and verifies integer pixel scaling. Unit route tests flood-fill the **same collision geometry and player footprint used in gameplay**, including every outdoor conversation spot and both entrances.

The Vite build still emits the full-Phaser-engine chunk-size advisory (about 382 KB gzip); it is not a build failure. Physical-device testing and headphone/speaker listening checks remain outstanding.

## Audio and provenance

All visual art is original, authored on an integer grid in `src/art.ts`; no reference images were available to inspect for this revision. Fonts ship locally with their SIL Open Font License notices. See [`docs/ART.md`](docs/ART.md).

**Authentic Bengali voice recordings are still missing.** Bengali dialogue has English translations. Web Audio supports licensed human recordings, voice/ambience ducking, mute, and original synthesized effects. [`public/audio/voice/README.md`](public/audio/voice/README.md) contains the recording script and manifest format. No synthetic speech is presented as an authentic recording.

## Deployment and scope

`vercel.json` configures the Vite build (`npm run build`) and `dist` output. The original milestone was pushed to GitHub, but Vercel authorization/network access was not available; this revision does not imply a public deployment. No paid service is required.

This is one fictional Old Dhaka district, not a full Bangladesh map. Two interiors are enterable; other buildings are scenery. Conversations, a six-place exploration journal, tea purchases and a bookmark keepsake are implemented. There is no combat, real-money checkout, online account, cloud save, movie/meme expansion or recorded speech. Tea costs fictional BDT (milk ৳15, lemon ৳10); a new journey begins with ৳100.
