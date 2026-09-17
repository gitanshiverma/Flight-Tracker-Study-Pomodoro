const { resolveAirport, resolveAirline, resolveAircraft } = require('../data/airports');

// In-memory cache for Flightradar24 queries (TTL: 6 seconds)
const cache = new Map();
const CACHE_TTL_MS = 6000;

/**
 * Haversine formula to calculate distance between two coordinates in kilometers
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bounding box [north, south, west, east] from center lat, lon, and zoom
 */
function getBoundsFromCenter(lat = 28.65, lon = 77.23, zoom = 6) {
  // Zoom 6 spans roughly 5-6 degrees lat and 6-8 degrees lon
  const latDelta = Math.max(1.5, 180 / Math.pow(2, zoom - 1));
  const lonDelta = Math.max(2.0, 360 / Math.pow(2, zoom - 1));

  const north = Number((lat + latDelta).toFixed(3));
  const south = Number((lat - latDelta).toFixed(3));
  const west = Number((lon - lonDelta).toFixed(3));
  const east = Number((lon + lonDelta).toFixed(3));

  return `${north},${south},${west},${east}`;
}

/**
 * Format raw Flightradar24 array entry into rich flight object
 */
function parseFlightradarEntry(key, arr) {
  if (!arr || !Array.isArray(arr) || arr.length < 14) return null;

  const icao = String(arr[0] || '').toUpperCase();
  const lat = typeof arr[1] === 'number' ? arr[1] : parseFloat(arr[1]);
  const lon = typeof arr[2] === 'number' ? arr[2] : parseFloat(arr[2]);
  const track = typeof arr[3] === 'number' ? arr[3] : parseInt(arr[3] || '0', 10);
  const altitudeFt = typeof arr[4] === 'number' ? arr[4] : parseInt(arr[4] || '0', 10);
  const speedKts = typeof arr[5] === 'number' ? arr[5] : parseInt(arr[5] || '0', 10);
  const speedKmh = Math.round(speedKts * 1.852);
  const modelCode = arr[8] || '';
  const registration = arr[9] || '';
  const timestamp = arr[10] || Math.floor(Date.now() / 1000);
  const originCode = (arr[11] || '').trim().toUpperCase();
  const destCode = (arr[12] || '').trim().toUpperCase();
  const flightNumber = (arr[13] || arr[16] || `FR-${key}`).trim().toUpperCase();
  const onGround = arr[14] === 1;
  const verticalSpeedFpm = typeof arr[15] === 'number' ? arr[15] : parseInt(arr[15] || '0', 10);
  const callsign = (arr[16] || flightNumber).trim().toUpperCase();
  const airlineCode = (arr[18] || '').trim().toUpperCase();

  const originAirport = resolveAirport(originCode);
  const destAirport = resolveAirport(destCode);
  const airlineName = resolveAirline(airlineCode, flightNumber);
  const aircraftName = resolveAircraft(modelCode);

  // Compute flight geometry and progress if origin & destination are known
  let totalDistanceKm = 1000;
  let remainingKm = 500;
  let elapsedKm = 500;
  let progressPct = 50;

  if (originAirport?.lat && originAirport?.lon && destAirport?.lat && destAirport?.lon) {
    totalDistanceKm = Math.round(haversineKm(originAirport.lat, originAirport.lon, destAirport.lat, destAirport.lon)) || 1000;
    elapsedKm = Math.round(haversineKm(originAirport.lat, originAirport.lon, lat, lon)) || 0;
    remainingKm = Math.round(haversineKm(lat, lon, destAirport.lat, destAirport.lon)) || 0;
    
    // Calculate progress as ratio of elapsed vs total route
    if (totalDistanceKm > 0) {
      progressPct = Math.min(100, Math.max(0, (elapsedKm / totalDistanceKm) * 100));
    }
  } else if (onGround) {
    progressPct = 0;
  }

  // Calculate estimated total duration and remaining seconds
  const effectiveSpeedKmh = Math.max(250, speedKmh || 750);
  const durationMinutes = Math.max(25, Math.round((totalDistanceKm / effectiveSpeedKmh) * 60));
  const remainingSeconds = Math.max(0, Math.round((remainingKm / (effectiveSpeedKmh / 3600))));
  const elapsedSeconds = Math.max(0, (durationMinutes * 60) - remainingSeconds);

  // Determine flight phase
  let flightPhase = 'Cruising';
  if (onGround) {
    flightPhase = progressPct < 10 ? 'Boarding & Taxi' : 'Landed & Taxi';
  } else if (progressPct <= 10 || altitudeFt < 8000) {
    flightPhase = 'Takeoff & Initial Climb';
  } else if (progressPct <= 25 || altitudeFt < 24000) {
    flightPhase = 'Climbing to Cruise';
  } else if (progressPct <= 80) {
    flightPhase = `Cruising · FL${Math.round(altitudeFt / 100) || 360}`;
  } else if (progressPct <= 92 || altitudeFt > 10000) {
    flightPhase = 'Descent & Approach';
  } else {
    flightPhase = 'Final Approach & Landing';
  }

  return {
    id: key,
    flightNumber,
    callsign,
    icao,
    registration,
    airline: airlineName,
    airlineCode,
    aircraft: aircraftName,
    aircraftModel: modelCode,
    origin: originAirport || { code: originCode || 'DEP', name: 'Origin', city: originCode || 'Origin', country: '' },
    destination: destAirport || { code: destCode || 'ARR', name: 'Destination', city: destCode || 'Destination', country: '' },
    currentPosition: {
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4))
    },
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
    track,
    heading: track,
    altitudeFt,
    speedKts,
    speedKmh,
    verticalSpeedFpm,
    onGround,
    durationMinutes,
    distanceKm: totalDistanceKm,
    elapsedSeconds,
    remainingSeconds,
    progressPct: Number(progressPct.toFixed(1)),
    flightPhase,
    timestamp,
    source: 'flightradar24'
  };
}

