/* =========================================================================
   AEROFOCUS · 3D Flight Tracker Pomodoro Study Engine
   - Three.js 3D Night Flight, Procedural City, Glowing Highways, & Wing
   - Straight Route Line Progress with Live Telemetry
   - Study Duration Matcher & Flight Search
   - Web Audio API Cabin Hum & Seatbelt Chimes
   ========================================================================= */

// --- Global State ---
let allFlights = [];
let activeFlight = {
  flightNumber: 'AI-865',
  airline: 'Air India',
  aircraft: 'Boeing 787-8 Dreamliner',
  origin: { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi Intl', country: 'India', lat: 28.5562, lon: 77.1000 },
  destination: { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Intl', country: 'India', lat: 19.0896, lon: 72.8656 },
  durationMinutes: 135,
  distanceKm: 1137,
  cruiseAltitudeFt: 38000,
  cruiseSpeedKmh: 830,
  departureTimeUTC: '04:30',
  arrivalTimeUTC: '06:45'
};

let timerMode = 'flight'; // 'pomodoro' | 'flight' | 'custom'
let sessionTotalSeconds = 135 * 60;
let sessionElapsedSeconds = 0;
let isTimerRunning = false;
let timerInterval = null;

let seatbeltFastened = true;
let isZenMode = false;
let currentWallpaperMode = 0; // 0: 3D Night, 1: Photo Wing, 2: Sunset Horizon
const wallpaperModes = [
  { id: '3d-night', label: '3D Night World', photoClass: null },
  { id: 'photo-wing', label: 'Photo Wing View', photoClass: 'mode-wing' },
  { id: 'sunset', label: 'Sunset Cruise', photoClass: 'mode-sunset' }
];

/* =========================================================================
   1. THREE.JS 3D ANIMATED SCENE (Real-Time Night Flight & Wing)
========================================================================= */
let scene, camera, renderer;
let wingGroup, wingMesh, wingletMesh, strobeLight, navLightRed;
let cityParticles, highwayHeadlights, highwayTaillights, buildingMeshes = [];
let cloudBillboards = [];
let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
let clock = new THREE.Clock();

function initThreeScene() {
  const canvas = document.getElementById('webglCanvas');
  const width = window.innerWidth;
  const height = window.innerHeight;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050713, 0.0006);

  camera = new THREE.PerspectiveCamera(52, width / height, 1, 6000);
  // Position camera as looking out from passenger window backwards towards the wing and ground
  camera.position.set(-60, 45, 110);
  camera.lookAt(120, -10, -180);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // --- Lighting ---
  // Soft ambient moonlight
  const ambientLight = new THREE.AmbientLight(0x1a263d, 0.7);
  scene.add(ambientLight);

  // Distant warm city up-glow
  const cityGlowLight = new THREE.DirectionalLight(0xff9933, 0.4);
  cityGlowLight.position.set(0, -100, -100);
  scene.add(cityGlowLight);

  // Soft directional moonlight
  const moonLight = new THREE.DirectionalLight(0xaad4ff, 0.8);
  moonLight.position.set(100, 200, 100);
  scene.add(moonLight);

  // Build Scene Elements
  createStarfield();
  createHorizonGlow();
  createAirplaneWing();
  createProceduralCity();
  createHighways();
  createSkyscrapers();
  createVolumetricClouds();

  // Mouse / Parallax Events
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('resize', onWindowResize);

  animate3D();
}

/* --- Starfield --- */
function createStarfield() {
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1800;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    // Upper hemisphere sky dome
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.85 + 0.15);
    const radius = 2800 + Math.random() * 400;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) + 100;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    // Subtle star color temperature (cool white, pale blue, amber)
    const tint = Math.random();
    if (tint > 0.8) {
      colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
    } else if (tint > 0.6) {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.7;
    } else {
      colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0;
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.85
  });

  const starPoints = new THREE.Points(starGeo, starMat);
  scene.add(starPoints);
}

/* --- Horizon Dusk / Twilight Glow --- */
function createHorizonGlow() {
  const glowGeo = new THREE.CylinderGeometry(2600, 2600, 350, 48, 1, true);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: {
      colorHorizon: { value: new THREE.Color(0xff6a1a) },
      colorSky: { value: new THREE.Color(0x050818) }
    },
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 colorHorizon;
      uniform vec3 colorSky;
      varying vec3 vPosition;
      void main() {
        float h = smoothstep(-150.0, 150.0, vPosition.y);
        vec3 col = mix(colorHorizon, colorSky, h);
        float alpha = (1.0 - abs(vPosition.y) / 175.0) * 0.38;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.45));
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const horizonMesh = new THREE.Mesh(glowGeo, glowMat);
  horizonMesh.position.set(0, -30, -500);
  scene.add(horizonMesh);
}

