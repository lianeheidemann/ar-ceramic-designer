# Notes for contributors and coding agents

- The app lives in `app/`; commands and the module map are in [`app/README.md`](app/README.md).
- Code is organized by feature under `app/src/features/` (`viewer`, `ar`, `models`, `material`, `settings`), with the shell in `app/src/app/` and shared pieces in `app/src/shared/`.
- Put new code in the feature it belongs to, next to its component, hook, stylesheet and `*.test.ts`. Features may import each other; `shared/` must not import a feature.
- A new stylesheet gets an `@import` line in `app/src/index.css`, at the place it belongs in the cascade.
- Everything is in English: UI text, comments, file and folder names, docs.
- Before pushing: `npm run lint && npm run format:check && npm test && npm run build` and `npm run test:e2e` in `app/`.
- Work on `develop`; `main` deploys to GitHub Pages.
