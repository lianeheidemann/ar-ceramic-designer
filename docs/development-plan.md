# Development Plan

**Goal:** a light web app to view, customize and place ceramic pieces in AR. Target device: Galaxy S23 Ultra (Android 16).

**Stack:** TypeScript, React, Vite, Three.js, WebXR. Later, maybe: Capacitor (Android/iOS packaging).

## Roadmap

| Step                                                 | Status                                         |
| :--------------------------------------------------- | :--------------------------------------------- |
| 3D viewer (orbit, zoom, reset, responsive)           | ✅                                             |
| Customization (finish, color, roughness, reset)      | ✅                                             |
| AR placement at real size, with fallback             | ✅ confirmed on the S23 Ultra                  |
| A/B comparison, JSON export/import, PNG              | ✅                                             |
| Validation (performance, limitations, phone testing) | 🔄 performance numbers on the phone to measure |

Details: [step-by-step guide](step-by-step.md).

## Acceptance

- ✅ Sample models (vase, bowl, plate, ~10k triangles) and `.glb` import.
- 🔄 Smooth on desktop ✅ and on the S23 Ultra (to measure).
- ✅ Material edits persist in exported JSON.
- ✅ AR tested on a compatible device, with a clear fallback.
- 🔄 README with setup, limitations and licenses ✅; AR screenshots/video to add.

**Out of scope:** accounts, backend, AI generation, manufacturing validation, native ARCore.