/* --- 3D Realistic Airplane Swept Wing & Sharklet --- */
function createAirplaneWing() {
  wingGroup = new THREE.Group();

  // Modern composite swept airliner wing (A350/B787 inspired)
  // 1. Wing Main Body (Swept & tapered airfoil)
  const wingShape = new THREE.Shape();
  // Airfoil section profile
  wingShape.moveTo(0, 0);
  wingShape.bezierCurveTo(8, 3.5, 30, 4.0, 75, 0.5);
  wingShape.bezierCurveTo(90, -0.5, 95, -1.5, 98, -2.0);
  wingShape.bezierCurveTo(75, -2.2, 30, -2.0, 0, 0);

  const extrudeSettings = {
    steps: 24,
    depth: 260,
    bevelEnabled: true,
    bevelThickness: 1.2,
    bevelSize: 0.8,
    bevelSegments: 4
  };

  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  // Center and sweep geometry
  const pos = wingGeometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const progress = z / 260; // 0 (root) to 1 (tip)

    // Taper chord & thickness towards tip
    const scale = 1.0 - progress * 0.65;
    let x = pos.getX(i) * scale;
    let y = pos.getY(i) * scale;

    // Sweep back along Z
    x += progress * 140;
    // Dihedral upward curve
    y += Math.pow(progress, 1.8) * 28;

    pos.setXYZ(i, x, y, z);
  }
  wingGeometry.computeVertexNormals();

  // Premium Airliner Metallic Composite Material
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8edf5,
    roughness: 0.28,
    metalness: 0.65,
    envMapIntensity: 1.2
  });

  wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
  wingMesh.rotation.set(0.12, 2.1, -0.06);
  wingMesh.position.set(-20, 15, 40);
  wingGroup.add(wingMesh);

  // 2. Leading Edge Chrome Strip (Gleaming titanium de-icing slat edge)
  const slatGeo = new THREE.CylinderGeometry(1.2, 0.4, 260, 12);
  const slatMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.95
  });
  const slatMesh = new THREE.Mesh(slatGeo, slatMat);
  slatMesh.rotation.set(Math.PI / 2, 0, 0.42);
  slatMesh.position.set(40, 22, -80);
  wingGroup.add(slatMesh);

  // 3. Flap Track Canoe Fairings (Aerodynamic pods under wing)
  for (let f = 0; f < 3; f++) {
    const podGeo = new THREE.ConeGeometry(2.4 - f * 0.4, 38 - f * 6, 12);
    const podMat = new THREE.MeshStandardMaterial({ color: 0xd4dce8, roughness: 0.35, metalness: 0.5 });
    const podMesh = new THREE.Mesh(podGeo, podMat);
    podMesh.rotation.set(Math.PI / 2 + 0.1, 0, 0.4);
    const zOffset = 30 + f * 55;
    podMesh.position.set(25 + f * 26, 4 + f * 4.5, 40 - zOffset);
    wingGroup.add(podMesh);
  }

  // 4. Upturned Winglet / Sharklet
  const sharkletGeo = new THREE.BoxGeometry(6, 32, 22);
  const sharkletMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Airline Cyan/Blue Accent
    roughness: 0.25,
    metalness: 0.6
  });
  wingletMesh = new THREE.Mesh(sharkletGeo, sharkletMat);
  wingletMesh.position.set(138, 48, -175);
  wingletMesh.rotation.set(0.2, 0.5, 0.45);
  wingGroup.add(wingletMesh);

  // 5. Wingtip Strobe Light & Flare PointLight
  strobeLight = new THREE.PointLight(0xffffff, 0, 900, 1.6);
  strobeLight.position.set(142, 50, -178);
  wingGroup.add(strobeLight);

  // Small strobe glass bulb
  const bulbGeo = new THREE.SphereGeometry(1.6, 16, 16);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  bulbMesh.position.copy(strobeLight.position);
  wingGroup.add(bulbMesh);

  // 6. Red Port Navigation Beacon
  navLightRed = new THREE.PointLight(0xff1a1a, 2.5, 80);
  navLightRed.position.set(139, 47, -170);
  wingGroup.add(navLightRed);

  const navBulbGeo = new THREE.SphereGeometry(1.2, 12, 12);
  const navBulbMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const navBulb = new THREE.Mesh(navBulbGeo, navBulbMat);
  navBulb.position.copy(navLightRed.position);
  wingGroup.add(navBulb);

  // 7. Wing Inspection Floodlight (illuminating wing surface)
  const wingFlood = new THREE.SpotLight(0xffffff, 1.8, 300, Math.PI / 4, 0.4, 1.2);
  wingFlood.position.set(-40, 30, 80);
  wingFlood.target = wingMesh;
  wingGroup.add(wingFlood);

  scene.add(wingGroup);
}

