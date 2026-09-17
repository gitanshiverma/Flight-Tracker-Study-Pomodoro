const express = require('express');
const router = express.Router();
const {
  getFlights,
  getAllAirports,
  getFlightByNumber,
  getLiveFlight,
  getRadarFlights
} = require('../services/flightService');

// GET /api/flights/airports — list all distinct airports for dropdowns
router.get('/airports', async (req, res) => {
  try {
    const airports = await getAllAirports();
    res.json({ count: airports.length, airports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve airports' });
  }
});

// GET /api/flights/radar — live Flightradar24 radar feed (defaults to 28.65, 77.23, zoom 6)
router.get('/radar', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 28.65;
    const lon = req.query.lon ? parseFloat(req.query.lon) : 77.23;
    const zoom = req.query.zoom ? parseInt(req.query.zoom, 10) : 6;
    const bounds = req.query.bounds || null;

    const flights = await getRadarFlights({ lat, lon, zoom, bounds });
    res.json({
      center: { lat, lon, zoom },
      count: flights.length,
      source: 'flightradar24',
      flights
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve Flightradar24 radar flights', details: err.message });
  }
});

// GET /api/flights/match-duration?minutes=120&tolerance=30
router.get('/match-duration', async (req, res) => {
  try {
    const minutes = parseFloat(req.query.minutes) || 60;
    const tolerance = parseFloat(req.query.tolerance) || 45;
    const flights = await getFlights({ durationMinutes: minutes, tolerance, ...req.query });
    res.json({ targetMinutes: minutes, count: flights.length, flights });
  } catch (err) {
    res.status(500).json({ error: 'Failed to match flights by duration' });
  }
});

// GET /api/flights — search, filter by from/to, duration, or list all
router.get('/', async (req, res) => {
  try {
    const flights = await getFlights(req.query);
    res.json({ count: flights.length, flights });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve flights' });
  }
});

// GET /api/flights/:flightNumber — single flight details
router.get('/:flightNumber', async (req, res) => {
  try {
    const flight = await getFlightByNumber(req.params.flightNumber);
    if (!flight) return res.status(404).json({ error: 'Flight not found' });
    res.json(flight);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching flight' });
  }
});

// GET /api/flights/:flightNumber/live — live lookup with Flightradar24 + session progress
router.get('/:flightNumber/live', async (req, res) => {
  try {
    const customElapsed = req.query.elapsedSeconds ? parseFloat(req.query.elapsedSeconds) : null;
    const flight = await getLiveFlight(req.params.flightNumber, customElapsed);
    if (!flight) return res.status(404).json({ error: 'Flight not found' });
    res.json(flight);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching live flight data' });
  }
});

module.exports = router;
