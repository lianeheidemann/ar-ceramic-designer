# app

React + Three.js web app, built with Vite and deployed to GitHub Pages.

## Structure

```
app/
├── index.html
├── vite.config.ts      # GitHub Pages base path
├── public/             # icons, models (.glb), textures
├── e2e/                # Playwright tests (viewer, and AR with a fake WebXR device)
└── src/
    ├── App.tsx         # root component and app state
    ├── components/     # React UI (viewer, controls, tabs, comparison)
    ├── viewers/        # Three.js scene, GLB loading, simplification
    ├── ar/             # WebXR session (immersive-ar + hit-test)
    ├── geometry/       # lathe-profile pieces
    ├── materials/      # finishes and A/B variants
    ├── data/           # model catalog
    ├── hooks/          # AR support, media queries
    ├── types/          # shared types
    └── utils/          # units, JSON settings, .glb import, downloads
```

Unit tests (`*.test.ts`) sit next to the code they test.

## Commands

```bash
npm install
npm run dev           # dev server
npm run build         # typecheck + build
npm test              # Vitest
npm run test:e2e      # Playwright (first: npx playwright install chromium)
npm run lint          # Oxlint
npm run format        # Prettier
```

AR needs HTTPS.

## Test switches

Add to the URL:

| Switch              | Effect                                                                         |
| :------------------ | :----------------------------------------------------------------------------- |
| `?debug=1`          | Panel with fps, draw calls, GPU memory (3D viewer) and AR session diagnostics. |
| `?cube=1`           | Test cube in AR, 50 cm in front of the start position.                         |
| `?layer=projection` | Uses a WebXR Layers projection layer, to reproduce the S23 Ultra issue.        |