/* --- Procedural Glowing Night City Lights --- */
function createProceduralCity() {
  const cityCount = 20000;
  const cityGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(cityCount * 3);
  const colors = new Float32Array(cityCount * 3);
  const sizes = new Float32Array(cityCount);

  for (let i = 0; i < cityCount; i++) {
    // Sprawling city plain below (Y: -350 to -450)
    const x = (Math.random() - 0.5) * 3600;
    const z = (Math.random() - 0.5) * 3600;
    const y = -380 + (Math.sin(x * 0.005) + Math.cos(z * 0.005)) * 25;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Rich City Palette: Amber Sodium (60%), Golden Warm (25%), Cool LED White (10%), Neon Cyan/Pink (5%)
    const r = Math.random();
    if (r < 0.60) {
      // Sodium vapor orange/amber
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.55 + Math.random() * 0.2; colors[i * 3 + 2] = 0.08;
      sizes[i] = 2.8 + Math.random() * 2.0;
    } else if (r < 0.85) {
      // Golden streetlights
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.82; colors[i * 3 + 2] = 0.35;
      sizes[i] = 3.2 + Math.random() * 2.2;
    } else if (r < 0.95) {
      // Modern LED white
      colors[i * 3] = 0.85; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 1.0;
      sizes[i] = 2.5 + Math.random() * 1.8;
    } else {
      // Commercial Neon Cyan / Magenta
      colors[i * 3] = 0.1; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0;
      sizes[i] = 3.8 + Math.random() * 2.0;
    }
  }

  cityGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  cityGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  cityGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Custom Point Shader for soft glowing city dots
  const cityMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (280.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float strength = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, strength * 0.95);
      }
    `,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  cityParticles = new THREE.Points(cityGeo, cityMat);
  scene.add(cityParticles);
}

/* --- Flowing Glowing Highway Arterials & Interchanges --- */
function createHighways() {
  const headCount = 4000;
  const tailCount = 4000;

  // Headlights (Warm White / Yellow Streaming forward)
  const headGeo = new THREE.BufferGeometry();
  const headPos = new Float32Array(headCount * 3);
  const headColors = new Float32Array(headCount * 3);

  // Taillights (Glowing Red Streaming opposite)
  const tailGeo = new THREE.BufferGeometry();
  const tailPos = new Float32Array(tailCount * 3);
  const tailColors = new Float32Array(tailCount * 3);

  // Generate 8 curved highway ribbons
  for (let i = 0; i < headCount; i++) {
    const highwayId = i % 8;
    const t = (i / headCount) * Math.PI * 6;
    const curveX = (highwayId - 3.5) * 420 + Math.sin(t * 0.4) * 220;
    const curveZ = ((i / headCount) - 0.5) * 3600;
    const y = -375;

    headPos[i * 3] = curveX - 4;
    headPos[i * 3 + 1] = y;
    headPos[i * 3 + 2] = curveZ;

    headColors[i * 3] = 1.0;
    headColors[i * 3 + 1] = 0.95;
    headColors[i * 3 + 2] = 0.7;

    tailPos[i * 3] = curveX + 4;
    tailPos[i * 3 + 1] = y;
    tailPos[i * 3 + 2] = curveZ;

    tailColors[i * 3] = 1.0;
    tailColors[i * 3 + 1] = 0.15;
    tailColors[i * 3 + 2] = 0.1;
  }

  headGeo.setAttribute('position', new THREE.BufferAttribute(headPos, 3));
  headGeo.setAttribute('color', new THREE.BufferAttribute(headColors, 3));
  const headMat = new THREE.PointsMaterial({ size: 4.5, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
  highwayHeadlights = new THREE.Points(headGeo, headMat);
  scene.add(highwayHeadlights);

  tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos, 3));
  tailGeo.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
  const tailMat = new THREE.PointsMaterial({ size: 4.0, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
  highwayTaillights = new THREE.Points(tailGeo, tailMat);
  scene.add(highwayTaillights);
}

/* --- 3D Skyscraper Clusters Below --- */
function createSkyscrapers() {
  const buildingGroup = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x081020,
    roughness: 0.3,
    metalness: 0.7,
    emissive: 0x0f2038,
    emissiveIntensity: 0.4
  });

  const count = 180;
  for (let i = 0; i < count; i++) {
    const cluster = i % 5;
    const cx = (cluster - 2) * 600 + (Math.random() - 0.5) * 250;
    const cz = (Math.random() - 0.5) * 2800;
    const width = 20 + Math.random() * 25;
    const height = 40 + Math.random() * 110;
    const depth = 20 + Math.random() * 25;

    const bMesh = new THREE.Mesh(boxGeo, buildingMat);
    bMesh.scale.set(width, height, depth);
    bMesh.position.set(cx, -380 + height / 2, cz);
    buildingGroup.add(bMesh);
    buildingMeshes.push(bMesh);

    // Red obstruction beacon on top of tallest towers
    if (height > 90) {
      const beaconGeo = new THREE.SphereGeometry(1.8, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(cx, -380 + height + 2, cz);
      buildingGroup.add(beacon);
    }
  }

  scene.add(buildingGroup);
}

/* --- Volumetric Drifting Clouds Below Wing --- */
function createVolumetricClouds() {
  const cloudCount = 35;
  const cloudGeo = new THREE.SphereGeometry(70, 16, 12);
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0x18243b,
    transparent: true,
    opacity: 0.22,
    fog: true
  });

  for (let i = 0; i < cloudCount; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.scale.set(1.8 + Math.random() * 1.5, 0.4 + Math.random() * 0.3, 1.2 + Math.random() * 1.0);
    cloud.position.set(
      (Math.random() - 0.5) * 2200,
      -120 + Math.random() * 90,
      (Math.random() - 0.5) * 2400
    );
    scene.add(cloud);
    cloudBillboards.push(cloud);
  }
}

/* --- Mouse Parallax Handler --- */
function onMouseMove(e) {
  targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}

function onWindowResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* --- 3D Animation Render Loop --- */
function animate3D() {
  requestAnimationFrame(animate3D);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // 1. Mouse Parallax Smoothing
  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;

  camera.rotation.y = -0.65 + mouseX * 0.12;
  camera.rotation.x = -0.08 - mouseY * 0.08;
  camera.position.x = -60 + mouseX * 12;
  camera.position.y = 45 - mouseY * 8;

  // 2. Realistic Cruising Aerodynamics & Gentle Wing Turbulence
  if (wingGroup) {
    // Gentle breathing roll (+/- 0.4 deg) and pitch wobble
    wingGroup.rotation.z = Math.sin(time * 0.8) * 0.012;
    wingGroup.rotation.x = Math.cos(time * 0.6) * 0.008;
    wingGroup.position.y = Math.sin(time * 1.2) * 1.2;

    // Wingtip aeroelastic flex bounce
    if (wingletMesh) {
      wingletMesh.position.y = 48 + Math.sin(time * 2.4) * 0.8;
    }
  }

  // 3. Aviation Double-Flash Strobe Light Cycle
  // Cycle repeats every 1.35 seconds
  const strobeCycle = time % 1.35;
  let isFlash = false;
  if ((strobeCycle > 0.0 && strobeCycle < 0.07) || (strobeCycle > 0.18 && strobeCycle < 0.25)) {
    isFlash = true;
  }

  if (strobeLight) {
    strobeLight.intensity = isFlash ? 14.0 : 0.0;
  }

  // Synchronize CSS Strobe Flash Flare for Photo Mode as well
  const strobeOverlay = document.getElementById('wingStrobeOverlay');
  if (strobeOverlay) {
    strobeOverlay.style.opacity = isFlash ? '0.95' : '0.0';
  }

  // 4. Ground City & Highway Motion (Simulates 900 km/h flight speed)
  const flightSpeed = 160 * delta;

  if (cityParticles) {
    const pos = cityParticles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let z = pos.getZ(i) + flightSpeed;
      if (z > 1600) z = -2000;
      pos.setZ(i, z);
    }
    cityParticles.geometry.attributes.position.needsUpdate = true;
  }

  if (highwayHeadlights && highwayTaillights) {
    const hPos = highwayHeadlights.geometry.attributes.position;
    const tPos = highwayTaillights.geometry.attributes.position;
    for (let i = 0; i < hPos.count; i++) {
      let hz = hPos.getZ(i) + flightSpeed * 1.2;
      if (hz > 1600) hz = -2000;
      hPos.setZ(i, hz);

      let tz = tPos.getZ(i) + flightSpeed * 0.8;
      if (tz > 1600) tz = -2000;
      tPos.setZ(i, tz);
    }
    highwayHeadlights.geometry.attributes.position.needsUpdate = true;
    highwayTaillights.geometry.attributes.position.needsUpdate = true;
  }

  // 5. Drifting Clouds
  for (let i = 0; i < cloudBillboards.length; i++) {
    const c = cloudBillboards[i];
    c.position.z += flightSpeed * 0.9;
    if (c.position.z > 1400) {
      c.position.z = -1800;
      c.position.x = (Math.random() - 0.5) * 2200;
    }
  }

  renderer.render(scene, camera);
}

/* =========================================================================
   2. WEB AUDIO API IMMERSION (Binaural Cabin Hum & Chimes)
========================================================================= */
let audioCtx = null;
let cabinGainNode = null;
let isAudioActive = false;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function startCabinHum() {
  initAudioContext();
  if (cabinGainNode) return;

  // 1. Synthesize Binaural Pink Noise (Jet Airflow rushing over fuselage)
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11;
    b6 = white * 0.115926;
  }

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  // Biquad Lowpass filter to simulate sound muffled inside insulated cabin
  const cabinFilter = audioCtx.createBiquadFilter();
  cabinFilter.type = 'lowpass';
  cabinFilter.frequency.setValueAtTime(320, audioCtx.currentTime);

  // 2. Dual Sub-Harmonic Oscillators for Jet Engine Turbine Drone
  const subOsc1 = audioCtx.createOscillator();
  subOsc1.type = 'sine';
  subOsc1.frequency.setValueAtTime(54, audioCtx.currentTime); // 54 Hz rumble

  const subOsc2 = audioCtx.createOscillator();
  subOsc2.type = 'sine';
  subOsc2.frequency.setValueAtTime(108, audioCtx.currentTime); // 108 Hz hum

  const subGain = audioCtx.createGain();
  subGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
  subOsc1.connect(subGain);
  subOsc2.connect(subGain);

  cabinGainNode = audioCtx.createGain();
  cabinGainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
  cabinGainNode.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 1.5);

  whiteNoise.connect(cabinFilter);
  cabinFilter.connect(cabinGainNode);
  subGain.connect(cabinGainNode);
  cabinGainNode.connect(audioCtx.destination);

  whiteNoise.start();
  subOsc1.start();
  subOsc2.start();
}

function stopCabinHum() {
  if (cabinGainNode && audioCtx) {
    cabinGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    setTimeout(() => {
      cabinGainNode = null;
    }, 800);
  }
}

function toggleCabinAudio() {
  initAudioContext();
  isAudioActive = !isAudioActive;
  const label = document.getElementById('audioLabel');
  if (isAudioActive) {
    startCabinHum();
    label.innerText = 'Cabin Hum: ON';
    document.getElementById('audioToggleBtn').style.borderColor = 'var(--accent-cyan)';
  } else {
    stopCabinHum();
    label.innerText = 'Cabin Hum: OFF';
    document.getElementById('audioToggleBtn').style.borderColor = '';
  }
}

/* --- Authentic 2-Tone "Ding-Dong" Fasten Seatbelt Chime --- */
function playSeatbeltChime() {
  initAudioContext();
  const now = audioCtx.currentTime;

  // Tone 1: High Note (587.33 Hz / D5)
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(587.33, now);
  gain1.gain.setValueAtTime(0.32, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start(now);
  osc1.stop(now + 0.85);

  // Tone 2: Low Note (440 Hz / A4) after 300ms
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(440.0, now + 0.3);
  gain2.gain.setValueAtTime(0.35, now + 0.3);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(now + 0.3);
  osc2.stop(now + 1.4);
}

/* =========================================================================
   3. STRAIGHT ROUTE LINE & STUDY TIMER ENGINE
========================================================================= */

function updateFlightDisplay() {
  if (!activeFlight) return;

  // Flight Identity
  document.getElementById('airlineTag').innerText = (activeFlight.airline || 'AIRLINE').toUpperCase();
  document.getElementById('flightNoDisplay').innerText = activeFlight.flightNumber || 'FLIGHT';
  document.getElementById('aircraftTypeDisplay').innerText = activeFlight.aircraft || 'Commercial Jetliner';

  // Origin & Destination
  const orig = activeFlight.origin || {};
  const dest = activeFlight.destination || {};
  document.getElementById('originCode').innerText = orig.code || 'DEP';
  document.getElementById('originCity').innerText = orig.city ? `${orig.city}` : 'Origin';
  document.getElementById('depTime').innerText = `STD: ${activeFlight.departureTimeUTC || '00:00'} UTC`;

  document.getElementById('destCode').innerText = dest.code || 'ARR';
  document.getElementById('destCity').innerText = dest.city ? `${dest.city}` : 'Destination';
  document.getElementById('arrTime').innerText = `STA: ${activeFlight.arrivalTimeUTC || '00:00'} UTC`;

  updateTelemetryAndProgress();
}

function updateTelemetryAndProgress() {
  const total = Math.max(1, sessionTotalSeconds);
  const progress = Math.min(1.0, sessionElapsedSeconds / total);
  const percent = Math.round(progress * 100);

  // 1. Move straight progress bar and airplane icon
  const progressBar = document.getElementById('routeProgressBar');
  const planeMarker = document.getElementById('planeMarker');
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (planeMarker) planeMarker.style.left = `${percent}%`;

  // 2. Flight Phase & Telemetry Calculation
  let phase = 'CRUISING';
  let altitude = 38000;
  let speed = 495;

  if (percent === 0) {
    phase = 'BOARDING & TAXI';
    altitude = 0;
    speed = 15;
  } else if (percent < 15) {
    phase = 'CLIMBING · FL240';
    altitude = Math.round((percent / 15) * 38000);
    speed = Math.round(250 + (percent / 15) * 245);
  } else if (percent < 85) {
    phase = `CRUISING · FL${Math.round(activeFlight.cruiseAltitudeFt / 100) || 380}`;
    altitude = activeFlight.cruiseAltitudeFt || 38000;
    speed = Math.round((activeFlight.cruiseSpeedKmh ? activeFlight.cruiseSpeedKmh * 0.54 : 495) + Math.sin(Date.now() * 0.001) * 6);
  } else if (percent < 99) {
    phase = 'DESCENT · FL120';
    const descRatio = (percent - 85) / 14;
    altitude = Math.round(38000 * (1.0 - descRatio));
    speed = Math.round(495 - descRatio * 250);
  } else {
    phase = 'TOUCHDOWN · TAXI';
    altitude = 0;
    speed = 20;
  }

  document.getElementById('flightPhaseText').innerText = phase;
  document.getElementById('teleAltitude').innerHTML = `${altitude.toLocaleString()} <span>FT</span>`;
  document.getElementById('teleSpeed').innerHTML = `${speed} <span>KTS</span>`;

  // Distance remaining
  const totalKm = activeFlight.distanceKm || 2000;
  const totalNM = Math.round(totalKm * 0.539957);
  const remNM = Math.max(0, Math.round(totalNM * (1.0 - progress)));
  document.getElementById('teleDistance').innerHTML = `${remNM.toLocaleString()} <span>NM</span>`;

  // ETA Countdown
  const remainingSecs = Math.max(0, sessionTotalSeconds - sessionElapsedSeconds);
  document.getElementById('teleETA').innerText = formatHMS(remainingSecs);

  // Digital Study Clock Display
  document.getElementById('studyClockDisplay').innerText = formatMS(remainingSecs);
  document.getElementById('sessionStatusSub').innerText = isTimerRunning
    ? `Study In-Flight · ${percent}% Completed · Next Waypoint: WP${Math.min(5, Math.floor(progress * 4) + 1)}`
    : `Session Ready · Target Time: ${formatHMS(sessionTotalSeconds)}`;
}

function formatMS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatHMS(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* --- Study Timer Controls --- */
function toggleTimer() {
  if (isTimerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (sessionElapsedSeconds >= sessionTotalSeconds) {
    sessionElapsedSeconds = 0;
  }
  isTimerRunning = true;
  document.getElementById('mainTimerBtn').classList.add('running');
  document.getElementById('mainTimerBtnText').innerText = 'Pause Session';
  document.getElementById('timerPlayIcon').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

  playSeatbeltChime();

  if (!timerInterval) {
    timerInterval = setInterval(() => {
      sessionElapsedSeconds++;
      updateTelemetryAndProgress();

      if (sessionElapsedSeconds >= sessionTotalSeconds) {
        completeSession();
      }
    }, 1000);
  }
}

function pauseTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('mainTimerBtn').classList.remove('running');
  document.getElementById('mainTimerBtnText').innerText = 'Resume Flight';
  document.getElementById('timerPlayIcon').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
}

function resetTimer() {
  pauseTimer();
  sessionElapsedSeconds = 0;
  updateTelemetryAndProgress();
  document.getElementById('mainTimerBtnText').innerText = 'Start Study Session';
}

function completeSession() {
  pauseTimer();
  playSeatbeltChime();
  const celModal = document.getElementById('celebrationModal');
  const celDur = document.getElementById('celDuration');
  const celDist = document.getElementById('celDistance');
  if (celDur) celDur.innerText = formatHMS(sessionTotalSeconds);
  if (celDist) celDist.innerText = `${Math.round((activeFlight.distanceKm || 2000) * 0.539957).toLocaleString()} NM`;
  if (celModal) celModal.classList.add('open');
}

function closeCelebrationModal() {
  document.getElementById('celebrationModal').classList.remove('open');
  resetTimer();
}

function setTimerMode(mode) {
  timerMode = mode;
  document.getElementById('tabModePomodoro').classList.toggle('active', mode === 'pomodoro');
  document.getElementById('tabModeFlight').classList.toggle('active', mode === 'flight');
  document.getElementById('tabModeCustom').classList.toggle('active', mode === 'custom');

  if (mode === 'pomodoro') {
    sessionTotalSeconds = 25 * 60;
  } else if (mode === 'flight') {
    sessionTotalSeconds = (activeFlight.durationMinutes || 135) * 60;
  } else if (mode === 'custom') {
    openFlightSearchModal();
    return;
  }
  resetTimer();
}

/* =========================================================================
   4. BACKEND API CLIENT & FLIGHT SEARCH ENGINE
========================================================================= */

async function loadAirports() {
  try {
    const res = await fetch('/api/flights/airports');
    const data = await res.json();
    if (data && data.airports) {
      const origSelect = document.getElementById('selectOrigin');
      const destSelect = document.getElementById('selectDestination');
      
      let html = '<option value="">-- All Airports --</option>';
      data.airports.forEach(a => {
        html += `<option value="${a.code}">${a.code} · ${a.city} (${a.country})</option>`;
      });
      origSelect.innerHTML = html;
      destSelect.innerHTML = html;
    }
  } catch (err) {
    console.warn('Could not load airports from backend:', err);
  }
}

async function fetchAndRenderFlights(filterParams = {}) {
  const grid = document.getElementById('flightResultsGrid');
  grid.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1; padding: 20px; text-align: center;">Searching flights in database...</div>';

  try {
    const query = new URLSearchParams();
    if (filterParams.durationMinutes) query.append('durationMinutes', filterParams.durationMinutes);
    if (filterParams.tolerance) query.append('tolerance', filterParams.tolerance);
    if (filterParams.from) query.append('from', filterParams.from);
    if (filterParams.to) query.append('to', filterParams.to);
    if (filterParams.search) query.append('search', filterParams.search);

    const res = await fetch(`/api/flights?${query.toString()}`);
    const data = await res.json();
    allFlights = data.flights || [];

    renderFlightCards(allFlights);
  } catch (err) {
    grid.innerHTML = '<div style="color: #f87171; font-size: 13px; grid-column: 1/-1;">Error connecting to flight database. Check backend server.</div>';
  }
}

function renderFlightCards(flights) {
  const grid = document.getElementById('flightResultsGrid');
  if (!flights || flights.length === 0) {
    grid.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1; padding: 30px; text-align: center;">No flights found matching criteria. Try adjusting time or route filters.</div>';
    return;
  }

  let html = '';
  flights.forEach(f => {
    const isSelected = activeFlight && activeFlight.flightNumber === f.flightNumber;
    const durHours = Math.floor(f.durationMinutes / 60);
    const durMins = f.durationMinutes % 60;
    const durFormatted = durHours > 0 ? `${durHours}h ${durMins}m` : `${durMins}m`;

    const matchBadge = f.matchScore !== undefined
      ? `<span class="fcard-badge">${f.matchScore}% Study Match</span>`
      : `<span class="fcard-badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; border-color: rgba(56,189,248,0.3);">${durFormatted}</span>`;

    html += `
      <div class="flight-card-item ${isSelected ? 'selected' : ''}" onclick="selectFlight('${f.flightNumber}')">
        <div class="fcard-top">
          <span class="fcard-airline">${f.airline} · <strong style="color: #fff;">${f.flightNumber}</strong></span>
          ${matchBadge}
        </div>
        <div class="fcard-route-row">
          <div class="fcard-airport">
            <span class="fcard-code">${f.origin.code}</span>
            <span class="fcard-city">${f.origin.city}</span>
          </div>
          <div class="fcard-duration-pill">
            <span>✈️ ${durFormatted}</span>
          </div>
          <div class="fcard-airport dest">
            <span class="fcard-code">${f.destination.code}</span>
            <span class="fcard-city">${f.destination.city}</span>
          </div>
        </div>
        <div class="fcard-footer">
          <span>${f.aircraft}</span>
          <span>${Math.round(f.distanceKm * 0.54)} NM · FL${Math.round(f.cruiseAltitudeFt / 100)}</span>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

