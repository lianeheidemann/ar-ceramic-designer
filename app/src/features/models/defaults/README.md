# Default models

The `.glb` files in this folder are the models the app opens with, in place of the vase, bowl and plate generated in code.

- **Add a model:** put a `.glb` file here (on GitHub: _Add file → Upload files_). It shows up at the next build; publishing to `main` deploys it.
- **Name:** the file name, without `.glb` (`Blue Vase.glb` → "Blue Vase"). The list follows file name order, and the first one opens first.
- **Thumbnail (optional):** an image with the same name (`Blue Vase.webp`, `.png` or `.jpg`, 4:3). Without one, the app takes a picture of the model the first time it is shown.
- **Format:** see [accepted files](../../../../README.md#accepted-files): one binary `.glb`, Meshopt allowed, no Draco or KTX2.
- **Size:** read from the file, in meters. A piece outside 1–60 cm starts with its largest side at 20 cm; **Real size** changes it.
- **License:** add each file's source and license to the root `README.md`.
- **Empty folder:** the app shows the generated vase, bowl and plate.
