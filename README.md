# Flight Study Dashboard — Backend

Express API that powers the flight-progress + study dashboard. Works in three tiers:

1. **Local simulated dataset** (`data/flights.json`) — always available, no API key needed. Progress advances in real time from a seeded elapsed value using the formula:

   ```
   Progress % = (Current Elapsed Seconds / Total Flight Duration Seconds) × 100
   ```

2. **OpenSky Network** (free, no key, rate-limited) — overlays a real live lat/lon/altitude/velocity for the callsign if OpenSky currently has that aircraft in its state vectors.

3. **AviationStack** (needs a free/paid API key) — overlays real scheduled/estimated departure & arrival timestamps and flight status, and recalculates progress from those real timestamps instead of the simulation.

Every tier degrades gracefully — if a live source fails, times out, or has no data, the response just falls back to the tier below it. The `/live` endpoint never throws to the client.

## Setup

```bash
npm install
npm start          # http://localhost:4000
```

Optional — enable real AviationStack data:

```bash
export AVIATIONSTACK_KEY=your_key_here
npm start
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/flights` | All flights in the dataset, with simulated live progress |
| GET | `/api/flights/:flightNumber` | One flight, simulated progress (e.g. `/api/flights/AI-865`) |
| GET | `/api/flights/:flightNumber/live` | Same, but tries AviationStack + OpenSky first |

### Example response

```json
{
  "flightNumber": "AI-865",
  "callsign": "AIC865",
  "airline": "Air India",
  "origin": { "code": "DEL", "name": "Indira Gandhi Intl", "lat": 28.5562, "lon": 77.1 },
  "destination": { "code": "BOM", "name": "Chhatrapati Shivaji Maharaj Intl", "lat": 19.0896, "lon": 72.8656 },
  "distanceKm": 1137,
  "avgSpeedKmh": 830,
  "durationMinutes": 135,
  "elapsedSeconds": 610,
  "remainingSeconds": 7490,
  "progressPct": 7.53,
  "currentPosition": { "lat": 25.816, "lon": 76.398 },
  "source": "simulated"
}
```

## Frontend

`public/index.html` is served directly by this same Express server — open
**http://localhost:4000** after `npm start` and you get the full dashboard,
no separate frontend server or CORS setup needed.

It polls `/api/flights/AI-865/live` every 15 seconds and, between polls,
advances the plane's position every animation frame using
`requestAnimationFrame` (no snapping). If the backend is ever unreachable,
the "backend offline · local simulation" label appears in the flight card
and the dashboard keeps running off the last known values instead of
breaking.

City lights, clouds, and the mouse-parallax 3D tilt keep running underneath
regardless of connection state — only the flight timing/route data depends
on the API.

## Adding more routes

Add an entry to `data/flights.json` with `origin`, `destination`, `distanceKm`, `avgSpeedKmh`, `durationMinutes`, and an `elapsedSeedMinutes` (how far into the flight the demo should start). No code changes needed.

## Notes on the tech-stack suggestions

The Three.js / React Three Fiber / GSAP stack you listed is the right direction if you want the sky to become true 3D (volumetric clouds, a real GLTF plane model, depth-of-field parallax) instead of the current CSS/SVG 2.5D version. This backend is framework-agnostic — it's a plain REST API, so it plugs into a React Three Fiber frontend, the current vanilla HTML dashboard, or anything else the same way.
