# Step-by-Step Guide

**Status (2026-10-30):** steps 0–9 done in `app/`; AR placement confirmed on the Galaxy S23 Ultra (Chrome, Android 16). Step 10 almost done: performance numbers and AR media left.

| #   | Step                                              | Status | Where                                                                           |
| :-- | :------------------------------------------------ | :----- | :------------------------------------------------------------------------------ |
| 0   | Decisions (meters inside, frontend only)          | ✅     | —                                                                               |
| 1   | Vite + React + Three.js project                   | ✅     | `app/`                                                                          |
| 2   | Code structure                                    | ✅     | [`app/README.md`](../app/README.md)                                             |
| 3   | Sample models (lathe profiles, MIT)               | ✅     | `src/data/catalog.ts`, `src/geometry/`                                          |
| 4   | 3D viewer                                         | ✅     | `src/viewers/CeramicViewer.ts`                                                  |
| 5   | Finishes and reset                                | ✅     | `src/materials/`                                                                |
| 6   | A/B comparison                                    | ✅     | `src/components/CompareView.tsx`                                                |
| 7   | AR (WebXR hit-test)                               | ✅     | `src/ar/`                                                                       |
| 8   | JSON export/import, PNG, `.glb` import, real size | ✅     | `src/utils/`, `src/viewers/gltfLoader.ts`, `src/components/RealSizeControl.tsx` |
| 9   | Performance and accessibility                     | ✅     | `CeramicViewer.ts`, `Viewer.tsx`                                                |
| 10  | Testing and delivery                              | 🔄     | below                                                                           |
| 11  | Capacitor packaging (Android/iOS)                 | —      | optional                                                                        |
| 12  | Geometric checks, more presets                    | —      | optional                                                                        |

## Notes

- **AR layer fix:** Three.js renders into a WebXR Layers projection layer when the browser offers one. On the S23 Ultra nothing drawn there showed over the camera, so the session always uses a classic `XRWebGLLayer` (`hideProjectionLayers()` in `src/ar/arSession.ts`).
- **Test switches:** `?debug=1` (diagnostics), `?cube=1` (test cube), `?layer=projection` (reproduces the layer bug). `npm run test:e2e` runs the AR flow with a fake WebXR device.
- **Settings JSON:** schema `ar-ceramic-designer/config` v1 with model id, dimensions and materials A/B; validated on import.
- **`.glb` import:** detected by its first bytes; parsed once to check and measure it, then kept as an object URL for the session. Meshopt is decoded; Draco and KTX2 are named in the error. Pieces stand on their base at the origin; oversized pieces start at 20 cm; **Real size** (any model) and − / + in AR set the height; meshes over 300k triangles are simplified with meshoptimizer (borders locked, cached per file). Finish controls multiply the file's own values.
- **Performance:** on-demand rendering, pixel ratio capped at 2, WebGL context-loss recovery, GPU memory checked flat over repeated model switches (e2e).

## 10. Testing and delivery

- [x] Dev server and build succeed (CI on every push).
- [x] Imported `.glb` models load with their textures, also placed in AR on the S23 Ultra.
- [x] Camera with mouse, keyboard and touch.
- [x] Material changes and reset.
- [x] Piece size: **Real size** field and − / + in AR (tested on the S23 Ultra).
- [x] JSON export/import round trip.
- [x] AR detection and fallback.
- [x] AR placement on a compatible Android browser.
- [x] Exit AR without breaking the viewer.
- [x] Clear errors and loading states.

**Delivery:** ✅ deployed to GitHub Pages (`.github/workflows/deploy.yml`); README with requirements, limitations and licenses ✅; AR screenshots/video and S23 Ultra performance numbers (`?debug=1`) still to add.
