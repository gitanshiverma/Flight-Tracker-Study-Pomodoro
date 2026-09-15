const fs = require('fs');
const path = require('path');
const { fetchLiveStatus } = require('./aviationStackClient');
const { fetchLivePosition } = require('./openSkyClient');

const DATA_PATH = path.join(__dirname, '..', 'data', 'flights.json');
const SERVER_START = Date.now();

function loadFallbackFlights() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading flights data:', err);
    return [];
  }
}

/**
 * Compute real-time flight telemetry (progress, altitude, speed, flight phase)
 */
function computeProgress(flight, customElapsedSeconds = null) {
  const totalSeconds = (flight.durationMinutes || 60) * 60;
  let elapsedSeconds = 0;

  if (customElapsedSeconds !== null && customElapsedSeconds !== undefined) {
    elapsedSeconds = Math.min(Math.max(0, customElapsedSeconds), totalSeconds);
  } else {
    // Background simulation loop anchored at server start
    const realElapsedSinceBoot = (Date.now() - SERVER_START) / 1000;
    elapsedSeconds = (realElapsedSinceBoot * 0.5) % totalSeconds;
  }

  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPct = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0;
  const t = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  // Realistic Flight Phase & Altitude Simulation
  let flightPhase = 'Cruising';
  let altitudeFt = 36000;
  let currentSpeedKmh = flight.avgSpeedKmh || 820;

  if (progressPct <= 5) {
    flightPhase = 'Takeoff & Initial Climb';
    altitudeFt = Math.round(5000 + (progressPct / 5) * 20000);
    currentSpeedKmh = Math.round((flight.avgSpeedKmh || 800) * 0.65);
  } else if (progressPct <= 15) {
    flightPhase = 'Climbing to Cruise';
    altitudeFt = Math.round(25000 + ((progressPct - 5) / 10) * 11000);
    currentSpeedKmh = Math.round((flight.avgSpeedKmh || 800) * 0.85);
  } else if (progressPct <= 85) {
    flightPhase = 'Cruising Altitude';
    altitudeFt = 36000 + Math.round(Math.sin(t * 10) * 500);
    currentSpeedKmh = flight.avgSpeedKmh || 830;
  } else if (progressPct <= 95) {
    flightPhase = 'Descent & Approach';
    altitudeFt = Math.round(36000 - ((progressPct - 85) / 10) * 28000);
    currentSpeedKmh = Math.round((flight.avgSpeedKmh || 800) * 0.75);
  } else if (progressPct < 100) {
    flightPhase = 'Final Approach & Landing';
    altitudeFt = Math.round(8000 - ((progressPct - 95) / 5) * 7800);
    currentSpeedKmh = Math.round((flight.avgSpeedKmh || 800) * 0.45);
  } else {
    flightPhase = 'Landed';
    altitudeFt = 0;
    currentSpeedKmh = 0;
  }

  const lat = flight.origin.lat + (flight.destination.lat - flight.origin.lat) * t;
  const lon = flight.origin.lon + (flight.destination.lon - flight.origin.lon) * t;

  return {
    ...flight,
    elapsedSeconds: Math.round(elapsedSeconds),
    remainingSeconds: Math.round(remainingSeconds),
    progressPct: Number(progressPct.toFixed(2)),
    altitudeFt,
    currentSpeedKmh,
    flightPhase,
    currentPosition: {
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4))
    },
    source: 'simulated'
  };
}

/**
 * Filter flights by duration, origin/destination, and search terms
 */
