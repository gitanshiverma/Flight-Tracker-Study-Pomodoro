/**
 * AviationStack (https://aviationstack.com) — free tier gives limited
 * requests/month, HTTP only on free plan. Set AVIATIONSTACK_KEY in your
 * environment to enable this; without it, callers should catch and fall
 * back to the local dataset (flightService already does this).
 */
async function fetchLiveStatus(flightIata) {
  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) return null;

  const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${encodeURIComponent(
    flightIata.replace('-', '')
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`AviationStack HTTP ${res.status}`);
  const json = await res.json();

  const entry = json?.data?.[0];
  if (!entry) return null;

  return {
    status: entry.flight_status,
    departureTimeUtc: entry.departure?.estimated || entry.departure?.scheduled,
    arrivalTimeUtc: entry.arrival?.estimated || entry.arrival?.scheduled,
    departureAirport: entry.departure?.airport,
    arrivalAirport: entry.arrival?.airport
  };
}

module.exports = { fetchLiveStatus };
