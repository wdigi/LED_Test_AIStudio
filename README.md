# Arduino Library Studio – LED Strips & Custom Sensors

A browser-based workbench to **architect, simulate, test and export production-ready Arduino C++ libraries** for addressable RGB LED strips and custom sensor modules.

Built with React 19, TypeScript, Vite and Tailwind CSS. Installable as a PWA and usable offline.

## Features

- **LED Strip Studio** – configure an addressable strip, preview it with a live visualizer, and generate a matching library (including a gamma correction table).
- **Sensor Studio** – define a custom sensor, edit its register map, inspect it on a simulated oscilloscope, and generate the driver library.
- **Wiring diagrams** – generated diagrams for connecting your hardware.
- **Code viewer** – browse the generated headers and sources before exporting.
- **Export** – download a single file or the whole library as a `.zip`.
- **Mobile simulator and guide** – a mobile simulator modal and an Arduino how-to guide.
- **PWA** – install to your home screen, works offline.

## Getting started

Prerequisites: [Node.js](https://nodejs.org) 22+ (or [Bun](https://bun.sh)).

```bash
npm install --legacy-peer-deps   # or: bun install
cp .env.example .env             # then set GEMINI_API_KEY
npm run dev                      # http://localhost:3000
```

### Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start the dev server on port 3000 |
| `npm run build`   | Production build into `dist/`     |
| `npm run preview` | Preview the production build      |
| `npm run lint`    | Type-check with `tsc --noEmit`    |
| `npm run clean`   | Remove `dist` and `server.js`     |

### Environment variables

| Variable         | Purpose                                                           |
| ---------------- | ----------------------------------------------------------------- |
| `GEMINI_API_KEY` | Gemini API key. Injected automatically when run in Google AI Studio. |
| `APP_URL`        | URL where the app is hosted. Injected automatically in AI Studio.    |

## Project structure

```
src/
├── App.tsx                  # App shell and LED / Sensor tab switching
├── components/              # Studios, visualizer, oscilloscope, code viewer, modals, PWA UI
├── generators/
│   ├── ledStripGenerator.ts # LED strip library generator
│   └── sensorGenerator.ts   # Sensor library generator
├── hooks/                   # useOnlineStatus, usePWAInstall
├── types/library.ts         # Shared library/config types
└── utils/zipExporter.ts     # .zip and single-file download
public/                      # PWA icons
scripts/generate-icons.js    # Icon generation
```

## Deployment

Pushing to `main` or `master` triggers `.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to **GitHub Pages**. The workflow also copies `index.html` to `404.html` as a single-page-app fallback.

## License

No license has been specified yet.
