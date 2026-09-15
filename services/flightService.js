const fs = require('fs');
const path = require('path');
const { fetchLiveStatus } = require('./aviationStackClient');
const { fetchLivePosition } = require('./openSkyClient');

const DATA_PATH = path.join(__dirname, '..', 'data', 'flights.json');

// Server boot time — used as the anchor for the local simulation fallback,
// so progress keeps advancing in real time even without a live API key.
const SERVER_START = Date.now();

function loadFallbackFlights() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Progress %  =  ( Current Elapsed Seconds / Total Flight Duration Seconds ) × 100
 * Also linearly interpolates current lat/lon between origin and destination
 * (good enough for a straight "great-circle-ish" demo path; swap in a proper
 * great-circle interpolation if you need geographic accuracy).
 */
function computeProgress(flight) {
  const totalSeconds = flight.durationMinutes * 60;
  const seedSeconds = (flight.elapsedSeedMinutes || 0) * 60;
  const realElapsedSinceBoot = (Date.now() - SERVER_START) / 1000;

  // Loops the demo flight so it never "ends" — remove the modulo if you
  // want it to stop at 100% and wait for the next real scheduled flight.
  const elapsedSeconds = (seedSeconds + realElapsedSinceBoot) % totalSeconds;
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const progressPct = (elapsedSeconds / totalSeconds) * 100;
  const t = elapsedSeconds / totalSeconds;

  const lat = flight.origin.lat + (flight.destination.lat - flight.origin.lat) * t;
  const lon = flight.origin.lon + (flight.destination.lon - flight.origin.lon) * t;

  return {
    flightNumber: flight.flightNumber,
    callsign: flight.callsign,
    airline: flight.airline,
    origin: flight.origin,
    destination: flight.destination,
    distanceKm: flight.distanceKm,
    avgSpeedKmh: flight.avgSpeedKmh,
    durationMinutes: flight.durationMinutes,
    elapsedSeconds: Math.round(elapsedSeconds),
    remainingSeconds: Math.round(remainingSeconds),
    progressPct: Number(progressPct.toFixed(2)),
    currentPosition: { lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)) },
    source: 'simulated'
  };
}

async function getAllFlights() {
  const flights = loadFallbackFlights();
  return flights.map(computeProgress);
}

async function getFlightByNumber(flightNumber) {
  const flights = loadFallbackFlights();
  const flight = flights.find(
    (f) => f.flightNumber.toLowerCase() === flightNumber.toLowerCase()
  );
  if (!flight) return null;
  return computeProgress(flight);
}

/**
 * "Live" lookup: tries AviationStack (needs AVIATIONSTACK_KEY) for real
 * schedule/status, then OpenSky (no key needed, rate-limited) for a live
 * lat/lon fix by callsign, and merges whatever it gets on top of the local
 * simulated baseline. Never throws — always falls back gracefully.
 */
async function getLiveFlight(flightNumber) {
  const baseline = await getFlightByNumber(flightNumber);
  if (!baseline) return null;

  let result = { ...baseline };

  try {
    const live = await fetchLiveStatus(baseline.flightNumber);
    if (live) {
      result = {
        ...result,
        departureTimeUtc: live.departureTimeUtc,
        arrivalTimeUtc: live.arrivalTimeUtc,
        flightStatus: live.status,
        source: 'aviationstack'
      };
      // Recompute elapsed/remaining/progress from real timestamps if present
      if (live.departureTimeUtc && live.arrivalTimeUtc) {
        const dep = new Date(live.departureTimeUtc).getTime();
        const arr = new Date(live.arrivalTimeUtc).getTime();
        const now = Date.now();
        const totalSeconds = (arr - dep) / 1000;
        const elapsedSeconds = Math.min(Math.max((now - dep) / 1000, 0), totalSeconds);
        result.elapsedSeconds = Math.round(elapsedSeconds);
        result.remainingSeconds = Math.round(totalSeconds - elapsedSeconds);
        result.progressPct = Number(((elapsedSeconds / totalSeconds) * 100).toFixed(2));
      }
    }
  } catch (err) {
    // AviationStack unavailable/no key — silently keep simulated baseline
  }

  try {
    const pos = await fetchLivePosition(baseline.callsign);
    if (pos) {
      result.currentPosition = { lat: pos.lat, lon: pos.lon };
      result.altitudeM = pos.altitude;
      result.velocityMs = pos.velocity;
      result.source = result.source === 'aviationstack' ? 'aviationstack+opensky' : 'opensky';
    }
  } catch (err) {
    // OpenSky unavailable — keep whatever position we already have
  }

  return result;
}

module.exports = { getAllFlights, getFlightByNumber, getLiveFlight };
