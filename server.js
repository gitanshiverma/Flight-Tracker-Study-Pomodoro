const express = require('express');
const cors = require('cors');
const path = require('path');
const flightRoutes = require('./routes/flightRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/flights', flightRoutes);

// Serve the frontend dashboard (public/index.html) at http://localhost:4000
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`✈️ Flight backend running on http://localhost:${PORT}`);
  console.log('📡 Flightradar24 live feed active (Target sector: 28.65, 77.23 / zoom 6)');
});

