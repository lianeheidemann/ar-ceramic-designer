# AR Ceramic Designer — app

React, TypeScript and Three.js, built with Vite and deployed to GitHub Pages from `main`.

## Getting started

```bash
npm install
npm run dev           # development server
npm run build         # type check and production build
npm test              # unit tests (Vitest)
npm run test:e2e      # end-to-end tests (Playwright; first: npx playwright install chromium)
npm run lint          # Oxlint
npm run format        # Prettier
```

AR needs HTTPS; the dev server on `localhost` works for desktop testing only.

## Structure

```
src/
├── main.tsx          # entry
├── index.css         # imports each feature's stylesheet, in cascade order
├── app/              # shell: layout, header, theme, panel tabs
├── features/
│   ├── viewer/       # Three.js scene, GLB loading, 3D viewer UI, A/B comparison
│   ├── ar/           # WebXR session, AR overlay, diagnostics
│   ├── models/       # default models, .glb import, real size, model list
│   └── material/     # finishes, A/B variants, material panel
└── shared/           # types, units, tabs, downloads, shared styles
e2e/                  # Playwright tests, with a fake WebXR device
```

Each feature keeps its components, hooks, logic, styles and unit tests together. Features may import each other; `shared/` imports none.

## Default models

The `.glb` files in [`src/features/models/defaults/`](src/features/models/defaults/README.md) are the models the app opens with, named after their files. If the folder is empty, the app falls back to a vase, bowl and plate generated in code. End-to-end tests always use the generated models (`VITE_MODELS=generated`).

## Accepted files

The app works only with `.glb` (glTF 2.0 binary): one file, in meters, with embedded textures (PNG, JPEG or WebP). Meshopt compression is supported; Draco and KTX2 are not. Meshes over 300k triangles are simplified on load, and pieces outside 1–60 cm start at 20 cm.

Not supported: `.gltf` with separate files, `.obj`, `.fbx`, `.stl`.