/**
 * Fetch live flights from Flightradar24 feed within bounds
 */
async function fetchLiveFlights(options = {}) {
  let boundsStr = options.bounds;

  if (!boundsStr) {
    const lat = options.lat != null ? parseFloat(options.lat) : 28.65;
    const lon = options.lon != null ? parseFloat(options.lon) : 77.23;
    const zoom = options.zoom != null ? parseInt(options.zoom, 10) : 6;
    boundsStr = getBoundsFromCenter(lat, lon, zoom);
  }

  const cacheKey = `bounds:${boundsStr}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const endpoints = [
    `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=${boundsStr}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=0&estimated=1&maxage=14400&gliders=0&stats=1`,
    `https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=${boundsStr}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=0&estimated=1&maxage=14400&gliders=0&stats=1`
  ];

  let rawData = null;
  let lastError = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.flightradar24.com/'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        rawData = await res.json();
        if (rawData) break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!rawData) {
    if (cached) return cached.data;
    console.warn('Flightradar24 feed request warning:', lastError?.message || 'Empty response');
    return [];
  }

  const flightKeys = Object.keys(rawData).filter(
    (k) => !['full_count', 'version', 'stats'].includes(k)
  );

  const parsedFlights = flightKeys
    .map((key) => parseFlightradarEntry(key, rawData[key]))
    .filter((f) => f && f.lat != null && f.lon != null);

  cache.set(cacheKey, { timestamp: Date.now(), data: parsedFlights });
  return parsedFlights;
}

/**
 * Fetch a single live flight by flight number, callsign, or hex ID
 */
async function fetchLiveFlightByNumber(flightNumberOrCallsign) {
  if (!flightNumberOrCallsign) return null;
  const target = String(flightNumberOrCallsign).replace(/[\s\-]/g, '').toUpperCase();

  const isMatch = (f) => {
    if (!f) return false;
    const fn = String(f.flightNumber || '').replace(/[\s\-]/g, '').toUpperCase();
    const cs = String(f.callsign || '').replace(/[\s\-]/g, '').toUpperCase();
    const ic = String(f.icao || '').replace(/[\s\-]/g, '').toUpperCase();
    const id = String(f.id || '').replace(/[\s\-]/g, '').toUpperCase();
    const reg = String(f.registration || '').replace(/[\s\-]/g, '').toUpperCase();
    return fn === target || cs === target || ic === target || id === target || reg === target || (target.length >= 4 && (fn.includes(target) || cs.includes(target)));
  };

  // 1. Search all currently cached radar sectors
  for (const entry of cache.values()) {
    if (entry && Array.isArray(entry.data)) {
      const match = entry.data.find(isMatch);
      if (match) return match;
    }
  }

  // 2. Fetch default 28.65, 77.23 sector
  try {
    const defaultFlights = await fetchLiveFlights({ lat: 28.65, lon: 77.23, zoom: 6 });
    const match = defaultFlights.find(isMatch);
    if (match) return match;
  } catch (err) {
    // Ignore
  }

  // 3. Fetch broader regional bounds
  try {
    const broadFlights = await fetchLiveFlights({ bounds: '36.5,7.0,67.0,97.5' });
    const match = broadFlights.find(isMatch);
    if (match) return match;
  } catch (err) {
    // Ignore
  }

  return null;
}

module.exports = {
  fetchLiveFlights,
  fetchLiveFlightByNumber,
  getBoundsFromCenter,
  parseFlightradarEntry
};