function selectFlight(flightNumber) {
  const flight = allFlights.find(f => f.flightNumber === flightNumber);
  if (!flight) return;

  activeFlight = flight;
  if (timerMode === 'flight' || timerMode === 'custom') {
    sessionTotalSeconds = (flight.durationMinutes || 135) * 60;
  }
  sessionElapsedSeconds = 0;
  pauseTimer();
  updateFlightDisplay();
  closeFlightSearchModal();
  playSeatbeltChime();
}

/* =========================================================================
   5. MODAL & HUD CONTROLS
========================================================================= */

function openFlightSearchModal() {
  document.getElementById('flightModal').classList.add('open');
  onDurationInputsChanged();
}

function closeFlightSearchModal() {
  document.getElementById('flightModal').classList.remove('open');
}

function switchModalTab(tab) {
  document.getElementById('modalTabDuration').classList.toggle('active', tab === 'duration');
  document.getElementById('modalTabFromTo').classList.toggle('active', tab === 'fromto');
  document.getElementById('modalTabAll').classList.toggle('active', tab === 'all');

  document.getElementById('tabContentDuration').style.display = tab === 'duration' ? 'block' : 'none';
  document.getElementById('tabContentFromTo').style.display = tab === 'fromto' ? 'block' : 'none';

  if (tab === 'duration') {
    onDurationInputsChanged();
  } else if (tab === 'fromto') {
    onRouteFilterChanged();
  } else {
    fetchAndRenderFlights();
  }
}

