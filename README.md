# POTHE POTHE · পথে পথে

A playable, original 2D pixel-art Bangladesh neighbourhood built with **Phaser 4.2.1, TypeScript 7, and Vite 8**. This is the first neighbourhood milestone, not a finished open-world game.

## Play locally

Requires Node.js **22.12+** (Node 24 used for validation).

```sh
npm ci
npm run dev
```

The game starts with a main menu. Begin a journey with ৳100, then enter the green tea stall directly behind your character. Walk up to Rahim Mama's counter and interact to buy milk tea (৳15), lemon tea (৳10), or hear his story. Purchases use fictional in-game BDT; no real payments are processed.

- **WASD / arrows:** move; **Shift:** run.
- **E:** enter, talk, or leave. Approach the doorway to interact.
- **Esc:** pause / resume, or close a conversation.
- **M:** toggle audio. Audio starts after a user gesture.
- **Mobile:** hold the directional buttons and tap E. Portrait and landscape layouts are supported.
- Pause offers **Save journey** and **Save & main menu**. Continue restores the last journey after a full browser reload.

## Implemented

- An explorable 1,800-pixel-wide fictional Old Dhaka street: Bengali shopfronts, tin roofs, fruit stall, laundry, electrical wires, bunting, flag, layered skyline, original trees, palms, and drifting leaves.
- Four-direction walking animation, acceleration, normalized diagonal movement, collision boundaries and furniture, a following camera, and responsive touch input with pointer capture.
- Moving decorated cycle rickshaws and CNG auto-rickshaws. Traffic yields when the player is in its path.
- A separate enterable tea-stall interior with shelves, biscuit display, stove, kettle, furniture, family portrait, Bengali menu board, and a tea seller behind the counter.
- Bengali dialogue with English translations, distinct milk/lemon tea purchases, BDT balance checks, cup progress, and a persistent first-tea objective.
- Original synthesized footstep, bird, bell, and cup effects; separate Master, Ambience, SFX and Voice buses, mute, and ambience ducking for recorded voice playback.
- Main menu, pause menu, credits, local autosave every 10 seconds and on transitions/purchases, manual save, versioned validation, last-good backup, and storage failure feedback.
- All shipped assets are local. No runtime third-party asset service or paid service is needed.

## Voice recordings: outstanding

**Authentic Bengali recordings are not included.** The game uses subtitles and labels their absence. There is no TTS pretending to be a recording. The integration and Bengali recording script are in [`public/audio/voice/README.md`](public/audio/voice/README.md). Add properly licensed recordings with speaker consent and provenance to `manifest.json` before enabling them.

## Validate

```sh
npm run build      # strict typecheck + production bundle
npm test           # 8 state/payment/save/input tests
npm run test:e2e   # 3 Chromium desktop/mobile browser flows
npm run preview   # serve the built dist directory
```

Browser tests use `/usr/bin/chromium` in this cloud environment. On another machine, set `CHROMIUM_PATH` to a Chromium executable, or install a Playwright browser with `npx playwright install chromium` and omit the executable path in `playwright.config.ts`.

The browser suite performs real key input and native emulated touch events, enters/exits the stall, purchases tea, reloads persisted progress, checks pause and world boundaries, hears the seller's story, and exhausts the wallet to verify rejection. It is not a pixel-perfect golden test. Physical-device testing and listening tests on headphones/speakers are still outstanding. Vite reports a large-chunk advisory for the full Phaser engine (approximately 375 KB gzip); the production build succeeds.

## Structure

- `src/art.ts`: original deterministic integer-grid pixel artwork and sprite frames. No image generation or reference attachments were used.
- `src/world.ts`: Phaser scene, camera, world/interior transitions, kinematic collisions, traffic, interaction and lifecycle.
- `src/state.ts`: pure currency transactions and defensive local save storage.
- `src/audio.ts`: Web Audio buses, original synthesized effects, and licensed-recording integration.
- `src/ui.ts` / `src/style.css`: responsive, keyboard-accessible menus, HUD, dialogue and touch controls.
- `docs/ART.md`: visual system and asset provenance.

## Deployment

`vercel.json` configures Vite and `dist`. Import this repository in an authorized Vercel account, or run `vercel` with an authenticated CLI to create a preview. No Vercel credentials or connected deployment tool were available during implementation, so **no hosted preview has been deployed**. The game is a static client application with no secrets or backend requirements.

## Scope

This milestone has one street and one tea-stall interior. Other shopfronts are scenery. It has no combat, quests beyond the first tea, larger-world travel, online accounts, cloud saves, recorded speech, or real-money checkout. Local progress belongs to the current browser origin and device; clearing browser storage removes it.
