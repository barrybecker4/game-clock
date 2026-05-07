# Game Clock

A simple, mobile-first game clock for Go and chess. Supports **Fischer**
time and **Japanese Byo-yomi** time controls, with audible byo-yomi
announcements and a buzzer when a player loses on time.

The app is a static, single-page Svelte build with no backend server. Place your
phone on the table beside the board, set the time control, and start
playing.

## Run and build

### Run locally (development)

```bash
# 1) Install dependencies
npm install

# 2) Start the dev server
npm run dev
```

Then open the URL printed in your terminal (typically `http://localhost:5180/`).

### Build for production

```bash
# Create an optimized static build
npm run build

# Optional: preview the production build locally
npm run preview
```

Production files are emitted to `dist/` and can be hosted on any static hosting service.

## Features

- Two time controls
  - **Fischer**: main time + per-move increment.
  - **Japanese Byo-yomi**: main time + N periods of fixed length.
- Several presets per mode (plus full custom configuration).
- Two large clocks; the top clock is rotated 180° so the player on the
  far side of the board reads it right-side-up.
- Tap your side of the screen to end your turn.
- Pause / resume any time.
- Reset (same settings) or return to configuration.
- Audio
  - Spoken "Byo-yomi" when overtime begins.
  - Spoken countdown (10 → 1) for the last 10 seconds of each byo-yomi
    period.
  - Loud buzzer when a player loses on time.
  - Mute toggle in the control bar.
- Screen Wake Lock keeps the phone awake while the game is running.
- Settings and active games are saved to `localStorage`. A game in
  progress is restored paused, so you can decide whether to resume.

## Getting started

```bash
npm install
npm run dev
```

Then open the Local URL printed by Vite (e.g. http://localhost:5180/).
Vite is configured with `host: true` so it is also reachable from a
phone on the same network at the printed Network URL.

## Production build

```bash
npm run build
```

The built static site is written to `dist/`. Upload its contents to any
static host (GitHub Pages, Netlify, Vercel, S3, etc.).

To preview the production build locally:

```bash
npm run preview
```

## Project layout

```
src/
├─ App.svelte                 - top-level screen switcher
├─ main.js
├─ lib/
│  ├─ components/
│  │  ├─ ConfigScreen.svelte  - mode + presets + custom inputs
│  │  ├─ GameClock.svelte     - dual clocks + control bar + overlay
│  │  ├─ PlayerClock.svelte   - one player's display
│  │  ├─ ControlBar.svelte    - settings / reset / pause / mute
│  │  └─ PauseMenu.svelte     - overlay for paused / lost-on-time
│  ├─ stores/
│  │  ├─ settings.js          - persisted config + presets
│  │  └─ gameState.js         - game logic (Fischer & byo-yomi)
│  ├─ utils/
│  │  ├─ timer.js             - rAF ticker + time formatting
│  │  ├─ wakeLock.js          - Screen Wake Lock helper
│  │  └─ persistence.js       - localStorage read/write
│  └─ audio/
│     ├─ voiceAnnouncer.js    - Web Speech API
│     └─ sounds.js            - Web Audio API (buzzer, chimes, etc.)
└─ styles/
   └─ global.css
```

## Notes

- iOS/Safari requires a user gesture before audio plays. The Start
  Game button and the first tap during play prime both the speech
  synthesizer and the audio context, so subsequent announcements work.
- Time accounting always uses wall-clock deltas, so the timer remains
  accurate even when the browser throttles `requestAnimationFrame` in
  the background.
