# Asset provenance

Puzzle Picnic has no third-party runtime artwork, icon packs, fonts, or sound files.

## Scene illustrations

The nine bundled scene illustrations were created specifically for this project on 9 August 2026 with OpenAI's built-in image-generation tool, using prompts written for this project. They are stored as static WebP files and no image-generation service is used during gameplay.

- `public/scenes/seaside-friends.webp` — “Seaside Friends”
- `public/scenes/moonlight-music.webp` — “Moonlight Music”
- `public/scenes/sky-garden.webp` — “Sky Garden”
- `public/scenes/pocket-raceway.webp` — “Pocket Raceway,” mid-century screen-print and gouache race-car scene
- `public/scenes/coral-carnival.webp` — “Coral Carnival,” layered cut-paper ocean scene
- `public/scenes/dinosaur-valley.webp` — “Dinosaur Valley,” watercolor and colored-pencil prehistoric scene
- `public/scenes/little-moon-base.webp` — “Little Moon Base,” handcrafted clay-diorama space scene
- `public/scenes/market-morning.webp` — “Market Morning,” linocut and tapestry-inspired village scene
- `public/scenes/aurora-camp.webp` — “Aurora Camp,” luminous ink-wash and chalk-pastel Arctic scene

The prompts requested original, unbranded children's-book scenes and explicitly excluded copyrighted characters, logos, text, watermarks, and painted puzzle seams. The generated outputs are used under the rights granted to the project owner by the applicable OpenAI terms.

## Interface and sound

- Interface symbols are Unicode characters rendered by the operating system's font stack.
- All other interface graphics, jigsaw paths, confetti, and effects are drawn in CSS or Canvas by project code.
- Placement and completion sounds are synthesized at runtime with the Web Audio API; there are no bundled sound recordings.