function setQuickDuration(h, m) {
  document.getElementById('inputHours').value = h;
  document.getElementById('inputMinutes').value = m;
  onDurationInputsChanged();
}

function onDurationInputsChanged() {
  const h = parseInt(document.getElementById('inputHours').value) || 0;
  const m = parseInt(document.getElementById('inputMinutes').value) || 0;
  const totalMins = Math.max(20, (h * 60) + m);
  fetchAndRenderFlights({ durationMinutes: totalMins, tolerance: 45 });
}

function onRouteFilterChanged() {
  const from = document.getElementById('selectOrigin').value;
  const to = document.getElementById('selectDestination').value;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  fetchAndRenderFlights(params);
}

let searchDebounce = null;
function onSearchInputChanged() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    const q = document.getElementById('searchInput').value;
    fetchAndRenderFlights({ search: q });
  }, 250);
}

/* --- Seatbelt Sign Toggle --- */
function toggleSeatbeltSign() {
  seatbeltFastened = !seatbeltFastened;
  const badge = document.getElementById('seatbeltBadge');
  const text = document.getElementById('seatbeltText');

  playSeatbeltChime();

  if (seatbeltFastened) {
    badge.classList.remove('cruising');
    text.innerText = 'SEATBELT ON';
  } else {
    badge.classList.add('cruising');
    text.innerText = 'FREE TO MOVE';
  }
}

