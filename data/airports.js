/**
 * Global & Regional Airport, Airline, and Aircraft Reference Database
 */

const AIRPORTS = {
  // India Major & Regional
  DEL: { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', lat: 28.5562, lon: 77.1000 },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', lat: 19.0896, lon: 72.8656 },
  BLR: { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', lat: 13.1986, lon: 77.7066 },
  MAA: { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', lat: 12.9941, lon: 80.1709 },
  CCU: { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', country: 'India', lat: 22.6547, lon: 88.4467 },
  HYD: { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', lat: 17.2403, lon: 78.4294 },
  AMD: { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India', lat: 23.0772, lon: 72.6347 },
  COK: { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', lat: 10.1556, lon: 76.3910 },
  GOI: { code: 'GOI', name: 'Dabolim Airport', city: 'Goa (Dabolim)', country: 'India', lat: 15.3808, lon: 73.8313 },
  GOX: { code: 'GOX', name: 'Manohar International Airport', city: 'Goa (Mopa)', country: 'India', lat: 15.7667, lon: 73.8667 },
  PNQ: { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India', lat: 18.5822, lon: 73.9197 },
  JAI: { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', lat: 26.8242, lon: 75.8122 },
  LKO: { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', country: 'India', lat: 26.7606, lon: 80.8893 },
  GAU: { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', country: 'India', lat: 26.1061, lon: 91.5859 },
  TRV: { code: 'TRV', name: 'Thiruvananthapuram International Airport', city: 'Thiruvananthapuram', country: 'India', lat: 8.4821, lon: 76.9200 },
  IXC: { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', country: 'India', lat: 30.6735, lon: 76.7885 },
  ATQ: { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', country: 'India', lat: 31.7096, lon: 74.7973 },
  VNS: { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', country: 'India', lat: 25.4524, lon: 82.8593 },
  PAT: { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', country: 'India', lat: 25.5913, lon: 85.0880 },
  BBI: { code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', country: 'India', lat: 20.2444, lon: 85.8178 },
  IXR: { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', country: 'India', lat: 23.3143, lon: 85.3217 },
  IDR: { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', country: 'India', lat: 22.7217, lon: 75.8011 },
  BHO: { code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', country: 'India', lat: 23.2875, lon: 77.3378 },
  NAG: { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', country: 'India', lat: 21.0922, lon: 79.0472 },
  SXR: { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', country: 'India', lat: 33.9871, lon: 74.7742 },
  IXJ: { code: 'IXJ', name: 'Jammu Airport', city: 'Jammu', country: 'India', lat: 32.6891, lon: 74.8374 },
  IXL: { code: 'IXL', name: 'Kushok Bakula Rimpochee Airport', city: 'Leh', country: 'India', lat: 34.1359, lon: 77.5465 },
  UDR: { code: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', country: 'India', lat: 24.6177, lon: 73.8961 },
  JDH: { code: 'JDH', name: 'Jodhpur Airport', city: 'Jodhpur', country: 'India', lat: 26.2511, lon: 73.0489 },
  BKB: { code: 'BKB', name: 'Nal Airport', city: 'Bikaner', country: 'India', lat: 28.0706, lon: 73.2064 },
  DED: { code: 'DED', name: 'Dehradun Airport (Jolly Grant)', city: 'Dehradun', country: 'India', lat: 30.1897, lon: 78.1803 },
  VTZ: { code: 'VTZ', name: 'Visakhapatnam International Airport', city: 'Visakhapatnam', country: 'India', lat: 17.7212, lon: 83.2245 },
  CCJ: { code: 'CCJ', name: 'Calicut International Airport', city: 'Kozhikode', country: 'India', lat: 11.1368, lon: 75.9553 },
  IXE: { code: 'IXE', name: 'Mangaluru International Airport', city: 'Mangaluru', country: 'India', lat: 12.9613, lon: 74.8901 },
  IXZ: { code: 'IXZ', name: 'Veer Savarkar International Airport', city: 'Port Blair', country: 'India', lat: 11.6412, lon: 92.7297 },

  // Middle East & Gulf
  DXB: { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lon: 55.3657 },
  DWC: { code: 'DWC', name: 'Al Maktoum International Airport', city: 'Dubai', country: 'United Arab Emirates', lat: 24.8960, lon: 55.1614 },
  AUH: { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4330, lon: 54.6511 },
  SHJ: { code: 'SHJ', name: 'Sharjah International Airport', city: 'Sharjah', country: 'United Arab Emirates', lat: 25.3286, lon: 55.5172 },
  DOH: { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lon: 51.6081 },
  JED: { code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lon: 39.1565 },
  RUH: { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9576, lon: 46.6988 },
  DMM: { code: 'DMM', name: 'King Fahd International Airport', city: 'Dammam', country: 'Saudi Arabia', lat: 26.4712, lon: 49.7978 },
  MED: { code: 'MED', name: 'Prince Mohammad Bin Abdulaziz International', city: 'Medina', country: 'Saudi Arabia', lat: 24.5534, lon: 39.7051 },
  MCT: { code: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', lat: 23.5933, lon: 58.2844 },
  KWI: { code: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', lat: 29.2266, lon: 47.9689 },
  BAH: { code: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', lat: 26.2708, lon: 50.6336 },

  // South Asia Regional
  LHE: { code: 'LHE', name: 'Allama Iqbal International Airport', city: 'Lahore', country: 'Pakistan', lat: 31.5216, lon: 74.4036 },
  ISB: { code: 'ISB', name: 'Islamabad International Airport', city: 'Islamabad', country: 'Pakistan', lat: 33.5494, lon: 72.8258 },
  KHI: { code: 'KHI', name: 'Jinnah International Airport', city: 'Karachi', country: 'Pakistan', lat: 24.9065, lon: 67.1608 },
  LYP: { code: 'LYP', name: 'Faisalabad International Airport', city: 'Faisalabad', country: 'Pakistan', lat: 31.3650, lon: 72.9950 },
  SKT: { code: 'SKT', name: 'Sialkot International Airport', city: 'Sialkot', country: 'Pakistan', lat: 32.5358, lon: 74.3639 },
  MUX: { code: 'MUX', name: 'Multan International Airport', city: 'Multan', country: 'Pakistan', lat: 30.2033, lon: 71.4192 },
  PEW: { code: 'PEW', name: 'Bacha Khan International Airport', city: 'Peshawar', country: 'Pakistan', lat: 33.9939, lon: 71.5147 },
  KTM: { code: 'KTM', name: 'Tribhuvan International Airport', city: 'Kathmandu', country: 'Nepal', lat: 27.6966, lon: 85.3591 },
  DAC: { code: 'DAC', name: 'Hazrat Shahjalal International Airport', city: 'Dhaka', country: 'Bangladesh', lat: 23.8433, lon: 90.3978 },
  CGP: { code: 'CGP', name: 'Shah Amanat International Airport', city: 'Chittagong', country: 'Bangladesh', lat: 22.2496, lon: 91.8133 },
  CMB: { code: 'CMB', name: 'Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka', lat: 7.1808, lon: 79.8841 },
  MLE: { code: 'MLE', name: 'Velana International Airport', city: 'Male', country: 'Maldives', lat: 4.1918, lon: 73.5290 },
  KBL: { code: 'KBL', name: 'Kabul International Airport', city: 'Kabul', country: 'Afghanistan', lat: 34.5659, lon: 69.2123 },
  ASB: { code: 'ASB', name: 'Ashgabat International Airport', city: 'Ashgabat', country: 'Turkmenistan', lat: 37.9868, lon: 58.3610 },
  TAS: { code: 'TAS', name: 'Islam Karimov Tashkent International Airport', city: 'Tashkent', country: 'Uzbekistan', lat: 41.2579, lon: 69.2812 },
  ALA: { code: 'ALA', name: 'Almaty International Airport', city: 'Almaty', country: 'Kazakhstan', lat: 43.3521, lon: 77.0405 },

  // Southeast & East Asia
  SIN: { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  BKK: { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lon: 100.7501 },
  DMK: { code: 'DMK', name: 'Don Mueang International Airport', city: 'Bangkok', country: 'Thailand', lat: 13.9126, lon: 100.6068 },
  HKT: { code: 'HKT', name: 'Phuket International Airport', city: 'Phuket', country: 'Thailand', lat: 8.1132, lon: 98.3169 },
  KUL: { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lon: 101.7072 },
  HKG: { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', lat: 22.3080, lon: 113.9185 },
  NRT: { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', lat: 35.7720, lon: 140.3929 },
  HND: { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  ICN: { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407 },
  PVG: { code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', lat: 31.1443, lon: 121.8083 },
  PEK: { code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', lat: 40.0799, lon: 116.6031 },
  CAN: { code: 'CAN', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China', lat: 23.3924, lon: 113.2988 },

  // Europe & Americas
  LHR: { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543 },
  LGW: { code: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', lat: 51.1537, lon: -0.1821 },
  CDG: { code: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
  FRA: { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
  MUC: { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lon: 11.7750 },
  AMS: { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
  ZRH: { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lon: 8.5555 },
  IST: { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lon: 28.7519 },
  JFK: { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', lat: 40.6413, lon: -73.7781 },
  EWR: { code: 'EWR', name: 'Newark Liberty International Airport', city: 'New York/Newark', country: 'United States', lat: 40.6895, lon: -74.1745 },
  ORD: { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', lat: 41.9742, lon: -87.9073 },
  SFO: { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', lat: 37.6213, lon: -122.3790 },
  LAX: { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', lat: 33.9416, lon: -118.4085 },
  YYZ: { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248 },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753 },
  MEL: { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lon: 144.8410 }
};

const AIRLINES = {
  IGO: { name: 'IndiGo', code: '6E', icao: 'IGO', country: 'India' },
  '6E': { name: 'IndiGo', code: '6E', icao: 'IGO', country: 'India' },
  AIC: { name: 'Air India', code: 'AI', icao: 'AIC', country: 'India' },
  AI: { name: 'Air India', code: 'AI', icao: 'AIC', country: 'India' },
  AXB: { name: 'Air India Express', code: 'IX', icao: 'AXB', country: 'India' },
  IX: { name: 'Air India Express', code: 'IX', icao: 'AXB', country: 'India' },
  SEJ: { name: 'SpiceJet', code: 'SG', icao: 'SEJ', country: 'India' },
  SG: { name: 'SpiceJet', code: 'SG', icao: 'SEJ', country: 'India' },
  VTI: { name: 'Vistara', code: 'UK', icao: 'VTI', country: 'India' },
  UK: { name: 'Vistara', code: 'UK', icao: 'VTI', country: 'India' },
  AKJ: { name: 'Akasa Air', code: 'QP', icao: 'AKJ', country: 'India' },
  QP: { name: 'Akasa Air', code: 'QP', icao: 'AKJ', country: 'India' },
  LLR: { name: 'Alliance Air', code: '9I', icao: 'LLR', country: 'India' },
  '9I': { name: 'Alliance Air', code: '9I', icao: 'LLR', country: 'India' },
  UAE: { name: 'Emirates', code: 'EK', icao: 'UAE', country: 'UAE' },
  EK: { name: 'Emirates', code: 'EK', icao: 'UAE', country: 'UAE' },
  ETD: { name: 'Etihad Airways', code: 'EY', icao: 'ETD', country: 'UAE' },
  EY: { name: 'Etihad Airways', code: 'EY', icao: 'ETD', country: 'UAE' },
  FDB: { name: 'flydubai', code: 'FZ', icao: 'FDB', country: 'UAE' },
  FZ: { name: 'flydubai', code: 'FZ', icao: 'FDB', country: 'UAE' },
  ABY: { name: 'Air Arabia', code: 'G9', icao: 'ABY', country: 'UAE' },
  G9: { name: 'Air Arabia', code: 'G9', icao: 'ABY', country: 'UAE' },
  QTR: { name: 'Qatar Airways', code: 'QR', icao: 'QTR', country: 'Qatar' },
  QR: { name: 'Qatar Airways', code: 'QR', icao: 'QTR', country: 'Qatar' },
  SVA: { name: 'Saudia', code: 'SV', icao: 'SVA', country: 'Saudi Arabia' },
  SV: { name: 'Saudia', code: 'SV', icao: 'SVA', country: 'Saudi Arabia' },
  OMA: { name: 'Oman Air', code: 'WY', icao: 'OMA', country: 'Oman' },
  WY: { name: 'Oman Air', code: 'WY', icao: 'OMA', country: 'Oman' },
  GFA: { name: 'Gulf Air', code: 'GF', icao: 'GFA', country: 'Bahrain' },
  GF: { name: 'Gulf Air', code: 'GF', icao: 'GFA', country: 'Bahrain' },
  PIA: { name: 'Pakistan International Airlines', code: 'PK', icao: 'PIA', country: 'Pakistan' },
  PK: { name: 'Pakistan International Airlines', code: 'PK', icao: 'PIA', country: 'Pakistan' },
  ABQ: { name: 'Airblue', code: 'PA', icao: 'ABQ', country: 'Pakistan' },
  PA: { name: 'Airblue', code: 'PA', icao: 'ABQ', country: 'Pakistan' },
  FJL: { name: 'Fly Jinnah', code: '9P', icao: 'FJL', country: 'Pakistan' },
  '9P': { name: 'Fly Jinnah', code: '9P', icao: 'FJL', country: 'Pakistan' },
  MAS: { name: 'Malaysia Airlines', code: 'MH', icao: 'MAS', country: 'Malaysia' },
  MH: { name: 'Malaysia Airlines', code: 'MH', icao: 'MAS', country: 'Malaysia' },
  SIA: { name: 'Singapore Airlines', code: 'SQ', icao: 'SIA', country: 'Singapore' },
  SQ: { name: 'Singapore Airlines', code: 'SQ', icao: 'SIA', country: 'Singapore' },
  THA: { name: 'Thai Airways', code: 'TG', icao: 'THA', country: 'Thailand' },
  TG: { name: 'Thai Airways', code: 'TG', icao: 'THA', country: 'Thailand' },
  BAW: { name: 'British Airways', code: 'BA', icao: 'BAW', country: 'UK' },
  BA: { name: 'British Airways', code: 'BA', icao: 'BAW', country: 'UK' },
  DLH: { name: 'Lufthansa', code: 'LH', icao: 'DLH', country: 'Germany' },
  LH: { name: 'Lufthansa', code: 'LH', icao: 'DLH', country: 'Germany' },
  AFR: { name: 'Air France', code: 'AF', icao: 'AFR', country: 'France' },
  AF: { name: 'Air France', code: 'AF', icao: 'AFR', country: 'France' },
  KLM: { name: 'KLM Royal Dutch Airlines', code: 'KL', icao: 'KLM', country: 'Netherlands' },
  KL: { name: 'KLM Royal Dutch Airlines', code: 'KL', icao: 'KLM', country: 'Netherlands' },
  THY: { name: 'Turkish Airlines', code: 'TK', icao: 'THY', country: 'Turkey' },
  TK: { name: 'Turkish Airlines', code: 'TK', icao: 'THY', country: 'Turkey' },
  TUA: { name: 'Turkmenistan Airlines', code: 'T5', icao: 'TUA', country: 'Turkmenistan' },
  T5: { name: 'Turkmenistan Airlines', code: 'T5', icao: 'TUA', country: 'Turkmenistan' },
  DHK: { name: 'DHL Air', code: 'D0', icao: 'DHK', country: 'Germany' }
};

const AIRCRAFT_TYPES = {
  A320: 'Airbus A320',
  A20N: 'Airbus A320neo',
  A321: 'Airbus A321',
  A21N: 'Airbus A321neo',
  A319: 'Airbus A319',
  A332: 'Airbus A330-200',
  A333: 'Airbus A330-300',
  A339: 'Airbus A330-900neo',
  A359: 'Airbus A350-900',
  A35K: 'Airbus A350-1000',
  A388: 'Airbus A380-800',
  B737: 'Boeing 737',
  B738: 'Boeing 737-800',
  B739: 'Boeing 737-900',
  B38M: 'Boeing 737 MAX 8',
  B39M: 'Boeing 737 MAX 9',
  B772: 'Boeing 777-200ER',
  B77W: 'Boeing 777-300ER',
  B77L: 'Boeing 777-200LR',
  B788: 'Boeing 787-8 Dreamliner',
  B789: 'Boeing 787-9 Dreamliner',
  B78X: 'Boeing 787-10 Dreamliner',
  B744: 'Boeing 747-400',
  B748: 'Boeing 747-8',
  B763: 'Boeing 767-300',
  AT76: 'ATR 72-600',
  AT72: 'ATR 72',
  DH8D: 'De Havilland Dash 8-400',
  E190: 'Embraer E190',
  E195: 'Embraer E195'
};

function resolveAirport(code) {
  if (!code) return null;
  const upper = String(code).trim().toUpperCase();
  if (AIRPORTS[upper]) return AIRPORTS[upper];
  return {
    code: upper,
    name: `${upper} Airport`,
    city: upper,
    country: 'International',
    lat: null,
    lon: null
  };
}

function resolveAirline(airlineCode, flightNumber) {
  if (airlineCode && AIRLINES[airlineCode.toUpperCase()]) {
    return AIRLINES[airlineCode.toUpperCase()].name;
  }
  if (flightNumber) {
    const prefix2 = flightNumber.slice(0, 2).toUpperCase();
    if (AIRLINES[prefix2]) return AIRLINES[prefix2].name;
    const prefix3 = flightNumber.slice(0, 3).toUpperCase();
    if (AIRLINES[prefix3]) return AIRLINES[prefix3].name;
  }
  return airlineCode || 'Commercial Airline';
}

function resolveAircraft(modelCode) {
  if (!modelCode) return 'Commercial Jetliner';
  const upper = String(modelCode).trim().toUpperCase();
  return AIRCRAFT_TYPES[upper] || upper;
}

module.exports = {
  AIRPORTS,
  AIRLINES,
  AIRCRAFT_TYPES,
  resolveAirport,
  resolveAirline,
  resolveAircraft
};