async function getFlights(query = {}) {
  const flights = loadFallbackFlights();
  const { from, to, durationMinutes, tolerance, search, airline } = query;

  let results = flights;

  // 1. Search Query (matches flight number, city, airport name, airline)
  if (search) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (f) =>
        f.flightNumber.toLowerCase().includes(q) ||
        f.airline.toLowerCase().includes(q) ||
        f.origin.city.toLowerCase().includes(q) ||
        f.origin.code.toLowerCase().includes(q) ||
        f.destination.city.toLowerCase().includes(q) ||
        f.destination.code.toLowerCase().includes(q)
    );
  }

  // 2. From filter (airport code or city)
  if (from) {
    const fromQ = from.trim().toLowerCase();
    results = results.filter(
      (f) =>
        f.origin.code.toLowerCase() === fromQ ||
        f.origin.city.toLowerCase().includes(fromQ)
    );
  }

  // 3. To filter (airport code or city)
  if (to) {
    const toQ = to.trim().toLowerCase();
    results = results.filter(
      (f) =>
        f.destination.code.toLowerCase() === toQ ||
        f.destination.city.toLowerCase().includes(toQ)
    );
  }

  // 4. Airline filter
  if (airline) {
    const airQ = airline.trim().toLowerCase();
    results = results.filter((f) => f.airline.toLowerCase().includes(airQ));
  }

  // 5. Match by study duration (minutes)
  if (durationMinutes) {
    const target = parseFloat(durationMinutes);
    const tol = parseFloat(tolerance) || 30; // default 30 min tolerance window

    // Calculate match percentage for every flight
    results = results
      .map((f) => {
        const diff = Math.abs(f.durationMinutes - target);
        // Match percentage score: 100% when exact, dropping off smoothly
        const matchPct = Math.max(0, Math.round(100 - (diff / Math.max(target, 30)) * 100));
        return { ...f, matchPct, matchScore: matchPct, diffMinutes: diff };
      })
      .sort((a, b) => a.diffMinutes - b.diffMinutes);
  }

  return results.map((f) => {
    const prog = computeProgress(f);
    if (f.matchScore !== undefined) {
      prog.matchScore = f.matchScore;
      prog.matchPct = f.matchPct;
    }
    return prog;
  });
}

function normalizeFlightNo(no) {
  return String(no || '').replace(/[\s\-]/g, '').toLowerCase();
}

/**
 * Get all unique departure and arrival airports for dropdowns
 */
async function getAllAirports() {
  const flights = loadFallbackFlights();
  const airportMap = new Map();

  flights.forEach((f) => {
    if (!airportMap.has(f.origin.code)) {
      airportMap.set(f.origin.code, {
        code: f.origin.code,
        city: f.origin.city,
        name: f.origin.name,
        country: f.origin.country
      });
    }
    if (!airportMap.has(f.destination.code)) {
      airportMap.set(f.destination.code, {
        code: f.destination.code,
        city: f.destination.city,
        name: f.destination.name,
        country: f.destination.country
      });
    }
  });

  return Array.from(airportMap.values()).sort((a, b) => a.city.localeCompare(b.city));
}

async function getFlightByNumber(flightNumber) {
  const flights = loadFallbackFlights();
  const target = normalizeFlightNo(flightNumber);
  const flight = flights.find(
    (f) => normalizeFlightNo(f.flightNumber) === target || normalizeFlightNo(f.callsign) === target
  );
  if (!flight) return null;
  return computeProgress(flight);
}

/**
 * "Live" lookup: tries AviationStack + OpenSky, gracefully falls back
 */
async function getLiveFlight(flightNumber, customElapsedSeconds = null) {
  const baseline = await getFlightByNumber(flightNumber);
  if (!baseline) return null;

  let result = computeProgress(baseline, customElapsedSeconds);

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
    }
  } catch (err) {
    // ignore
  }

  try {
    const pos = await fetchLivePosition(baseline.callsign);
    if (pos) {
      result.currentPosition = { lat: pos.lat, lon: pos.lon };
      result.altitudeFt = Math.round((pos.altitude || 11000) * 3.28084);
      result.currentSpeedKmh = Math.round((pos.velocity || 230) * 3.6);
      result.source = result.source === 'aviationstack' ? 'aviationstack+opensky' : 'opensky';
    }
  } catch (err) {
    // ignore
  }

  return result;
}

module.exports = {
  getAllFlights: getFlights,
  getFlights,
  getAllAirports,
  getFlightByNumber,
  getLiveFlight
};

