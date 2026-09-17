const fs = require('fs');
const path = require('path');
const { fetchLiveFlights, fetchLiveFlightByNumber } = require('./flightradarClient');
const { fetchLiveStatus } = require('./aviationStackClient');
const { fetchLivePosition } = require('./openSkyClient');
const { AIRPORTS } = require('../data/airports');

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
 * Compute simulated real-time flight telemetry (progress, altitude, speed, flight phase)
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

  const origLat = flight.origin?.lat || 28.5562;
  const origLon = flight.origin?.lon || 77.1000;
  const destLat = flight.destination?.lat || 19.0896;
  const destLon = flight.destination?.lon || 72.8656;

  const lat = origLat + (destLat - origLat) * t;
  const lon = origLon + (destLon - origLon) * t;

  return {
    ...flight,
    elapsedSeconds: Math.round(elapsedSeconds),
    remainingSeconds: Math.round(remainingSeconds),
    progressPct: Number(progressPct.toFixed(2)),
    altitudeFt: flight.altitudeFt || altitudeFt,
    currentSpeedKmh: flight.speedKmh || currentSpeedKmh,
    flightPhase: flight.flightPhase || flightPhase,
    currentPosition: {
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4))
    },
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
    source: flight.source || 'simulated'
  };
}

/**
 * Filter flights by duration, origin/destination, and search terms, combining Flightradar24 live feed with curated catalog
 */
async function getFlights(query = {}) {
  const { from, to, durationMinutes, tolerance, search, airline, source, lat, lon, zoom, bounds } = query;

  let results = [];

  // If source is 'catalog' only, use fallback dataset
  if (source === 'catalog') {
    results = loadFallbackFlights().map((f) => computeProgress(f));
  } else {
    // Fetch live flights from Flightradar24 (defaults to 28.65, 77.23 / zoom 6)
    try {
      const liveFlights = await fetchLiveFlights({ lat, lon, zoom, bounds });
      if (liveFlights && liveFlights.length > 0) {
        results = liveFlights;
      }
    } catch (err) {
      console.warn('Flightradar24 live fetch failed, falling back to curated flights:', err.message);
    }

    // If no live flights or user wants all, append curated catalogue flights
    if (results.length === 0 || source === 'all') {
      const catalogFlights = loadFallbackFlights().map((f) => computeProgress(f));
      // Avoid duplicate flight numbers
      const existingNos = new Set(results.map((f) => normalizeFlightNo(f.flightNumber)));
      catalogFlights.forEach((cf) => {
        if (!existingNos.has(normalizeFlightNo(cf.flightNumber))) {
          results.push(cf);
        }
      });
    }
  }

  // 1. Search Query (matches flight number, callsign, city, airport name, airline)
  if (search) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (f) =>
        (f.flightNumber && f.flightNumber.toLowerCase().includes(q)) ||
        (f.callsign && f.callsign.toLowerCase().includes(q)) ||
        (f.airline && f.airline.toLowerCase().includes(q)) ||
        (f.origin?.city && f.origin.city.toLowerCase().includes(q)) ||
        (f.origin?.code && f.origin.code.toLowerCase().includes(q)) ||
        (f.origin?.name && f.origin.name.toLowerCase().includes(q)) ||
        (f.destination?.city && f.destination.city.toLowerCase().includes(q)) ||
        (f.destination?.code && f.destination.code.toLowerCase().includes(q)) ||
        (f.destination?.name && f.destination.name.toLowerCase().includes(q)) ||
        (f.aircraft && f.aircraft.toLowerCase().includes(q))
    );
  }

  // 2. From filter (airport code or city)
  if (from) {
    const fromQ = from.trim().toLowerCase();
    results = results.filter(
      (f) =>
        (f.origin?.code && f.origin.code.toLowerCase() === fromQ) ||
        (f.origin?.city && f.origin.city.toLowerCase().includes(fromQ))
    );
  }

  // 3. To filter (airport code or city)
  if (to) {
    const toQ = to.trim().toLowerCase();
    results = results.filter(
      (f) =>
        (f.destination?.code && f.destination.code.toLowerCase() === toQ) ||
        (f.destination?.city && f.destination.city.toLowerCase().includes(toQ))
    );
  }

  // 4. Airline filter
  if (airline) {
    const airQ = airline.trim().toLowerCase();
    results = results.filter(
      (f) =>
        (f.airline && f.airline.toLowerCase().includes(airQ)) ||
        (f.airlineCode && f.airlineCode.toLowerCase().includes(airQ))
    );
  }

  // 5. Match by study duration (minutes)
  if (durationMinutes) {
    const target = parseFloat(durationMinutes);
    const tol = parseFloat(tolerance) || 45; // default 45 min tolerance window

    results = results
      .map((f) => {
        const dur = f.durationMinutes || 60;
        const diff = Math.abs(dur - target);
        // Match percentage score
        const matchPct = Math.max(0, Math.round(100 - (diff / Math.max(target, 30)) * 100));
        return { ...f, matchPct, matchScore: matchPct, diffMinutes: diff };
      })
      .filter((f) => f.diffMinutes <= (tol * 2))
      .sort((a, b) => a.diffMinutes - b.diffMinutes);
  }

  return results;
}

