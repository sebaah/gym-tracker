# Gym Tracker MVP 0.1

Mobile-first React + TypeScript + Vite workout logging PWA.

## Start

```bash
npm install
npm run dev
```

Open the shown local URL on your computer, or the LAN URL on your Android phone (same Wi-Fi). To install as a PWA, deploy over HTTPS. Run `npm run build` to produce `dist/`.

## Features
- A/B/C starter exercise templates, editable in `src/main.tsx` (`programs` constant)
- Start, log, finish workouts; resume interrupted session
- Autofill last used weights; session history and strength statistics
- LocalStorage persistence and JSON backup export

## Important
The exact original A/B/C v2.1 program was not provided in full in this conversation. Exercise lists and prescriptions are **provisional** and must be verified before use. The A-day squat option and seated leg curl reflect the agreed changes. This MVP uses local-only storage: clearing browser data loses workouts unless exported. For production, add IndexedDB, import/restore, cloud sync, service worker/offline caching, validation and automated tests.