/* --- Window Frame Toggle --- */
function toggleWindowFrame() {
  const frame = document.getElementById('windowFrame');
  frame.classList.toggle('active');
  const btn = document.getElementById('windowToggleBtn');
  btn.classList.toggle('primary', frame.classList.contains('active'));
}

/* --- Wallpaper Mode Switcher --- */
function cycleWallpaperMode() {
  currentWallpaperMode = (currentWallpaperMode + 1) % wallpaperModes.length;
  const mode = wallpaperModes[currentWallpaperMode];

  document.getElementById('bgModeLabel').innerText = mode.label;
  const photoLayer = document.getElementById('photoBgLayer');

  if (mode.photoClass) {
    photoLayer.className = `photo-bg-layer ${mode.photoClass} active`;
  } else {
    photoLayer.className = 'photo-bg-layer';
  }
}

/* --- Pure Zen Mode (Full-Screen 3D Animated Wallpaper) --- */
function toggleZenMode(enable) {
  isZenMode = enable;
  const ui = document.getElementById('uiLayer');
  const restoreBtn = document.getElementById('zenRestoreBtn');

  if (isZenMode) {
    ui.classList.add('zen-hidden');
    restoreBtn.classList.add('visible');
  } else {
    ui.classList.remove('zen-hidden');
    restoreBtn.classList.remove('visible');
  }
}

// Keyboard shortcuts (Space: Zen mode / Esc: Exit Zen mode)
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
    e.preventDefault();
    toggleZenMode(!isZenMode);
  } else if (e.code === 'Escape') {
    if (isZenMode) toggleZenMode(false);
    closeFlightSearchModal();
  }
});

/* =========================================================================
   6. APP BOOTSTRAP
========================================================================= */
window.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
  loadAirports();
  fetchAndRenderFlights({ durationMinutes: 135 });
  updateFlightDisplay();
});
