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
│   ├── material/     # finishes, A/B variants, material panel
│   └── settings/     # JSON settings export/import
└── shared/           # types, units, tabs, shared styles
e2e/                  # Playwright tests, with a fake WebXR device
```

Each feature keeps its components, hooks, logic, styles and unit tests together. Features may import each other; `shared/` imports none.

## Default models

The `.glb` files in [`src/features/models/defaults/`](src/features/models/defaults/README.md) are the models the app opens with, named after their files. If the folder is empty, the app falls back to a vase, bowl and plate generated in code. End-to-end tests always use the generated models (`VITE_MODELS=generated`).

## Accepted files

| Format  | Requirements                                                                                                                                                                              |
| :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.glb`  | glTF 2.0 binary, one file, meters, textures embedded (PNG, JPEG, WebP). Meshopt supported; Draco and KTX2 not. Over 300k triangles: simplified on load. Outside 1–60 cm: starts at 20 cm. |
| `.json` | Settings exported by the app (`ar-ceramic-designer/config`, version 1).                                                                                                                   |

Not supported: `.gltf` with separate files, `.obj`, `.fbx`, `.stl`.

## Test switches

| URL parameter       | Effect                                                          |
| :------------------ | :-------------------------------------------------------------- |
| `?debug=1`          | Performance and AR session diagnostics.                         |
| `?cube=1`           | Test cube in AR, 50 cm in front of the start position.          |
| `?layer=projection` | WebXR Layers projection layer (reproduces the S23 Ultra issue). |
