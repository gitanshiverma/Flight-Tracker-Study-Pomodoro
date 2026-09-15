const express = require('express');
const router = express.Router();
const { getAllFlights, getFlightByNumber, getLiveFlight } = require('../services/flightService');

// GET /api/flights — all flights in the fallback dataset, with live-simulated progress
router.get('/', async (req, res) => {
  const flights = await getAllFlights();
  res.json({ count: flights.length, flights });
});

// GET /api/flights/:flightNumber — single flight, simulated progress only
router.get('/:flightNumber', async (req, res) => {
  const flight = await getFlightByNumber(req.params.flightNumber);
  if (!flight) return res.status(404).json({ error: 'Flight not found in dataset' });
  res.json(flight);
});

// GET /api/flights/:flightNumber/live — tries AviationStack + OpenSky,
// falls back to simulated data if either/both are unavailable
router.get('/:flightNumber/live', async (req, res) => {
  const flight = await getLiveFlight(req.params.flightNumber);
  if (!flight) return res.status(404).json({ error: 'Flight not found in dataset' });
  res.json(flight);
});

module.exports = router;
