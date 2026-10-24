# Side-view direction prototype — reference study

Branch starts at `c7babe1`. Revision 0.2 and its original branch remain the fallback. The attached ZIP was unpacked and all four JPGs were visually inspected before asset work. Its ART_DIRECTION.txt is reference context, subordinate to the user's request. No commands or instructions from it were executed.

The reference files are retained only in the local review workspace. They are not shipped to the public game or committed as production assets. Names and hashes identify the review inputs without redistributing their pixels.

| Reference | Observed visual principles | Prototype target |
| --- | --- | --- |
| 01 city character atmosphere | Promotional composition, expressive large face, intricate urban surfaces, warm hanging lights, foreground foliage and signs, layered people/architecture | Original detailed Old Dhaka facade PNGs, warm tea-shop interior, larger expressive protagonist; do not reproduce the poster's text, UI or layout |
| 02 bright coastal sideview | Eye-level flat ground, visible blue sky and distant horizon, palms, strong silhouette, comfortable horizontal traversal | River Road as a second outdoor section, separate river/sky and foliage layers, side-profile traffic and actor |
| 03 forest dialogue | Foreground/midground/distant silhouettes, local character outlines, portrait-led compact dialogue | Independently moving PNG parallax planes, actor-readable foreground, integrated Bengali/English conversation panel |
| 04 sprite run sequence | Stable head volume, readable side-profile hands/feet, controlled outlines, consistent costume and ground registration | Six registered walking frames and six idle frames, cloth/scarf movement, fixed foot baseline; evaluate repetition and temporal stability honestly |

Technical frame: 640×360 reference composition, PNG assets on a single native pixel grid; integer 1×–3× display scaling. Taller/mobile viewports reveal extra sky/foreground without fractionally stretching the art. Hero frame 88×96 with 80px visual height and fixed 90px baseline. Vehicles and NPCs are separate sheets. Side-on movement stays on a floor plane; the existing overhead district is a separate presentation, not silently converted.

Production method: original image-gen artwork created from text descriptions of Bangladesh architecture, costume, vegetation and the observed principles. Original high-resolution PNGs are retained in assets/sideview/source. Offline normalization slices, registers, resizes with nearest sampling, enforces binary transparency and quantizes each family to 128 colours. Runtime uses these shipped PNGs; it does not draw the main buildings, protagonist, trees or vehicles from canvas primitives.

This is AI-assisted asset production, not a claim of manually drawn pixel art. Generated animation and small material clusters need in-game review. Do not declare reference-quality parity from source images alone. The final comparison report records actual captures, strengths, failures and the remaining human pixel-art cleanup plan.