function normalizeFlightNo(no) {
  return String(no || '').replace(/[\s\-]/g, '').toLowerCase();
}

/**
 * Get all unique departure and arrival airports for dropdowns
 */
async function getAllAirports() {
  const airportMap = new Map();

  // Load from comprehensive database
  Object.values(AIRPORTS).forEach((a) => {
    airportMap.set(a.code, a);
  });

  // Load from fallback dataset
  const fallback = loadFallbackFlights();
  fallback.forEach((f) => {
    if (f.origin?.code && !airportMap.has(f.origin.code)) {
      airportMap.set(f.origin.code, f.origin);
    }
    if (f.destination?.code && !airportMap.has(f.destination.code)) {
      airportMap.set(f.destination.code, f.destination);
    }
  });

  return Array.from(airportMap.values()).sort((a, b) =>
    (a.city || a.name).localeCompare(b.city || b.name)
  );
}

/**
 * Retrieve a flight by flight number or callsign (checks live Flightradar24 first)
 */
async function getFlightByNumber(flightNumber) {
  if (!flightNumber) return null;

  // 1. Try Live Flightradar24
  try {
    const live = await fetchLiveFlightByNumber(flightNumber);
    if (live) return live;
  } catch (err) {
    console.warn('Flightradar24 single flight lookup error:', err.message);
  }

  // 2. Fallback to curated dataset
  const flights = loadFallbackFlights();
  const target = normalizeFlightNo(flightNumber);
  const flight = flights.find(
    (f) =>
      normalizeFlightNo(f.flightNumber) === target ||
      normalizeFlightNo(f.callsign) === target ||
      normalizeFlightNo(f.flightNumber).includes(target)
  );
  if (!flight) return null;
  return computeProgress(flight);
}

/**
 * "Live" lookup: prioritizes Flightradar24 live position + telemetry, then AviationStack + OpenSky, gracefully falls back
 */
async function getLiveFlight(flightNumber, customElapsedSeconds = null) {
  // 1. Check Flightradar24 Live Feed
  try {
    const frLive = await fetchLiveFlightByNumber(flightNumber);
    if (frLive) {
      return frLive;
    }
  } catch (err) {
    // Ignore and fallback
  }

  // 2. Fallback baseline simulation
  const baseline = await getFlightByNumber(flightNumber);
  if (!baseline) return null;

  let result = computeProgress(baseline, customElapsedSeconds);

  // 3. Try AviationStack
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
    // Ignore
  }

  // 4. Try OpenSky
  try {
    const pos = await fetchLivePosition(baseline.callsign);
    if (pos) {
      result.currentPosition = { lat: pos.lat, lon: pos.lon };
      result.lat = pos.lat;
      result.lon = pos.lon;
      result.altitudeFt = Math.round((pos.altitude || 11000) * 3.28084);
      result.currentSpeedKmh = Math.round((pos.velocity || 230) * 3.6);
      result.source = result.source === 'aviationstack' ? 'aviationstack+opensky' : 'opensky';
    }
  } catch (err) {
    // Ignore
  }

  return result;
}

/**
 * Dedicated Live Radar feed query
 */
async function getRadarFlights(options = {}) {
  const flights = await fetchLiveFlights(options);
  return flights;
}

module.exports = {
  getAllFlights: getFlights,
  getFlights,
  getAllAirports,
  getFlightByNumber,
  getLiveFlight,
  getRadarFlights
};
