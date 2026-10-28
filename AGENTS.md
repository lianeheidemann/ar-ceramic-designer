# AGENTS.md

Guidance for AI coding agents working on **AR Ceramic Designer**: a web app to view and customize ceramic pieces in 3D and place them at real size in augmented reality (WebXR), with the Samsung Galaxy S23 Ultra (Chrome, Android) as the main test device.

## Repository layout

```text
app/                  # the application (all code and tooling live here)
  src/
    ar/               # WebXR: support check, AR session (hit test, placement)
    components/       # React UI (Viewer, CompareView, MaterialControls, ModelList)
    data/             # catalog of ceramic models
    geometry/         # lathe profile -> solid Three.js geometry
    hooks/            # useArSupport, useMediaQuery
    materials/        # finish presets and A/B variants
    types/            # shared TypeScript types (ceramic.ts)
    utils/            # units (mm <-> m)
    viewers/          # CeramicViewer (Three.js scene), CameraSync, framing
  public/icons/       # app icons (generated from assets/)
assets/               # source artwork (README icon)
docs/                 # plan, step-by-step guide, references
.github/workflows/    # ci.yml (checks), deploy.yml (GitHub Pages)
```

## Commands

Run everything from `app/`:

```bash
npm ci               # install
npm run dev          # http://localhost:5173/ar-ceramic-designer/
npm run lint         # oxlint
npm run format:check # prettier (npm run format to fix)
npm test             # vitest
npm run build        # tsc --noEmit + vite build
```

Before every commit, all four checks must pass: `lint`, `format:check`, `test`, `build`. CI (`.github/workflows/ci.yml`) runs the same commands on every push and pull request.

## Workflow

- Develop on the `develop` branch. Open a pull request `develop → main`; merge with a merge commit (no squash or rebase, no force-push).
- Every push to `main` deploys to GitHub Pages: https://lianeheidemann.github.io/ar-ceramic-designer/ (Vite `base` is `/ar-ceramic-designer/`).
- Asset paths in JSX must use `import.meta.env.BASE_URL`; absolute `/...` paths 404 on Pages. Paths in `index.html` are rewritten by Vite automatically.
- The repository owner also pushes directly (often README and docs edits). Fetch and merge `origin/develop` before starting and again before pushing.
- Work follows `docs/step-by-step.md`. When a section is implemented, mark its heading with ✅ in the same commit, and add a short note if the implementation differs from the guide.

## Code conventions

- **Language:** code, comments, commit messages and `docs/` in English; user-facing UI text and `README.md` in Brazilian Portuguese.
- **Formatting:** Prettier with no semicolons and single quotes (config in `app/package.json`).
- **TypeScript:** strict settings with `erasableSyntaxOnly`, so no constructor parameter properties, enums or namespaces. Declare class fields explicitly.
- **React:** avoid calling `setState` synchronously inside effects (oxlint warns). Derive values during render or set state from async callbacks and event handlers.
- **Three.js:** scene logic lives in plain classes (`viewers/CeramicViewer.ts`, `ar/arSession.ts`), independent of React; components only wire them up.
- Dispose of geometries, materials, textures and listeners when objects are replaced or a viewer unmounts.
- Keep model-specific values in `data/catalog.ts`, never in UI components.

## Domain rules

- **Units:** source dimensions are in millimeters; Three.js and WebXR use meters. Convert with `utils/units.ts` (`mmToM`). The model origin is the center of its base (y = 0), so pieces rest on surfaces at real size in AR.
- **Models:** the sample vase, bowl and plate are generated from lathe profiles (`geometry/lathe.ts`), smoothed and given wall thickness. The catalog also accepts GLB files (`source: { kind: 'glb', url }`) under `app/public/models/`.
- **Materials:** `MeshPhysicalMaterial`. Presets in `materials/presets.ts` are Fosco (matte), Brilhante (glossy) and Vitrificado (glazed, clearcoat). Catalog defaults are never mutated: customizations are overrides kept in `App.tsx` state, per variant (A/B) and per model.
- **Comparison:** on wide screens, two synced viewers; on narrow screens (≤ 768px), one viewer with an A/B switch. Never run two WebGL scenes on phones.
- **AR (`ar/arSession.ts`):**
  - Listen to `select` on the `XRSession` itself; Three.js controllers are not reliable with a DOM overlay.
  - Taps also arrive as DOM overlay clicks, so a single tap can be delivered twice; it is de-duplicated with `SAME_TAP_MS`.
  - The ring is hidden after placement; the next tap shows it again and the one after that moves the piece.
  - Shaders are pre-compiled (`compileAsync`) when the session opens, so the piece appears immediately on tap.

## Testing

- **Unit tests:** Vitest, next to the code (`*.test.ts`). The AR session is tested with a fake `XRSession` and renderer (`ar/arSession.test.ts`). Extend those tests when changing placement logic.
- **Browser checks:** Chromium and Playwright are available. Launch with `--use-angle=swiftshader --enable-unsafe-swiftshader` so WebGL works headless.
- **Damping in headless runs:** headless rendering is slow, so OrbitControls damping keeps moving the camera for seconds after a drag. Press "Reiniciar vista" or wait before comparing screenshots.
- **AR cannot be tested in this environment:** there is no camera or AR device. Test support detection and error paths with a mocked `navigator.xr`. Real placement must be confirmed by the owner on the S23 Ultra; say so explicitly, and never claim AR was verified on a device.

## Out of scope (unless asked)

Backend, accounts, AI generation, native ARCore/ARKit (see step 11 in the guide: Capacitor packaging is planned for later).
