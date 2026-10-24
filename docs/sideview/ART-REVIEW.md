# Side-view art gate — review prototype, not approved final art

All four actual user JPGs were unpacked and visually inspected before any V3 art changes. The ZIP's text note was treated as contextual reference material, not as instructions overriding the user's request. Hashes are recorded in reference-inputs.json. Original reference pixels are kept in the private local comparison workspace; none are included in the public game assets.

The new presentation uses original image-assisted PNG families, not the old canvas-shape facade/character generator. Native gameplay captures are 640×360 at 1×; larger screenshots use integer pixel scaling. The original district is still playable at `?view=district` and remains unchanged on `review/visual-overhaul`.

## Reference-by-reference comparison

| Reference | What the actual prototype demonstrates | Remaining gap / acceptance status |
| --- | --- | --- |
| **01 — atmospheric urban illustration** | Side-elevation Old Dhaka architecture, carved balconies, weathered brick/timber, warm shop lamps, detailed tea interior, expressive original protagonist, separate foreground props and traffic. Large face and traditional teal panjabi/red gamcha replace the overhead icon-like character. | **Direction demonstrated, not parity established.** The reference is a promotional illustration with a large celebratory gesture, not a playable frame. This prototype has no equivalent tea-holding/emote animation; some dense source texture clusters need a deliberate pixel cleanup pass. |
| **02 — bright tropical side-scroller** | Visible blue sky, clouds, river/city horizon, palms and flat walking baseline. Lalbagh Lane connects continuously to a visually distinct low riverside frontage. Player and vehicles are true side profiles. | **Perspective/depth target demonstrated.** Our warm urban material palette and higher texture density differ from the reference's simpler coastal shapes. Sky/river are one slow layer; a separate boat/cloud plane is future polish. |
| **03 — layered scene and dialogue** | Background, foliage, facade and foreground PNG planes scroll at different rates; dialogue uses the current NPC's sprite portrait, legible Bengali and English translation. A normal game camera and actual movement drive the images. | **Partially aligned.** Dialogue/font hierarchy is functional and verified, but the urban background is denser than the reference's strong forest silhouettes. Physical-device typography review and additional character/background value separation are still useful. |
| **04 — consistent side-view cycle** | Six PNG walk frames and six idle frames, fixed 90px foot baseline, controlled dimensions, stable face/outfit, blink/breathing, real frame playback, matching left/right flip. Independent PNG validation checks binary alpha, colour budget and frame bounds. | **Not fully met.** The image-assisted walk still repeats some contact/passing phases. Registration and sprite integrity do not prove a natural six-phase cycle. Vehicle pedal/wheel cycles are also limited. A human pixel animator must repaint the phase progression before claiming this reference's animation quality. |

## Readability, scale and motion checks

The protagonist is 80 native pixels tall in a 640×360 reference composition, with a large readable face. Main sheets use a common cell/baseline; the normalization report records every frame. English UI uses a local pixel font. Bengali signs and menu text render separately at native CSS sizes, snapped to world positions; they are not enlarged anti-aliased text baked into a background PNG.

The game uses integer display scaling and a horizontally pixel-snapped camera. Tall mobile viewports extend sky/foreground rather than stretching the PNGs fractionally. Traffic and pedestrians are separately animated PNG sprites. Main architecture, vegetation, props and interiors load from PNGs. A tiny contact-shadow accent is authored offline, not a substitute for the main art.

A native-resolution capture check identified a clipped interaction prompt. The scene floor framing was moved up to reserve enough UI space, and a regression check verifies the full prompt stays within 640×360. Partially visible floating connection labels are hidden until their full sign is in frame.

Keyboard hints now hide while a contextual prompt or dialogue is visible, preventing native-resolution text overlap. The tea-menu labels fit their painted board without wrapping outside it.

## Gameplay and preserved systems

Actual browser input verifies both outdoor sections, the enterable tea stall, milk/lemon payments, dialogue, camera/parallax, solid delivery-crate collision and hop traversal, position save/load, mobile touch and orientation. A seeded revision-0.2 save confirms its place/coordinates, bookmark and discoveries survive a side-view tea transaction; only the intended economy fields change. The original six-area district remains testable separately.

## Gate decision

**Keep the art gate open.** This is a working side-view direction prototype with a substantially different production method, perspective and asset detail. It is not evidence that all four reference quality targets have been achieved. Do not merge to main, promote to production, or convert the remaining district based on this report. Use the actual side-by-side reference/game captures for user review, then apply the concrete [asset production plan](ASSET-PRODUCTION-PLAN.md), led by the protagonist animation cleanup.

AI-assisted source/normalization provenance is in assets/sideview/SOURCES.md. Human Bengali recordings remain missing. No Dhallywood/Meme Mode, paid service purchase or production deployment is part of this revision.
