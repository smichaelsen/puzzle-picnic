# Puzzle Picnic

A touch-first, offline-friendly browser jigsaw game for children. Choose one of twelve original scenes and play with 24, 96, or 192 mathematically matched jigsaw pieces.

Play it at **https://smichaelsen.github.io/puzzle-picnic/**.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. For a production check:

```bash
npm test
npm run lint
npm run build
```

Puzzle progress and solved-scene unlocks are saved in local storage. Complete two pictures in each three-scene bucket to unlock the next set. No backend or runtime network service is required.
