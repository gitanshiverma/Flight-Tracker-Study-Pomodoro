/**
 * OpenSky Network (https://opensky-network.org) — anonymous access is free
 * but rate-limited (~100 requests / day per IP, more with a free account).
 * Looks up a live state vector by callsign from the /states/all snapshot.
 */
async function fetchLivePosition(callsign) {
  if (!callsign) return null;

  const url = 'https://opensky-network.org/api/states/all';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);
  const json = await res.json();

  const states = json?.states || [];
  // state vector columns: [icao24, callsign, origin_country, time_position,
  // last_contact, longitude, latitude, baro_altitude, on_ground, velocity, ...]
  const match = states.find(
    (s) => (s[1] || '').trim().toUpperCase() === callsign.toUpperCase()
  );
  if (!match) return null;

  const [, , , , , lon, lat, , , velocity, , , baroAltitude] = match;
  if (lat == null || lon == null) return null;

  return {
    lat,
    lon,
    altitude: baroAltitude,
    velocity
  };
}

module.exports = { fetchLivePosition };
