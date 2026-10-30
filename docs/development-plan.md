# AR Ceramic Designer — Development Plan

## Goal
Build a lightweight web app to view, customize and place 3D ceramic objects in augmented reality. Initial target: Samsung Galaxy S23 Ultra (Android 16).

## Stack
- **TypeScript + React + Vite** — interface and app foundation
- **Three.js** — 3D rendering, GLB/glTF loading and controls
- **WebXR** — AR on supported Android browsers; verify compatibility on device
- **Blender** — prepare and optimize sample 3D models
- **Optional later:** Python + Open3D for geometric checks; Capacitor for Android packaging

## MVP roadmap
1. ✅ **3D viewer:** load sample models; orbit, zoom, reset and responsive UI.
2. ✅ **Customization:** change ceramic colors, roughness and finishes; restore defaults.
3. ✅ **AR mode:** place a correctly scaled object on a detected surface; handle unsupported browsers gracefully. *Confirmed on the S23 Ultra on 2026-10-29.*
4. ✅ **Comparison and export:** compare two variants; save configurations as JSON and screenshots when supported.
5. 🔄 **Validation:** test on S23 Ultra, optimize model sizes, measure loading time/FPS and document limitations. *AR tested on the phone; on-demand rendering, debug figures (`?debug=1`) and known limitations done; performance numbers still to measure.*

Details per step: [step-by-step guide](step-by-step.md).

## Acceptance criteria
- ✅ At least two optimized sample ceramic models (vase, bowl and plate generated in code, ~10k triangles each). Users can also import their own `.glb`; a CC0 porcelain teacup (681 KB) is offered as an example.
- 🔄 Smooth interactive viewing on desktop and Galaxy S23 Ultra (desktop ✅; numbers on the phone to measure).
- ✅ Material edits persist in exported JSON.
- ✅ AR is tested on a compatible device (S23 Ultra), with a clear fallback where unavailable.
- 🔄 README documents installation, running, screenshots, known limitations and asset licenses (AR media to add).

## Suggested structure
```text
public/models/
src/components/
src/viewers/
src/materials/
src/data/
docs/
```

## Out of scope for MVP
User accounts, backend, AI generation, industrial manufacturing validation and native ARCore integration.

## Possible future improvements
Explore geometric checks (watertightness, dimensions and mesh comparison), additional material presets and more export options.
