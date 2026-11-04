# CLAUDE.md

Guidance for Claude when working in this repository.

## Project

Arduino Library Studio: a React 19 + TypeScript + Vite 8 + Tailwind 4 PWA that designs, simulates and exports Arduino C++ libraries for addressable LED strips and custom sensors. It was started in Google AI Studio. **This GitHub repo is the source of truth.** See `README.md` for an overview.

## Commands

Use **bun** (the repo has `bun.lock`). Do not commit a `package-lock.json`.

```bash
bun install               # CI uses `npm install --legacy-peer-deps`, so peer-dep conflicts may show up there first
bun run dev               # dev server on :3000
bun run lint              # tsc --noEmit (the only automated check; there are no tests)
bun run build             # production build into dist/
```

Run `bun run lint` and `bun run build` before every commit.

## Layout

- `src/App.tsx`: app shell, all default configs, tab switching (LED strip / sensor).
- `src/generators/`: pure functions that turn a config into Arduino C++ files. Changes here alter exported libraries, so check the generated output.
- `src/components/`: studios, visualizer, oscilloscope, wiring diagram, code viewer, modals.
- `src/utils/zipExporter.ts`: `.zip` and single-file download.
- `src/types/library.ts`: shared config and library types.

## Conventions

- **Mobile first.** Most work happens on a phone. Keep layouts working at 390px width with no horizontal page scroll. Use Tailwind responsive classes (`md:` for desktop-only extras). The bottom nav (`MobileBottomNav`) is the mobile navigation.
- Match the existing style: Tailwind utility classes, the dark slate/cyan palette, lucide-react icons, function components with typed props.
- Keep changes small and focused. Don't refactor unrelated code.
- Never commit secrets. `.env*` is git-ignored except `.env.example`. `GEMINI_API_KEY` and `APP_URL` come from AI Studio or a local `.env`.

## Verifying UI changes

Chromium and Playwright are available in the cloud environment. For layout work, run the dev server, load it with a 390px viewport, and check `document.documentElement.scrollWidth <= innerWidth` on both tabs. Keep screenshots and scratch files out of the repo.

## Git and deployment

- Work on a branch and open a pull request. Don't push to `main` directly.
- Pushing or merging to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. Treat a merge as a release.
- If a PR was already merged, start new work from the latest `main`; don't stack commits on merged history.
- Don't open or merge a PR unless asked.
