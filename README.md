<p align="center">
  <img src="assets/icon-ar-ceramic-designer.png" alt="AR Ceramic Designer icon" width="110" />
</p>

<h1 align="center">AR Ceramic Designer</h1>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Three.js-111111?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/WebXR-005A9C?style=flat-square&logo=webxr&logoColor=white" alt="WebXR" />
<br>
  <a href="https://github.com/lianeheidemann/ar-ceramic-designer/actions/workflows/ci.yml?query=branch%3Adevelop"><img src="https://img.shields.io/github/actions/workflow/status/lianeheidemann/ar-ceramic-designer/ci.yml?branch=develop&style=flat-square&logo=githubactions&logoColor=white&label=CI" alt="CI status — develop" /></a>
  <a href="https://github.com/lianeheidemann/ar-ceramic-designer/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/lianeheidemann/ar-ceramic-designer/deploy.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=Deploy" alt="Deploy status — main" /></a>
  <a href="https://lianeheidemann.github.io/ar-ceramic-designer/"><img src="https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-238636?style=flat-square&logo=githubpages&logoColor=white&labelColor=22272e" alt="Open GitHub Pages" /></a>
</p>

A web app, live on GitHub Pages, to view ceramic pieces in 3D, change their finish, compare two variants and, on supported phones, place them in augmented reality.

> AR tested on the Galaxy S23 Ultra (Chrome, Android 16).

<p align="center">
  <img width="100%" src="assets/interface/interface-ar-ceramic-designer-v6.webp" alt="App interface">
</p>

## Features

- 3D viewer with a vase, bowl and plate: turn, zoom, reset.
- Import your own `.glb` model (**Settings → Import**); **×** removes it from the list.
- Finishes (matte, glossy, glazed), color, roughness and metalness; A/B comparison.
- AR (WebXR): a ring marks the surface, a tap places the piece at real size, another tap moves it; **−** / **+** change its height by 1 cm.
- Export/import settings as `.json`; save a PNG of the 3D view.
- Keyboard camera (arrows, `+`/`−`, Home), visible focus, reduced motion, on-demand rendering.

## Supported 3D files

- A single binary **`.glb`** (glTF 2.0), optionally **Meshopt**-compressed (gltfpack, Tripo).
- Textures embedded as PNG, JPEG or WebP.
- Units in meters. Pieces outside 1–60 cm (AI generators export about 1 m) start with a largest side of 20 cm; adjust in **Models → Real size** or in AR.
- Meshes over 300k triangles are simplified on load; the file is not changed.
- Not accepted: `.gltf` with separate files, `.obj`/`.fbx`/`.stl`, Draco compression, KTX2 textures. The app says what is missing.
- Imported models stay in the browser until the page reloads.

## Requirements

- **3D viewer:** a WebGL 2 browser (Chrome, Edge, Firefox, Safari 15+).
- **AR:** an [ARCore-supported](https://developers.google.com/ar/devices) Android phone with Chrome 81+, over HTTPS, with camera permission.
- **iPhone/iPad:** Safari has no WebXR yet, so only the 3D viewer works.

## Known limitations

- On imported models, color, roughness and metalness multiply the file's own values (color tints textures).
- A `.json` saved for an imported model opens only after the same `.glb` is imported again.
- PNG capture covers the 3D view only, not the AR camera.
- Performance on the phone is not measured yet (open the app with `?debug=1`).

## License

MIT. The vase, bowl and plate are generated in code by this project.

## Docs

[Step-by-step guide](docs/step-by-step.md) · [Development plan](docs/development-plan.md) · [References](docs/references.md) · [Live demo](https://lianeheidemann.github.io/ar-ceramic-designer/)
