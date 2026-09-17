/* =========================================================================
   AEROFOCUS · 3D Dynamic Moving Flight Tracker & Study Engine
   - 3D Dynamic Moving Sunset Flight matching the Exact Sunset Wing & City View
   - 3D Scrolling Night City Grid (50,000+ Lights), Flowing Highways & Warehouses
   - Fiery Red-Orange Sunset Horizon, Metallic Specular Wing & Steady Red Beacon
   - No White Blinking Lights (Clean, Calm Flight Immersion)
   - Straight Route Line Progress with Moving Airplane & Live Telemetry
   - Study Duration Matcher & Flight Search
   - Web Audio API Binaural Cabin Hum & Seatbelt Chimes
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
let currentWallpaperMode = 0; // 0: Flying Through Sunset Flight (Default)
const wallpaperModes = [
  { 
    id: 'video-sunset-flight', 
    type: 'video', 
    label: '🎬 Live Video: Flying Through Sunset Flight', 
    videoSrc: '/assets/flying-through-the-sunset-video-plane-hd-florida-s-hd-auto-.mp4' 
  },
  { 
    id: 'video-city-vibes', 
    type: 'video', 
    label: '🎬 Live Video: Cinematic City Vibes', 
    videoSrc: '/assets/city-vibes-cinematic-youtube-pics-hd-auto-.mp4' 
  },
  { 
    id: 'video-sky-travel', 
    type: 'video', 
    label: '🎬 Live Video: Airplane Window Sky Travel', 
    videoSrc: '/assets/sky-gif-beautiful-places-to-travel-airplane-view-a-hd-auto-.mp4' 
  },
  { 
    id: 'video-student-laptop', 
    type: 'video', 
    label: '🎬 Live Video: Student with Laptop Aesthetic', 
    videoSrc: '/assets/student-with-laptop-aesthetic-college-aesthetic-la-hd-auto-.mp4' 
  },
  { 
    id: 'video-night-study', 
    type: 'video', 
    label: '🎬 Live Video: Night Study Motivation', 
    videoSrc: '/assets/video-night-study-motivation-don-t-give-up-ch-m-ng-hd-auto-.mp4' 
  },
  { 
    id: 'video-stargazing', 
    type: 'video', 
    label: '🎬 Live Video: Stargazing Night Sky', 
    videoSrc: '/assets/stargazing-through-the-sunroof-hits-different-car--hd-auto-.mp4' 
  },
  { 
    id: 'video-trading-research', 
    type: 'video', 
    label: '🎬 Live Video: Technology & Research Aesthetic', 
    videoSrc: '/assets/research-video-trading-aesthetic-video-technology--hd-auto-.mp4' 
  },
  { 
    id: 'video-sky-chill', 
    type: 'video', 
    label: '🎬 Live Video: Sky & Landscape Chill', 
    videoSrc: '/assets/nh-b-u-tr-i-m-nhi-p-nh-phong-c-nh-c-nh-chill-video-hd-auto-.mp4' 
  },
  { 
    id: 'sunset-wing-exact', 
    type: 'photo', 
    label: '🖼️ Sunset Wing (Your Uploaded Exact Photo)', 
    imgSrc: '/assets/bg-sunset-wing.png', 
    nativeW: 391, 
    nativeH: 669 
  },
  { 
    id: '3d-sunset', 
    type: '3d', 
    label: '🌌 3D Dynamic Moving Sunset Flight (WebGL)', 
    imgSrc: null 
  },
  { 
    id: 'balcony-bridge', 
    type: 'photo', 
    label: '🌉 Balcony Bridge Night View Photo', 
    imgSrc: '/assets/bg-balcony-bridge.png', 
    nativeW: 357, 
    nativeH: 523 
  },
  { 
    id: 'sydney-highway', 
    type: 'photo', 
    label: '🛣️ City Highway Night View Photo', 
    imgSrc: '/assets/bg-sydney-highway.png', 
    nativeW: 847, 
    nativeH: 460 
  }
];

/* =========================================================================
   1. THREE.JS 3D DYNAMIC MOVING SUNSET FLIGHT ENGINE
========================================================================= */
let scene, camera, renderer;
let wingGroup, wingMesh, wingletMesh, navLightRed;
let cityParticles, warehouseMeshes, stadiumMesh, highwayHeadlights, highwayTaillights;
let cloudBillboards = [];
let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
let clock = new THREE.Clock();
let threeInitialized = false;

function initThreeScene() {
  if (threeInitialized) return;
  const canvas = document.getElementById('webglCanvas');
  if (!canvas) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060814, 0.00045);

  camera = new THREE.PerspectiveCamera(54, width / height, 1, 7500);
  camera.position.set(-58, 46, 120);
  camera.lookAt(115, -4, -165);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  // --- Atmospheric & Sunset Lighting ---
  const ambientLight = new THREE.AmbientLight(0x182236, 0.85);
  scene.add(ambientLight);

  // Fiery sunset directional light illuminating the top of the wing
  const sunsetLight = new THREE.DirectionalLight(0xff5511, 1.4);
  sunsetLight.position.set(-80, 70, -300);
  scene.add(sunsetLight);

  // Warm amber city up-glow reflecting from below
  const cityGlowLight = new THREE.DirectionalLight(0xff9933, 0.7);
  cityGlowLight.position.set(0, -220, -100);
  scene.add(cityGlowLight);

  // Soft moonlight from high sky
  const moonLight = new THREE.DirectionalLight(0x88bbff, 0.65);
  moonLight.position.set(100, 260, 90);
  scene.add(moonLight);

  // Build 3D World
  createStarfield();
  createSunsetHorizonBand();
  createSunsetAirplaneWing();
  createSprawlingNightCityGrid();
  createWarehouseAndStadiumLandmarks();
  createHighwayTrafficStreams();
  createVolumetricClouds();

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('resize', onWindowResize);

  threeInitialized = true;
  animate3D();
}

/* --- Starfield in Deep Sky Dome --- */
function createStarfield() {
  const starGeo = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.85 + 0.15);
    const radius = 3400 + Math.random() * 600;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) + 120;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const r = Math.random();
    if (r > 0.75) {
      colors[i * 3] = 0.85; colors[i * 3 + 1] = 0.92; colors[i * 3 + 2] = 1.0;
    } else if (r > 0.5) {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.88; colors[i * 3 + 2] = 0.72;
    } else {
      colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.95;
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starMat = new THREE.PointsMaterial({ size: 2.2, vertexColors: true, transparent: true, opacity: 0.85 });
  scene.add(new THREE.Points(starGeo, starMat));
}

/* --- Fiery Red-Orange Sunset / Twilight Horizon Band --- */
function createSunsetHorizonBand() {
  const glowGeo = new THREE.CylinderGeometry(3200, 3200, 480, 64, 1, true);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: {
      colorSunsetRed: { value: new THREE.Color(0xff2a00) },
      colorSunsetOrange: { value: new THREE.Color(0xff6b18) },
      colorSunsetYellow: { value: new THREE.Color(0xffa825) },
      colorSkyDark: { value: new THREE.Color(0x050815) }
    },
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 colorSunsetRed;
      uniform vec3 colorSunsetOrange;
      uniform vec3 colorSunsetYellow;
      uniform vec3 colorSkyDark;
      varying vec3 vPosition;
      void main() {
        float h = smoothstep(-200.0, 200.0, vPosition.y);
        vec3 col;
        if (h < 0.35) {
          col = mix(colorSunsetRed, colorSunsetOrange, h / 0.35);
        } else if (h < 0.65) {
          col = mix(colorSunsetOrange, colorSunsetYellow, (h - 0.35) / 0.30);
        } else {
          col = mix(colorSunsetYellow, colorSkyDark, (h - 0.65) / 0.35);
        }
        float alpha = (1.0 - abs(vPosition.y) / 240.0) * 0.62;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.70));
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const horizonMesh = new THREE.Mesh(glowGeo, glowMat);
  horizonMesh.position.set(0, -30, -700);
  scene.add(horizonMesh);
}

/* --- 3D Swept Airliner Wing with Sunset Specular Glow --- */
function createSunsetAirplaneWing() {
  wingGroup = new THREE.Group();

  // 1. Tapered Swept Airfoil Wing Body (Matched to Photo)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.bezierCurveTo(10, 4.0, 36, 4.5, 82, 0.8);
  wingShape.bezierCurveTo(94, -0.5, 98, -1.5, 102, -2.0);
  wingShape.bezierCurveTo(75, -2.3, 30, -2.0, 0, 0);

  const extrudeSettings = {
    steps: 28,
    depth: 290,
    bevelEnabled: true,
    bevelThickness: 1.2,
    bevelSize: 0.8,
    bevelSegments: 4
  };

  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  const pos = wingGeometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const progress = z / 290;
    const scale = 1.0 - progress * 0.66;
    let x = pos.getX(i) * scale;
    let y = pos.getY(i) * scale;
    x += progress * 155;
    y += Math.pow(progress, 1.8) * 32;
    pos.setXYZ(i, x, y, z);
  }
  wingGeometry.computeVertexNormals();

  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xdde6f4,
    roughness: 0.18,
    metalness: 0.82,
    emissive: 0x381206,
    emissiveIntensity: 0.48,
    envMapIntensity: 1.5
  });

  wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
  wingMesh.rotation.set(0.12, 2.1, -0.06);
  wingMesh.position.set(-22, 16, 40);
  wingGroup.add(wingMesh);

  // 2. Titanium Leading-Edge Slat Chrome Strip (Reflecting sunset fiery orange)
  const slatGeo = new THREE.CylinderGeometry(1.3, 0.4, 290, 14);
  const slatMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.95,
    emissive: 0x481605,
    emissiveIntensity: 0.55
  });
  const slatMesh = new THREE.Mesh(slatGeo, slatMat);
  slatMesh.rotation.set(Math.PI / 2, 0, 0.42);
  slatMesh.position.set(44, 24, -88);
  wingGroup.add(slatMesh);

  // 3. Flap Track Fairing Pods under wing
  for (let f = 0; f < 3; f++) {
    const podGeo = new THREE.ConeGeometry(2.5 - f * 0.4, 42 - f * 6, 12);
    const podMat = new THREE.MeshStandardMaterial({ color: 0xd0dbe8, roughness: 0.3, metalness: 0.55 });
    const podMesh = new THREE.Mesh(podGeo, podMat);
    podMesh.rotation.set(Math.PI / 2 + 0.1, 0, 0.4);
    const zOffset = 30 + f * 62;
    podMesh.position.set(27 + f * 28, 4 + f * 5, 40 - zOffset);
    wingGroup.add(podMesh);
  }

  // 4. Vertically Upturned Blended Sharklet / Winglet
  const sharkletGeo = new THREE.BoxGeometry(6, 38, 26);
  const sharkletMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.22,
    metalness: 0.65,
    emissive: 0x220c04,
    emissiveIntensity: 0.4
  });
  wingletMesh = new THREE.Mesh(sharkletGeo, sharkletMat);
  wingletMesh.position.set(152, 54, -195);
  wingletMesh.rotation.set(0.2, 0.5, 0.45);
  wingGroup.add(wingletMesh);

  // 5. Steady Soft Red Port Navigation Beacon (NO white blinking light)
  navLightRed = new THREE.PointLight(0xff2222, 3.2, 130);
  navLightRed.position.set(150, 52, -188);
  wingGroup.add(navLightRed);

  const navBulbGeo = new THREE.SphereGeometry(1.6, 12, 12);
  const navBulbMat = new THREE.MeshBasicMaterial({ color: 0xff2828 });
  const navBulb = new THREE.Mesh(navBulbGeo, navBulbMat);
  navBulb.position.copy(navLightRed.position);
  wingGroup.add(navBulb);

  // 6. Sunset Wing Floodlight
  const wingFlood = new THREE.SpotLight(0xff7733, 2.2, 340, Math.PI / 4, 0.4, 1.2);
  wingFlood.position.set(-45, 34, 85);
  wingFlood.target = wingMesh;
  wingGroup.add(wingFlood);

  scene.add(wingGroup);
}

/* --- 3D Sprawling Night City Grid (42,000+ Points) --- */
function createSprawlingNightCityGrid() {
  const cityCount = 45000;
  const cityGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(cityCount * 3);
  const colors = new Float32Array(cityCount * 3);
  const sizes = new Float32Array(cityCount);

  for (let i = 0; i < cityCount; i++) {
    const gridSpacing = 45;
    let x = (Math.random() - 0.5) * 4400;
    let z = (Math.random() - 0.5) * 4400;

    if (Math.random() < 0.65) {
      x = Math.round(x / gridSpacing) * gridSpacing + (Math.random() - 0.5) * 8;
      z = Math.round(z / gridSpacing) * gridSpacing + (Math.random() - 0.5) * 8;
    }

    const y = -395 + (Math.sin(x * 0.0035) + Math.cos(z * 0.0035)) * 25;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Rich palette matching photo:
    // 60% Warm Amber Sodium, 25% Golden Streetlights, 12% Cool White Warehouse/Commercial, 3% Cyan
    const r = Math.random();
    if (r < 0.60) {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.56 + Math.random() * 0.16; colors[i * 3 + 2] = 0.08;
      sizes[i] = 3.2 + Math.random() * 2.2;
    } else if (r < 0.85) {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.82; colors[i * 3 + 2] = 0.35;
      sizes[i] = 3.5 + Math.random() * 2.5;
    } else if (r < 0.97) {
      colors[i * 3] = 0.90; colors[i * 3 + 1] = 0.96; colors[i * 3 + 2] = 1.0;
      sizes[i] = 4.2 + Math.random() * 2.8;
    } else {
      colors[i * 3] = 0.1; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0;
      sizes[i] = 3.8 + Math.random() * 2.2;
    }
  }

  cityGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  cityGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  cityGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const cityMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (340.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float strength = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, strength * 0.98);
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

/* --- Illuminated Warehouses & Green Sports Field Stadium --- */
function createWarehouseAndStadiumLandmarks() {
  warehouseMeshes = new THREE.Group();

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const warehouseMat = new THREE.MeshStandardMaterial({
    color: 0x162438,
    emissive: 0xd0e8ff,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.8
  });

  for (let i = 0; i < 65; i++) {
    const w = 40 + Math.random() * 60;
    const h = 10 + Math.random() * 15;
    const d = 30 + Math.random() * 45;
    const x = (Math.random() - 0.5) * 3200;
    const z = (Math.random() - 0.5) * 3400;

    const mesh = new THREE.Mesh(boxGeo, warehouseMat);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, -390 + h / 2, z);
    warehouseMeshes.add(mesh);
  }

  // Sports Field / Stadium (Right side of photo)
  const stadiumGeo = new THREE.PlaneGeometry(80, 50);
  const stadiumMat = new THREE.MeshBasicMaterial({ color: 0x84cc16, side: THREE.DoubleSide });
  stadiumMesh = new THREE.Mesh(stadiumGeo, stadiumMat);
  stadiumMesh.rotation.x = -Math.PI / 2;
  stadiumMesh.position.set(450, -388, -250);
  warehouseMeshes.add(stadiumMesh);

  const stadiumLight = new THREE.PointLight(0xa3e635, 4.2, 190);
  stadiumLight.position.set(450, -370, -250);
  warehouseMeshes.add(stadiumLight);

  scene.add(warehouseMeshes);
}

/* --- Flowing 3D Highway Traffic Streams --- */
function createHighwayTrafficStreams() {
  const headCount = 6500;
  const tailCount = 6500;

  const headGeo = new THREE.BufferGeometry();
  const headPos = new Float32Array(headCount * 3);
  const headColors = new Float32Array(headCount * 3);

  const tailGeo = new THREE.BufferGeometry();
  const tailPos = new Float32Array(tailCount * 3);
  const tailColors = new Float32Array(tailCount * 3);

  for (let i = 0; i < headCount; i++) {
    const highwayId = i % 10;
    const t = (i / headCount) * Math.PI * 8;
    const curveX = (highwayId - 4.5) * 420 + Math.sin(t * 0.35) * 240;
    const curveZ = ((i / headCount) - 0.5) * 4200;
    const y = -388;

    headPos[i * 3] = curveX - 5;
    headPos[i * 3 + 1] = y;
    headPos[i * 3 + 2] = curveZ;

    headColors[i * 3] = 1.0;
    headColors[i * 3 + 1] = 0.95;
    headColors[i * 3 + 2] = 0.72;

    tailPos[i * 3] = curveX + 5;
    tailPos[i * 3 + 1] = y;
    tailPos[i * 3 + 2] = curveZ;

    tailColors[i * 3] = 1.0;
    tailColors[i * 3 + 1] = 0.12;
    tailColors[i * 3 + 2] = 0.08;
  }

  headGeo.setAttribute('position', new THREE.BufferAttribute(headPos, 3));
  headGeo.setAttribute('color', new THREE.BufferAttribute(headColors, 3));
  highwayHeadlights = new THREE.Points(headGeo, new THREE.PointsMaterial({ size: 4.8, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }));
  scene.add(highwayHeadlights);

  tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos, 3));
  tailGeo.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
  highwayTaillights = new THREE.Points(tailGeo, new THREE.PointsMaterial({ size: 4.2, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
  scene.add(highwayTaillights);
}

/* --- Volumetric Drifting Clouds Beneath Wing --- */
function createVolumetricClouds() {
  const cloudCount = 38;
  const cloudGeo = new THREE.SphereGeometry(80, 16, 12);
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0x221c2e,
    transparent: true,
    opacity: 0.24,
    fog: true
  });

  for (let i = 0; i < cloudCount; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.scale.set(2.0 + Math.random() * 1.5, 0.4 + Math.random() * 0.3, 1.3 + Math.random() * 1.0);
    cloud.position.set(
      (Math.random() - 0.5) * 2600,
      -140 + Math.random() * 90,
      (Math.random() - 0.5) * 2800
    );
    scene.add(cloud);
    cloudBillboards.push(cloud);
  }
}

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
  if (currentWallpaperMode !== 0 || !renderer) return;

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // 1. Mouse Parallax Smoothing
  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;

  camera.rotation.y = -0.65 + mouseX * 0.12;
  camera.rotation.x = -0.08 - mouseY * 0.08;
  camera.position.x = -58 + mouseX * 14;
  camera.position.y = 46 - mouseY * 9;

  // 2. Realistic Cruising Aerodynamics (NO BLINKING)
  if (wingGroup) {
    wingGroup.rotation.z = Math.sin(time * 0.8) * 0.012;
    wingGroup.rotation.x = Math.cos(time * 0.6) * 0.008;
    wingGroup.position.y = Math.sin(time * 1.2) * 1.2;

    if (wingletMesh) {
      wingletMesh.position.y = 54 + Math.sin(time * 2.4) * 0.8;
    }
  }

  // 3. Ground City & Highway Motion (880 km/h Flight Speed)
  const flightSpeed = 175 * delta;

  if (cityParticles) {
    const pos = cityParticles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let z = pos.getZ(i) + flightSpeed;
      if (z > 1800) z = -2400;
      pos.setZ(i, z);
    }
    cityParticles.geometry.attributes.position.needsUpdate = true;
  }

  if (highwayHeadlights && highwayTaillights) {
    const hPos = highwayHeadlights.geometry.attributes.position;
    const tPos = highwayTaillights.geometry.attributes.position;
    for (let i = 0; i < hPos.count; i++) {
      let hz = hPos.getZ(i) + flightSpeed * 1.25;
      if (hz > 1800) hz = -2400;
      hPos.setZ(i, hz);

      let tz = tPos.getZ(i) + flightSpeed * 0.85;
      if (tz > 1800) tz = -2400;
      tPos.setZ(i, tz);
    }
    highwayHeadlights.geometry.attributes.position.needsUpdate = true;
    highwayTaillights.geometry.attributes.position.needsUpdate = true;
  }

  if (warehouseMeshes) {
    for (let i = 0; i < warehouseMeshes.children.length; i++) {
      const b = warehouseMeshes.children[i];
      b.position.z += flightSpeed;
      if (b.position.z > 1800) {
        b.position.z = -2400;
      }
    }
  }

  for (let i = 0; i < cloudBillboards.length; i++) {
    const c = cloudBillboards[i];
    c.position.z += flightSpeed * 0.9;
    if (c.position.z > 1600) {
      c.position.z = -2000;
      c.position.x = (Math.random() - 0.5) * 2600;
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

  const cabinFilter = audioCtx.createBiquadFilter();
  cabinFilter.type = 'lowpass';
  cabinFilter.frequency.setValueAtTime(320, audioCtx.currentTime);

  const subOsc1 = audioCtx.createOscillator();
  subOsc1.type = 'sine';
  subOsc1.frequency.setValueAtTime(54, audioCtx.currentTime);

  const subOsc2 = audioCtx.createOscillator();
  subOsc2.type = 'sine';
  subOsc2.frequency.setValueAtTime(108, audioCtx.currentTime);

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

function playSeatbeltChime() {
  initAudioContext();
  const now = audioCtx.currentTime;

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

  const isLiveFR24 = activeFlight.source === 'flightradar24';

  const airlineEl = document.getElementById('airlineTag');
  if (airlineEl) airlineEl.innerText = (activeFlight.airline || 'AIRLINE').toUpperCase();

  const flightNoEl = document.getElementById('flightNoDisplay');
  if (flightNoEl) flightNoEl.innerText = activeFlight.flightNumber || 'FLIGHT';

  const aircraftEl = document.getElementById('aircraftTypeDisplay');
  if (aircraftEl) aircraftEl.innerText = activeFlight.aircraft || 'Commercial Jetliner';

  const sourceBadgeEl = document.getElementById('flightSourceBadge');
  if (sourceBadgeEl) {
    if (isLiveFR24) {
      sourceBadgeEl.innerHTML = '⚡ Flightradar24 Live';
      sourceBadgeEl.style.display = 'inline-flex';
      sourceBadgeEl.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      sourceBadgeEl.style.color = '#38bdf8';
    } else {
      sourceBadgeEl.innerHTML = 'Curated Flight';
      sourceBadgeEl.style.display = 'inline-flex';
      sourceBadgeEl.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      sourceBadgeEl.style.color = '#94a3b8';
    }
  }

  const orig = activeFlight.origin || {};
  const dest = activeFlight.destination || {};
  const origCodeEl = document.getElementById('originCode');
  if (origCodeEl) origCodeEl.innerText = orig.code || 'DEP';
  const origCityEl = document.getElementById('originCity');
  if (origCityEl) origCityEl.innerText = orig.city ? `${orig.city}` : (orig.name || 'Origin');
  const depTimeEl = document.getElementById('depTime');
  if (depTimeEl) depTimeEl.innerText = `STD: ${activeFlight.departureTimeUTC || activeFlight.departureTimeUtc || '04:30'} UTC`;

  const destCodeEl = document.getElementById('destCode');
  if (destCodeEl) destCodeEl.innerText = dest.code || 'ARR';
  const destCityEl = document.getElementById('destCity');
  if (destCityEl) destCityEl.innerText = dest.city ? `${dest.city}` : (dest.name || 'Destination');
  const arrTimeEl = document.getElementById('arrTime');
  if (arrTimeEl) arrTimeEl.innerText = `STA: ${activeFlight.arrivalTimeUTC || activeFlight.arrivalTimeUtc || '06:45'} UTC`;

  updateTelemetryAndProgress();
}

function updateTelemetryAndProgress() {
  const total = Math.max(1, sessionTotalSeconds);
  const progress = Math.min(1.0, sessionElapsedSeconds / total);
  const percent = Math.round(progress * 100);

  // Position airplane marker and progress line according to study flight progress
  const progressBar = document.getElementById('routeProgressBar');
  const planeMarker = document.getElementById('planeMarker');
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (planeMarker) planeMarker.style.left = `${percent}%`;

  // Realistic Flight Phase Simulation matching user study progress
  let phase = 'READY FOR TAKEOFF';
  let altitude = 0;
  let speed = 0;

  const cruiseAlt = activeFlight?.cruiseAltitudeFt || 36000;
  const cruiseSpd = activeFlight?.speedKts || Math.round((activeFlight?.speedKmh || activeFlight?.cruiseSpeedKmh || 820) * 0.54) || 460;

  if (percent === 0) {
    phase = sessionElapsedSeconds === 0 ? 'BOARDING & TAXI' : 'READY FOR TAKEOFF';
    altitude = 0;
    speed = 15;
  } else if (percent < 15) {
    phase = 'CLIMBING · INITIAL ASCENT';
    altitude = Math.round((percent / 15) * Math.min(24000, cruiseAlt));
    speed = Math.round(180 + (percent / 15) * (cruiseSpd - 180));
  } else if (percent < 85) {
    phase = `CRUISING · FL${Math.round(cruiseAlt / 100)}`;
    altitude = cruiseAlt;
    speed = cruiseSpd + Math.round(Math.sin(Date.now() * 0.001) * 4);
  } else if (percent < 99) {
    phase = 'DESCENT · FINAL APPROACH';
    const descRatio = (percent - 85) / 14;
    altitude = Math.round(cruiseAlt * (1.0 - descRatio));
    speed = Math.round(cruiseSpd - descRatio * (cruiseSpd - 140));
  } else {
    phase = 'TOUCHDOWN · TAXI';
    altitude = 0;
    speed = 20;
  }

  const flightPhaseEl = document.getElementById('flightPhaseText');
  if (flightPhaseEl) flightPhaseEl.innerText = phase.toUpperCase();

  const teleAltEl = document.getElementById('teleAltitude');
  if (teleAltEl) teleAltEl.innerHTML = `${(altitude || 0).toLocaleString()} <span>FT</span>`;

  const teleSpeedEl = document.getElementById('teleSpeed');
  if (teleSpeedEl) teleSpeedEl.innerHTML = `${speed || 0} <span>KTS</span>`;

  // Flight Route Distance & ETE (Counts down as user studies)
  const totalKm = activeFlight?.distanceKm || 1200;
  const totalNM = Math.round(totalKm * 0.539957);
  const flightRemNM = Math.max(0, Math.round(totalNM * (1.0 - progress)));

  const teleDistEl = document.getElementById('teleDistance');
  if (teleDistEl) teleDistEl.innerHTML = `${flightRemNM.toLocaleString()} <span>NM</span>`;

  const flightRemainingSecs = Math.max(0, sessionTotalSeconds - sessionElapsedSeconds);
  const teleETAEl = document.getElementById('teleETA');
  if (teleETAEl) teleETAEl.innerText = formatHMS(flightRemainingSecs);

  // Live Position & Heading (moves from Origin to Destination along route)
  const teleCoordsEl = document.getElementById('teleCoords');
  if (teleCoordsEl) {
    const origLat = activeFlight?.origin?.lat || 28.5562;
    const origLon = activeFlight?.origin?.lon || 77.1000;
    const destLat = activeFlight?.destination?.lat || 30.6735;
    const destLon = activeFlight?.destination?.lon || 76.7885;
    const curLat = origLat + (destLat - origLat) * progress;
    const curLon = origLon + (destLon - origLon) * progress;
    const hdg = activeFlight?.heading || activeFlight?.track || 285;
    teleCoordsEl.innerText = `${Math.abs(curLat).toFixed(2)}°${curLat >= 0 ? 'N' : 'S'}, ${Math.abs(curLon).toFixed(2)}°${curLon >= 0 ? 'E' : 'W'} · ${hdg}°`;
  }

  // Study Session Timer Clock (at the bottom dock)
  const clockEl = document.getElementById('studyClockDisplay');
  if (clockEl) {
    clockEl.innerText = formatHMS(flightRemainingSecs);
  }

  const sessionSubEl = document.getElementById('sessionStatusSub');
  if (sessionSubEl) {
    if (isTimerRunning) {
      sessionSubEl.innerText = `Study In-Flight · ${percent}% Completed (${formatHMS(sessionElapsedSeconds)} elapsed) · Target: ${formatHMS(sessionTotalSeconds)}`;
    } else if (sessionElapsedSeconds === 0) {
      sessionSubEl.innerText = `Session Ready · Target Study Time: ${formatHMS(sessionTotalSeconds)} · Press Start to begin`;
    } else {
      sessionSubEl.innerText = `Session Paused · ${percent}% Completed (${formatHMS(sessionElapsedSeconds)} / ${formatHMS(sessionTotalSeconds)})`;
    }
  }
}

function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

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
  document.getElementById('mainTimerBtn')?.classList.add('running');
  const btnText = document.getElementById('mainTimerBtnText');
  if (btnText) btnText.innerText = 'Pause Session';
  const playIcon = document.getElementById('timerPlayIcon');
  if (playIcon) playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  document.getElementById('mainTimerBtn')?.classList.remove('running');
  const btnText = document.getElementById('mainTimerBtnText');
  if (btnText) btnText.innerText = sessionElapsedSeconds > 0 ? 'Resume Flight' : 'Start Study Session';
  const playIcon = document.getElementById('timerPlayIcon');
  if (playIcon) playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
}

function resetTimer() {
  pauseTimer();
  sessionElapsedSeconds = 0;
  if (timerMode === 'pomodoro') {
    sessionTotalSeconds = 25 * 60;
  } else if (timerMode === 'flight') {
    sessionTotalSeconds = (activeFlight?.durationMinutes || 135) * 60;
  }
  updateTelemetryAndProgress();
  const btnText = document.getElementById('mainTimerBtnText');
  if (btnText) btnText.innerText = 'Start Study Session';
}

function completeSession() {
  pauseTimer();
  playSeatbeltChime();
  const celModal = document.getElementById('celebrationModal');
  const celDur = document.getElementById('celDuration');
  const celDist = document.getElementById('celDistance');
  if (celDur) celDur.innerText = formatHMS(sessionTotalSeconds);
  if (celDist) celDist.innerText = `${Math.round((activeFlight?.distanceKm || 2000) * 0.539957).toLocaleString()} NM`;
  if (celModal) celModal.classList.add('open');
}

function closeCelebrationModal() {
  document.getElementById('celebrationModal')?.classList.remove('open');
  resetTimer();
}

function setTimerMode(mode) {
  timerMode = mode;
  document.getElementById('tabModePomodoro')?.classList.toggle('active', mode === 'pomodoro');
  document.getElementById('tabModeFlight')?.classList.toggle('active', mode === 'flight');
  document.getElementById('tabModeCustom')?.classList.toggle('active', mode === 'custom');

  if (mode === 'pomodoro') {
    sessionTotalSeconds = 25 * 60;
    sessionElapsedSeconds = 0;
    resetTimer();
  } else if (mode === 'flight') {
    sessionTotalSeconds = (activeFlight?.durationMinutes || 135) * 60;
    sessionElapsedSeconds = 0;
    resetTimer();
  } else if (mode === 'custom') {
    openFlightSearchModal('duration');
    return;
  }
}

/* =========================================================================
   4. BACKEND API CLIENT & FLIGHTRADAR24 LIVE INTEGRATION
========================================================================= */

const fallbackFlightDatabase = [
  {
    flightNumber: "AI-865",
    callsign: "AIC865",
    airline: "Air India",
    aircraft: "Boeing 787-8 Dreamliner",
    origin: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    destination: { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Intl", country: "India", lat: 19.0896, lon: 72.8656 },
    distanceKm: 1137,
    avgSpeedKmh: 830,
    durationMinutes: 135,
    category: "Standard Study (2h 15m)"
  },
  {
    flightNumber: "6E-204",
    callsign: "IGO204",
    airline: "IndiGo",
    aircraft: "Airbus A320neo",
    origin: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    destination: { code: "JAI", city: "Jaipur", name: "Jaipur Intl Airport", country: "India", lat: 26.8242, lon: 75.8122 },
    distanceKm: 240,
    avgSpeedKmh: 520,
    durationMinutes: 45,
    category: "Short Sprint (45m)"
  },
  {
    flightNumber: "AI-672",
    callsign: "AIC672",
    airline: "Air India",
    aircraft: "Airbus A319",
    origin: { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Intl", country: "India", lat: 19.0896, lon: 72.8656 },
    destination: { code: "PNQ", city: "Pune", name: "Pune Airport", country: "India", lat: 18.5822, lon: 73.9197 },
    distanceKm: 125,
    avgSpeedKmh: 460,
    durationMinutes: 35,
    category: "Short Sprint (35m)"
  },
  {
    flightNumber: "6E-554",
    callsign: "IGO554",
    airline: "IndiGo",
    aircraft: "Airbus A320",
    origin: { code: "BLR", city: "Bengaluru", name: "Kempegowda Intl", country: "India", lat: 13.1986, lon: 77.7066 },
    destination: { code: "MAA", city: "Chennai", name: "Chennai Intl", country: "India", lat: 12.9941, lon: 80.1709 },
    distanceKm: 270,
    avgSpeedKmh: 540,
    durationMinutes: 50,
    category: "Short Sprint (50m)"
  },
  {
    flightNumber: "QP-1311",
    callsign: "AKJ1311",
    airline: "Akasa Air",
    aircraft: "Boeing 737 MAX 8",
    origin: { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Intl", country: "India", lat: 19.0896, lon: 72.8656 },
    destination: { code: "GOI", city: "Goa", name: "Dabolim Airport", country: "India", lat: 15.3808, lon: 73.8313 },
    distanceKm: 435,
    avgSpeedKmh: 680,
    durationMinutes: 65,
    category: "1 Hour Focus"
  },
  {
    flightNumber: "6E-2341",
    callsign: "IGO2341",
    airline: "IndiGo",
    aircraft: "Airbus A321neo",
    origin: { code: "BLR", city: "Bengaluru", name: "Kempegowda Intl", country: "India", lat: 13.1986, lon: 77.7066 },
    destination: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    distanceKm: 1740,
    avgSpeedKmh: 800,
    durationMinutes: 160,
    category: "Deep Focus (2h 40m)"
  },
  {
    flightNumber: "UK-817",
    callsign: "VTI817",
    airline: "Vistara",
    aircraft: "Airbus A320neo",
    origin: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    destination: { code: "BLR", city: "Bengaluru", name: "Kempegowda Intl", country: "India", lat: 13.1986, lon: 77.7066 },
    distanceKm: 1740,
    avgSpeedKmh: 810,
    durationMinutes: 165,
    category: "Deep Focus (2h 45m)"
  },
  {
    flightNumber: "AI-773",
    callsign: "AIC773",
    airline: "Air India",
    aircraft: "Airbus A320",
    origin: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    destination: { code: "CCU", city: "Kolkata", name: "Netaji Subhash Chandra Bose Intl", country: "India", lat: 22.6547, lon: 88.4467 },
    distanceKm: 1305,
    avgSpeedKmh: 780,
    durationMinutes: 130,
    category: "Standard Study (2h 10m)"
  },
  {
    flightNumber: "6E-344",
    callsign: "IGO344",
    airline: "IndiGo",
    aircraft: "Airbus A320neo",
    origin: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    destination: { code: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh Intl", country: "India", lat: 26.7606, lon: 80.8893 },
    distanceKm: 420,
    avgSpeedKmh: 620,
    durationMinutes: 60,
    category: "1 Hour Focus"
  },
  {
    flightNumber: "AI-409",
    callsign: "AIC409",
    airline: "Air India",
    aircraft: "Airbus A320",
    origin: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    destination: { code: "PAT", city: "Patna", name: "Jay Prakash Narayan Airport", "country": "India", lat: 25.5913, lon: 85.0880 },
    distanceKm: 850,
    avgSpeedKmh: 740,
    durationMinutes: 95,
    category: "1.5 Hour Session"
  },
  {
    flightNumber: "6E-5012",
    callsign: "IGO5012",
    airline: "IndiGo",
    aircraft: "Airbus A320",
    origin: { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Intl", country: "India", lat: 19.0896, lon: 72.8656 },
    destination: { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi Intl", country: "India", lat: 17.2403, lon: 78.4294 },
    distanceKm: 620,
    avgSpeedKmh: 710,
    durationMinutes: 80,
    category: "1.5 Hour Session"
  },
  {
    flightNumber: "EK-511",
    callsign: "UAE511",
    airline: "Emirates",
    aircraft: "Boeing 777-300ER",
    origin: { code: "DXB", city: "Dubai", name: "Dubai Intl Airport", country: "UAE", lat: 25.2532, lon: 55.3657 },
    destination: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    distanceKm: 2185,
    avgSpeedKmh: 820,
    durationMinutes: 215,
    category: "Deep Focus (3.5h)"
  },
  {
    flightNumber: "FZ-445",
    callsign: "FDB445",
    airline: "FlyDubai",
    aircraft: "Boeing 737-800",
    origin: { code: "DXB", city: "Dubai", name: "Dubai Intl Airport", country: "UAE", lat: 25.2532, lon: 55.3657 },
    destination: { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Intl", country: "India", lat: 19.0896, lon: 72.8656 },
    distanceKm: 1930,
    avgSpeedKmh: 810,
    durationMinutes: 200,
    category: "Deep Focus (3h 20m)"
  },
  {
    flightNumber: "SQ-402",
    callsign: "SIA402",
    airline: "Singapore Airlines",
    aircraft: "Airbus A350-900",
    origin: { code: "SIN", city: "Singapore", name: "Singapore Changi Airport", country: "Singapore", lat: 1.3644, lon: 103.9915 },
    destination: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    distanceKm: 4150,
    avgSpeedKmh: 840,
    durationMinutes: 330,
    category: "Long Haul (5.5h)"
  },
  {
    flightNumber: "TG-316",
    callsign: "THA316",
    airline: "Thai Airways",
    aircraft: "Boeing 777-200",
    origin: { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl", country: "India", lat: 28.5562, lon: 77.1000 },
    destination: { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Thailand", lat: 13.6900, lon: 100.7501 },
    distanceKm: 2930,
    avgSpeedKmh: 830,
    durationMinutes: 255,
    category: "Long Haul (4h 15m)"
  },
  {
    flightNumber: "BA-178",
    callsign: "BAW178",
    airline: "British Airways",
    aircraft: "Boeing 777-200ER",
    origin: { code: "JFK", city: "New York", name: "John F. Kennedy Intl", country: "USA", lat: 40.6413, lon: -73.7781 },
    destination: { code: "LHR", city: "London", name: "London Heathrow Airport", country: "UK", lat: 51.4700, lon: -0.4543 },
    distanceKm: 5540,
    avgSpeedKmh: 870,
    durationMinutes: 420,
    category: "Deep Immersion (7h)"
  }
];

let liveTelemetryPollInterval = null;
let currentActiveTab = 'radar';

function populateAirportDropdowns(airports) {
  const origSelect = document.getElementById('selectOrigin');
  const destSelect = document.getElementById('selectDestination');
  let html = '<option value="">-- All Airports --</option>';
  airports.forEach(a => {
    html += `<option value="${a.code}">${a.code} · ${a.city || a.name} (${a.country})</option>`;
  });
  if (origSelect) origSelect.innerHTML = html;
  if (destSelect) destSelect.innerHTML = html;
}

async function loadAirports() {
  try {
    const res = await fetch('/api/flights/airports');
    if (res.ok) {
      const data = await res.json();
      if (data && data.airports && data.airports.length > 0) {
        populateAirportDropdowns(data.airports);
        return;
      }
    }
  } catch (err) {
    console.warn('Backend airports fetch fallback:', err);
  }

  // Fallback to airports from catalog
  const airportMap = new Map();
  fallbackFlightDatabase.forEach(f => {
    if (f.origin && f.origin.code) airportMap.set(f.origin.code, f.origin);
    if (f.destination && f.destination.code) airportMap.set(f.destination.code, f.destination);
  });
  populateAirportDropdowns(Array.from(airportMap.values()));
}

async function fetchAndRenderRadarFlights(customParams = {}) {
  const grid = document.getElementById('flightResultsGrid');
  if (grid) grid.innerHTML = '<div style="color: #38bdf8; font-size: 13px; grid-column: 1/-1; padding: 25px; text-align: center;"><span class="pulse-dot" style="display:inline-block; margin-right:8px;"></span>Receiving live Flightradar24 ADS-B transponder telemetry...</div>';

  try {
    const query = new URLSearchParams();
    query.append('lat', customParams.lat || '28.65');
    query.append('lon', customParams.lon || '77.23');
    query.append('zoom', customParams.zoom || '6');
    if (customParams.search) query.append('search', customParams.search);

    const res = await fetch(`/api/flights/radar?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allFlights = data.flights || [];

    // Update Live Radar Header & Badge
    const badgeText = document.getElementById('fr24BadgeText');
    if (badgeText) badgeText.innerText = `FR24 LIVE: ${allFlights.length} FLIGHTS`;
    const bannerSub = document.getElementById('radarBannerSub');
    if (bannerSub) bannerSub.innerText = `Sector: 28.65°N, 77.23°E · ${allFlights.length} Active Airborne Aircraft (ADS-B)`;

    renderFlightCards(allFlights);
  } catch (err) {
    console.warn('Flightradar24 live fetch fallback:', err);
    // Fallback gracefully to catalog flights
    let filtered = [...fallbackFlightDatabase];
    if (customParams.search) {
      const q = customParams.search.toLowerCase();
      filtered = filtered.filter(f => f.flightNumber?.toLowerCase().includes(q) || f.airline?.toLowerCase().includes(q) || f.origin?.city?.toLowerCase().includes(q) || f.destination?.city?.toLowerCase().includes(q));
    }
    allFlights = filtered;
    renderFlightCards(allFlights);
  }
}

async function fetchAndRenderFlights(filterParams = {}) {
  const grid = document.getElementById('flightResultsGrid');
  if (grid) grid.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1; padding: 20px; text-align: center;"><span class="pulse-dot" style="display:inline-block; margin-right:8px;"></span>Searching flight database...</div>';

  try {
    const query = new URLSearchParams();
    if (filterParams.durationMinutes) query.append('durationMinutes', filterParams.durationMinutes);
    if (filterParams.tolerance) query.append('tolerance', filterParams.tolerance);
    if (filterParams.from) query.append('from', filterParams.from);
    if (filterParams.to) query.append('to', filterParams.to);
    if (filterParams.search) query.append('search', filterParams.search);
    if (filterParams.source) query.append('source', filterParams.source);

    const res = await fetch(`/api/flights?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allFlights = data.flights || [];

    renderFlightCards(allFlights);
  } catch (err) {
    console.warn('Database query fallback to local catalog:', err);
    let filtered = [...fallbackFlightDatabase];

    if (filterParams.durationMinutes) {
      const target = parseFloat(filterParams.durationMinutes);
      const tol = parseFloat(filterParams.tolerance) || 45;
      filtered = filtered.map(f => {
        const diff = Math.abs((f.durationMinutes || 60) - target);
        const matchScore = Math.max(0, Math.round(100 - (diff / Math.max(target, 30)) * 100));
        return { ...f, matchScore, diffMinutes: diff };
      }).filter(f => f.diffMinutes <= tol * 2).sort((a, b) => a.diffMinutes - b.diffMinutes);
    }

    if (filterParams.from) {
      filtered = filtered.filter(f => f.origin?.code?.toLowerCase() === filterParams.from.toLowerCase());
    }
    if (filterParams.to) {
      filtered = filtered.filter(f => f.destination?.code?.toLowerCase() === filterParams.to.toLowerCase());
    }
    if (filterParams.search) {
      const q = filterParams.search.toLowerCase();
      filtered = filtered.filter(f => f.flightNumber?.toLowerCase().includes(q) || f.airline?.toLowerCase().includes(q) || f.origin?.city?.toLowerCase().includes(q) || f.destination?.city?.toLowerCase().includes(q));
    }

    allFlights = filtered;
    renderFlightCards(allFlights);
  }
}

function renderFlightCards(flights) {
  const grid = document.getElementById('flightResultsGrid');
  if (!grid) return;

  if (!flights || flights.length === 0) {
    grid.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1; padding: 30px; text-align: center;">No flights found matching criteria. Try adjusting filters or searching a different flight number.</div>';
    return;
  }

  let html = '';
  flights.forEach(f => {
    const isSelected = activeFlight && (activeFlight.flightNumber === f.flightNumber || activeFlight.callsign === f.callsign);
    const isFR24 = f.source === 'flightradar24';

    const durHours = Math.floor((f.durationMinutes || 60) / 60);
    const durMins = (f.durationMinutes || 60) % 60;
    const durFormatted = durHours > 0 ? `${durHours}h ${durMins}m` : `${durMins}m`;

    let badgeHtml = '';
    if (isFR24) {
      const fl = Math.round((f.altitudeFt || 36000) / 100);
      badgeHtml = `<span class="fcard-badge" style="background: rgba(14,165,233,0.18); color: #38bdf8; border-color: rgba(56,189,248,0.4);"><span class="pulse-dot" style="width:5px; height:5px; display:inline-block; margin-right:4px;"></span>FL${fl} · ${f.speedKts || 450} KTS</span>`;
    } else if (f.matchScore !== undefined) {
      badgeHtml = `<span class="fcard-badge">${f.matchScore}% Study Match</span>`;
    } else {
      badgeHtml = `<span class="fcard-badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; border-color: rgba(56,189,248,0.3);">${durFormatted}</span>`;
    }

    const origCode = f.origin?.code || 'DEP';
    const origCity = f.origin?.city || f.origin?.name || 'Origin';
    const destCode = f.destination?.code || 'ARR';
    const destCity = f.destination?.city || f.destination?.name || 'Destination';

    const trackInfo = f.track != null ? ` · HDG ${f.track}°` : '';
    const distNM = f.distanceKm ? Math.round(f.distanceKm * 0.54) : 800;
    const safeFlightNo = encodeURIComponent(f.flightNumber || f.callsign || '');

    html += `
      <div class="flight-card-item ${isSelected ? 'selected' : ''} ${isFR24 ? 'fcard-fr24' : ''}" onclick="selectFlight('${safeFlightNo}')">
        <div class="fcard-top">
          <span class="fcard-airline">${f.airline} · <strong style="color: #fff;">${f.flightNumber}</strong> ${f.callsign && f.callsign !== f.flightNumber ? `<span style="font-size:11px; opacity:0.7;">(${f.callsign})</span>` : ''}</span>
          ${badgeHtml}
        </div>
        <div class="fcard-route-row">
          <div class="fcard-airport">
            <span class="fcard-code">${origCode}</span>
            <span class="fcard-city">${origCity}</span>
          </div>
          <div class="fcard-duration-pill">
            <span>✈️ ${durFormatted}</span>
          </div>
          <div class="fcard-airport dest">
            <span class="fcard-code">${destCode}</span>
            <span class="fcard-city">${destCity}</span>
          </div>
        </div>
        <div class="fcard-footer">
          <span>${f.aircraft || 'Commercial Jet'} ${f.registration ? `· ${f.registration}` : ''}</span>
          <span>${distNM} NM · FL${Math.round((f.altitudeFt || 36000) / 100)}${trackInfo}</span>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

async function selectFlight(flightIdentifier) {
  const decodedId = decodeURIComponent(flightIdentifier || '');
  let flight = allFlights.find(f => f.flightNumber === decodedId || f.callsign === decodedId || f.id === decodedId);
  
  if (!flight) {
    try {
      const res = await fetch(`/api/flights/${encodeURIComponent(decodedId)}/live`);
      if (res.ok) {
        flight = await res.json();
      }
    } catch (e) {
      // Ignore
    }
  }

  if (!flight) return;

  activeFlight = flight;

  // Set session duration and cleanly reset study elapsed time to 0
  if (timerMode === 'flight') {
    sessionTotalSeconds = (flight.durationMinutes || 60) * 60;
  } else if (timerMode === 'pomodoro') {
    sessionTotalSeconds = 25 * 60;
  }
  sessionElapsedSeconds = 0;
  pauseTimer();

  updateFlightDisplay();
  closeFlightSearchModal();
  playSeatbeltChime();

  // Start live polling if flight is from live Flightradar24
  startLiveTelemetryPolling();
}

function startLiveTelemetryPolling() {
  if (liveTelemetryPollInterval) {
    clearInterval(liveTelemetryPollInterval);
    liveTelemetryPollInterval = null;
  }

  if (!activeFlight) return;

  liveTelemetryPollInterval = setInterval(async () => {
    if (!activeFlight || !activeFlight.flightNumber) return;
    try {
      const res = await fetch(`/api/flights/${encodeURIComponent(activeFlight.flightNumber)}/live`);
      if (res.ok) {
        const liveData = await res.json();
        if (liveData) {
          activeFlight = {
            ...activeFlight,
            registration: liveData.registration || activeFlight.registration,
            aircraft: liveData.aircraft || activeFlight.aircraft,
            airline: liveData.airline || activeFlight.airline,
            track: liveData.track || activeFlight.track,
            heading: liveData.heading || activeFlight.heading,
            distanceKm: liveData.distanceKm || activeFlight.distanceKm
          };
          updateFlightDisplay();
        }
      }
    } catch (err) {
      // Quiet failover
    }
  }, 8000);
}

/* =========================================================================
   5. MODAL & HUD CONTROLS
========================================================================= */

function openFlightSearchModal(initialTab = null) {
  const modal = document.getElementById('flightModal');
  if (modal) modal.classList.add('open');
  if (initialTab) {
    switchModalTab(initialTab);
  } else {
    switchModalTab(currentActiveTab || 'radar');
  }
}

function closeFlightSearchModal() {
  const modal = document.getElementById('flightModal');
  if (modal) modal.classList.remove('open');
}

function switchModalTab(tab) {
  currentActiveTab = tab;

  const tabRadar = document.getElementById('modalTabRadar');
  const tabDuration = document.getElementById('modalTabDuration');
  const tabFromTo = document.getElementById('modalTabFromTo');
  const tabAll = document.getElementById('modalTabAll');

  if (tabRadar) tabRadar.classList.toggle('active', tab === 'radar');
  if (tabDuration) tabDuration.classList.toggle('active', tab === 'duration');
  if (tabFromTo) tabFromTo.classList.toggle('active', tab === 'fromto');
  if (tabAll) tabAll.classList.toggle('active', tab === 'all');

  const contentRadar = document.getElementById('tabContentRadar');
  const contentDuration = document.getElementById('tabContentDuration');
  const contentFromTo = document.getElementById('tabContentFromTo');

  if (contentRadar) contentRadar.style.display = tab === 'radar' ? 'block' : 'none';
  if (contentDuration) contentDuration.style.display = tab === 'duration' ? 'block' : 'none';
  if (contentFromTo) contentFromTo.style.display = tab === 'fromto' ? 'block' : 'none';

  if (tab === 'radar') {
    fetchAndRenderRadarFlights();
  } else if (tab === 'duration') {
    onDurationInputsChanged();
  } else if (tab === 'fromto') {
    onRouteFilterChanged();
  } else {
    fetchAndRenderFlights({ source: 'catalog' });
  }
}

function setQuickDuration(h, m) {
  document.getElementById('inputHours').value = h;
  document.getElementById('inputMinutes').value = m;
  const totalMins = Math.max(10, (h * 60) + m);
  if (timerMode === 'custom') {
    sessionTotalSeconds = totalMins * 60;
    sessionElapsedSeconds = 0;
    updateTelemetryAndProgress();
  }
  fetchAndRenderFlights({ durationMinutes: totalMins, tolerance: 45 });
}

function onDurationInputsChanged() {
  const h = parseInt(document.getElementById('inputHours').value) || 0;
  const m = parseInt(document.getElementById('inputMinutes').value) || 0;
  const totalMins = Math.max(10, (h * 60) + m);
  if (timerMode === 'custom') {
    sessionTotalSeconds = totalMins * 60;
    sessionElapsedSeconds = 0;
    updateTelemetryAndProgress();
  }
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
    if (currentActiveTab === 'radar') {
      fetchAndRenderRadarFlights({ search: q });
    } else {
      fetchAndRenderFlights({ search: q });
    }
  }, 250);
}

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

function toggleWindowFrame() {
  const frame = document.getElementById('windowFrame');
  frame.classList.toggle('active');
  const btn = document.getElementById('windowToggleBtn');
  btn.classList.toggle('primary', frame.classList.contains('active'));
}

/* --- Wallpaper Mode Switcher & Video / YouTube Wallpaper Controller --- */
function applyWallpaperMode(mode) {
  if (!mode) return;
  const liveCont = document.getElementById('liveWallpaperContainer');
  const exactImg = document.getElementById('exactBgPhoto');
  const webglCanvas = document.getElementById('webglCanvas');
  const videoCont = document.getElementById('videoWallpaperContainer');
  const videoPlayer = document.getElementById('bgVideoPlayer');
  const ytCont = document.getElementById('youtubeWallpaperContainer');
  const ytIframe = document.getElementById('ytBgIframe');
  const photoLayer = document.getElementById('photoBgLayer');
  const bgModeLabel = document.getElementById('bgModeLabel');

  if (bgModeLabel) bgModeLabel.innerText = mode.label;

  if (mode.type === 'youtube') {
    if (webglCanvas) webglCanvas.style.display = 'none';
    if (liveCont) liveCont.style.display = 'none';
    if (photoLayer) photoLayer.className = 'photo-bg-layer';
    if (videoCont) {
      videoCont.style.display = 'none';
      videoCont.classList.remove('active');
    }
    if (videoPlayer) videoPlayer.pause();

    if (ytCont) {
      ytCont.style.display = 'block';
      ytCont.classList.add('active');
    }
    if (ytIframe && mode.embedUrl) {
      if (ytIframe.src !== mode.embedUrl) {
        ytIframe.src = mode.embedUrl;
      }
    }
  } else if (mode.type === 'video') {
    if (ytCont) {
      ytCont.style.display = 'none';
      ytCont.classList.remove('active');
    }
    if (ytIframe) ytIframe.src = '';

    if (webglCanvas) webglCanvas.style.display = 'none';
    if (liveCont) liveCont.style.display = 'none';
    if (photoLayer) photoLayer.className = 'photo-bg-layer';

    if (videoCont) {
      videoCont.style.display = 'block';
      videoCont.classList.add('active');
    }
    if (videoPlayer && mode.videoSrc) {
      if (videoPlayer.src !== mode.videoSrc) {
        videoPlayer.src = mode.videoSrc;
      }
      videoPlayer.play().catch(err => {
        console.log('Video autoplay:', err);
      });
    }
  } else if (mode.type === '3d') {
    if (ytCont) {
      ytCont.style.display = 'none';
      ytCont.classList.remove('active');
    }
    if (ytIframe) ytIframe.src = '';

    if (videoCont) {
      videoCont.style.display = 'none';
      videoCont.classList.remove('active');
    }
    if (videoPlayer) videoPlayer.pause();
    if (liveCont) liveCont.style.display = 'none';
    if (photoLayer) photoLayer.className = 'photo-bg-layer';
    if (webglCanvas) webglCanvas.style.display = 'block';
    if (!threeInitialized) initThreeScene();
  } else if (mode.type === 'photo') {
    if (ytCont) {
      ytCont.style.display = 'none';
      ytCont.classList.remove('active');
    }
    if (ytIframe) ytIframe.src = '';

    if (videoCont) {
      videoCont.style.display = 'none';
      videoCont.classList.remove('active');
    }
    if (videoPlayer) videoPlayer.pause();
    if (webglCanvas) webglCanvas.style.display = 'none';
    if (photoLayer) photoLayer.className = 'photo-bg-layer';
    if (liveCont) liveCont.style.display = 'block';
    if (exactImg && mode.imgSrc) exactImg.src = mode.imgSrc;
  }
}

function cycleWallpaperMode() {
  currentWallpaperMode = (currentWallpaperMode + 1) % wallpaperModes.length;
  applyWallpaperMode(wallpaperModes[currentWallpaperMode]);
}

/* --- YouTube & Video Link Modal Controller --- */
function extractYouTubeId(url) {
  if (!url) return null;
  const str = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  return null;
}

function getYouTubeEmbedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`;
}

function openVideoLinkModal() {
  const modal = document.getElementById('videoLinkModal');
  if (modal) {
    modal.classList.add('open');
    const input = document.getElementById('customVideoLinkInput');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 120);
    }
  }
}

function closeVideoLinkModal() {
  const modal = document.getElementById('videoLinkModal');
  if (modal) modal.classList.remove('open');
}

function applyCustomVideoLink() {
  const input = document.getElementById('customVideoLinkInput');
  if (!input || !input.value.trim()) return;

  const url = input.value.trim();
  const ytId = extractYouTubeId(url);

  if (ytId) {
    const customMode = {
      id: `youtube-${ytId}`,
      type: 'youtube',
      label: `🎬 YouTube: ${ytId}`,
      embedUrl: getYouTubeEmbedUrl(ytId),
      videoId: ytId
    };
    wallpaperModes.unshift(customMode);
    currentWallpaperMode = 0;
    applyWallpaperMode(customMode);
    closeVideoLinkModal();
    input.value = '';
  } else if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('/')) {
    const customMode = {
      id: 'custom-web-video',
      type: 'video',
      label: `🎬 Custom Video Link`,
      videoSrc: url
    };
    wallpaperModes.unshift(customMode);
    currentWallpaperMode = 0;
    applyWallpaperMode(customMode);
    closeVideoLinkModal();
    input.value = '';
  } else {
    alert('Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...) or direct video stream URL.');
  }
}

function setPresetYouTube(videoId, label) {
  const customMode = {
    id: `youtube-${videoId}`,
    type: 'youtube',
    label: `🎬 YouTube: ${label}`,
    embedUrl: getYouTubeEmbedUrl(videoId),
    videoId: videoId
  };
  wallpaperModes.unshift(customMode);
  currentWallpaperMode = 0;
  applyWallpaperMode(customMode);
  closeVideoLinkModal();
}

function triggerCustomVideoUpload() {
  const input = document.getElementById('customVideoInput');
  if (input) input.click();
}

function onCustomVideoFilePicked(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const objectUrl = URL.createObjectURL(file);
  const customMode = {
    id: 'custom-user-video',
    type: 'video',
    label: `🎬 Custom Video: ${file.name.slice(0, 18)}...`,
    videoSrc: objectUrl
  };

  const existingIdx = wallpaperModes.findIndex(m => m.id === 'custom-user-video');
  if (existingIdx >= 0) {
    wallpaperModes[existingIdx] = customMode;
    currentWallpaperMode = existingIdx;
  } else {
    wallpaperModes.unshift(customMode);
    currentWallpaperMode = 0;
  }

  applyWallpaperMode(customMode);
}

/* --- Pure Zen Mode (Full-Screen Animated Wallpaper + Bottom-Left Pomodoro Dock) --- */
function toggleZenMode(enable) {
  isZenMode = typeof enable === 'boolean' ? enable : !isZenMode;
  const ui = document.getElementById('uiLayer');
  const restoreBtn = document.getElementById('zenRestoreBtn');

  if (isZenMode) {
    if (ui) {
      ui.classList.add('zen-mode');
      ui.classList.remove('zen-hidden');
    }
    if (restoreBtn) restoreBtn.classList.add('visible');

    // Trigger browser Fullscreen API
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request was blocked or not allowed:', err);
      });
    }
  } else {
    if (ui) {
      ui.classList.remove('zen-mode');
      ui.classList.remove('zen-hidden');
    }
    if (restoreBtn) restoreBtn.classList.remove('visible');

    // Exit browser Fullscreen API
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.log('Exit fullscreen error:', err);
      });
    }
  }
}

// Sync Zen Mode state when user exits fullscreen via browser controls / Esc
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && isZenMode) {
    toggleZenMode(false);
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
    e.preventDefault();
    toggleZenMode(!isZenMode);
  } else if (e.code === 'Escape') {
    if (isZenMode) toggleZenMode(false);
    closeFlightSearchModal();
    closeVideoLinkModal();
  }
});

/* =========================================================================
   6. SPOTIFY TRANSPARENT MUSIC ENGINE & PLAYLIST CONTROLLER
========================================================================= */
const userSpotifyProfile = {
  id: '31v43wenm35ut6szupaw2hftrzx4',
  url: 'https://open.spotify.com/user/31v43wenm35ut6szupaw2hftrzx4?si=d6741fd2b19a4f5b',
  embedUrl: 'https://open.spotify.com/embed/user/31v43wenm35ut6szupaw2hftrzx4?utm_source=generator&theme=0'
};

const spotifyPlaylists = [
  {
    id: 'user-profile',
    name: '👤 My Spotify',
    artist: 'User Profile · 31v43wenm35ut6szupaw2hftrzx4',
    embedUrl: userSpotifyProfile.embedUrl,
    profileUrl: userSpotifyProfile.url,
    isEmbed: true,
    songs: []
  },
  {
    id: 'sunset-lofi',
    name: '🌅 Sunset Flight',
    artist: 'AeroFocus Chillhop',
    bpm: 78,
    scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33],
    songs: [
      { title: 'Golden Hour Cruising', artist: 'AeroFocus Sunset', durationSec: 204 },
      { title: 'FL380 Above Clouds', artist: 'Skyline Lofi Beats', durationSec: 188 },
      { title: 'Wingtip Amber Glow', artist: 'Dreamliner Sessions', durationSec: 225 },
      { title: 'Twilight Descent', artist: 'Cabin Chillhop', durationSec: 210 }
    ]
  },
  {
    id: 'tokyo-synth',
    name: '🌃 Tokyo Night Synth',
    artist: 'Night Flight Wave',
    bpm: 84,
    scale: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
    songs: [
      { title: 'Tokyo Expressway Drift', artist: 'Shinjuku Midnight', durationSec: 195 },
      { title: 'Haneda Runway 34L', artist: 'AeroWave 80s', durationSec: 216 },
      { title: 'Neon Horizon Approach', artist: 'Synth Cruiser', durationSec: 240 },
      { title: 'Metropolis Starlight', artist: 'Nightliner', durationSec: 182 }
    ]
  },
  {
    id: 'cabin-focus',
    name: '✈️ Cabin Focus',
    artist: 'Binaural Deep Study',
    bpm: 64,
    scale: [196.00, 246.94, 293.66, 369.99, 440.00, 493.88],
    songs: [
      { title: 'Binaural 787 Cabin Tone', artist: 'Deep Focus Aero', durationSec: 240 },
      { title: 'Sub-Altitude Alpha State', artist: 'Mind Altitude', durationSec: 265 },
      { title: 'Transatlantic Night Cross', artist: 'Jetliner Sleep & Study', durationSec: 300 },
      { title: 'Flight Deck Calm', artist: 'AeroFocus Ambient', durationSec: 215 }
    ]
  },
  {
    id: 'cloud-rain',
    name: '🌧️ Rain Over Clouds',
    artist: 'Cozy Jetliner Lofi',
    bpm: 72,
    scale: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25],
    songs: [
      { title: 'Window Raindrop Beats', artist: 'Storm Cloud Lofi', durationSec: 198 },
      { title: 'Cloudburst Departure', artist: 'Wet Runway Beats', durationSec: 212 },
      { title: 'Monsoon Above 30,000ft', artist: 'Gentle Thunder Chill', durationSec: 245 },
      { title: 'Misty Touchdown at Dawn', artist: 'Cozy Jetliner', durationSec: 190 }
    ]
  },
  {
    id: 'sky-jazz',
    name: '☕ Sky Lounge Jazz',
    artist: 'First Class Lounge',
    bpm: 80,
    scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88],
    songs: [
      { title: 'First Class Espresso', artist: 'Sky Lounge Trio', durationSec: 214 },
      { title: 'Airport Velvet Chords', artist: 'Runway Jazz Club', durationSec: 232 },
      { title: 'Midnight Boarding Gate', artist: 'Gate 42 Jazz', durationSec: 195 },
      { title: 'Terminal Smooth Sunset', artist: 'Aviation Quartet', durationSec: 250 }
    ]
  }
];

let currentPlaylistIdx = 0;
let currentSongIdx = 0;
let isSpotifyPlaying = false;
let spotifyElapsedSecs = 0;
let spotifyTicker = null;
let lofiTimeoutId = null;
let lofiMasterGain = null;
let isDrawerOpen = false;

function initSpotifyUI() {
  renderPlaylistChips();
  renderSongList();
  updateSpotifyMeta();
}

function renderPlaylistChips() {
  const container = document.getElementById('playlistCategoryChips');
  if (!container) return;

  let html = '';
  spotifyPlaylists.forEach((pl, idx) => {
    const isActive = idx === currentPlaylistIdx;
    html += `<button class="pl-chip ${isActive ? 'active' : ''}" onclick="selectSpotifyPlaylist(${idx})">${pl.name}</button>`;
  });
  container.innerHTML = html;
}

function renderSongList() {
  const container = document.getElementById('spotifySongList');
  const embedCont = document.getElementById('spotifyEmbedContainer');
  if (!container) return;

  const currentPl = spotifyPlaylists[currentPlaylistIdx];

  if (currentPl.isEmbed) {
    container.style.display = 'none';
    if (embedCont) embedCont.style.display = 'block';
    return;
  }

  if (embedCont) embedCont.style.display = 'none';
  container.style.display = 'flex';

  let html = '';
  currentPl.songs.forEach((song, sIdx) => {
    const isActive = sIdx === currentSongIdx;
    const durStr = formatTrackDuration(song.durationSec);
    html += `
      <div class="song-item ${isActive ? 'active' : ''}" onclick="selectSpotifySong(${sIdx})">
        <div class="song-info">
          <div class="song-title-row">
            ${isActive && isSpotifyPlaying ? '<span>▶</span>' : ''}
            <span>${song.title}</span>
          </div>
          <div class="song-artist-row">${song.artist}</div>
        </div>
        <div class="song-dur">${durStr}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function updateSpotifyMeta() {
  const currentPl = spotifyPlaylists[currentPlaylistIdx];
  if (!currentPl) return;

  const titleEl = document.getElementById('spotifyTrackTitle');
  const artistEl = document.getElementById('spotifyTrackArtist');
  const durEl = document.getElementById('spDurationTime');

  if (currentPl.isEmbed) {
    if (titleEl) titleEl.innerText = currentPl.name;
    if (artistEl) artistEl.innerText = currentPl.artist;
    if (durEl) durEl.innerText = '--:--';
    return;
  }

  const song = currentPl.songs[currentSongIdx] || currentPl.songs[0];
  if (song) {
    if (titleEl) titleEl.innerText = song.title;
    if (artistEl) artistEl.innerText = `${song.artist} · ${currentPl.name.replace(/^[^\s]+\s/, '')}`;
    if (durEl) durEl.innerText = formatTrackDuration(song.durationSec);
  }
}

function formatTrackDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function toggleSpotifyDrawer(forceState) {
  isDrawerOpen = typeof forceState === 'boolean' ? forceState : !isDrawerOpen;
  const drawer = document.getElementById('spotifyPlaylistDrawer');
  if (drawer) {
    drawer.classList.toggle('open', isDrawerOpen);
  }
}

function selectSpotifyPlaylist(idx) {
  currentPlaylistIdx = idx;
  currentSongIdx = 0;
  spotifyElapsedSecs = 0;
  renderPlaylistChips();
  renderSongList();
  updateSpotifyMeta();

  const currentPl = spotifyPlaylists[idx];
  const iframe = document.getElementById('spotifyIframe');
  if (currentPl.isEmbed && iframe && currentPl.embedUrl) {
    iframe.src = currentPl.embedUrl;
  }

  if (isSpotifyPlaying && !currentPl.isEmbed) {
    stopLofiSynthesizer();
    startLofiSynthesizer();
  }
}

function selectSpotifySong(sIdx) {
  currentSongIdx = sIdx;
  spotifyElapsedSecs = 0;
  renderSongList();
  updateSpotifyMeta();
  if (!isSpotifyPlaying) {
    toggleSpotifyPlay();
  } else {
    stopLofiSynthesizer();
    startLofiSynthesizer();
  }
}

function toggleSpotifyPlay() {
  isSpotifyPlaying = !isSpotifyPlaying;
  const playBtn = document.getElementById('spotifyPlayBtn');
  const playIcon = document.getElementById('spPlayIcon');
  const disc = document.getElementById('spotifyArtDisc');
  const waveBars = document.getElementById('soundWaveBars');

  if (isSpotifyPlaying) {
    initAudioContext();
    if (playIcon) playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    if (disc) disc.classList.add('spinning');
    if (waveBars) waveBars.classList.add('active');

    startLofiSynthesizer();
    startSpotifyTicker();
  } else {
    if (playIcon) playIcon.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"/>';
    if (disc) disc.classList.remove('spinning');
    if (waveBars) waveBars.classList.remove('active');

    stopLofiSynthesizer();
    stopSpotifyTicker();
  }
  renderSongList();
}

function spotifyNextTrack() {
  const currentPl = spotifyPlaylists[currentPlaylistIdx];
  if (!currentPl || currentPl.isEmbed || !currentPl.songs.length) return;

  currentSongIdx = (currentSongIdx + 1) % currentPl.songs.length;
  spotifyElapsedSecs = 0;
  updateSpotifyMeta();
  renderSongList();

  if (isSpotifyPlaying) {
    stopLofiSynthesizer();
    startLofiSynthesizer();
  }
}

function spotifyPrevTrack() {
  const currentPl = spotifyPlaylists[currentPlaylistIdx];
  if (!currentPl || currentPl.isEmbed || !currentPl.songs.length) return;

  if (spotifyElapsedSecs > 3) {
    spotifyElapsedSecs = 0;
  } else {
    currentSongIdx = (currentSongIdx - 1 + currentPl.songs.length) % currentPl.songs.length;
    spotifyElapsedSecs = 0;
  }

  updateSpotifyMeta();
  renderSongList();

  if (isSpotifyPlaying) {
    stopLofiSynthesizer();
    startLofiSynthesizer();
  }
}

function startSpotifyTicker() {
  stopSpotifyTicker();
  spotifyTicker = setInterval(() => {
    const currentPl = spotifyPlaylists[currentPlaylistIdx];
    if (!currentPl || currentPl.isEmbed || !currentPl.songs.length) return;

    const currentSong = currentPl.songs[currentSongIdx];
    const totalSecs = currentSong.durationSec || 180;

    spotifyElapsedSecs++;
    if (spotifyElapsedSecs >= totalSecs) {
      spotifyNextTrack();
      return;
    }

    const curTimeEl = document.getElementById('spCurrentTime');
    const filledEl = document.getElementById('spProgressFilled');

    if (curTimeEl) curTimeEl.innerText = formatTrackDuration(spotifyElapsedSecs);
    if (filledEl) {
      const pct = (spotifyElapsedSecs / totalSecs) * 100;
      filledEl.style.width = `${pct}%`;
    }
  }, 1000);
}

function stopSpotifyTicker() {
  if (spotifyTicker) {
    clearInterval(spotifyTicker);
    spotifyTicker = null;
  }
}

function seekSpotify(e) {
  const currentPl = spotifyPlaylists[currentPlaylistIdx];
  if (!currentPl || currentPl.isEmbed || !currentPl.songs.length) return;

  const currentSong = currentPl.songs[currentSongIdx];
  const totalSecs = currentSong.durationSec || 180;

  const bar = e.currentTarget;
  const rect = bar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, clickX / rect.width));

  spotifyElapsedSecs = Math.floor(ratio * totalSecs);

  const curTimeEl = document.getElementById('spCurrentTime');
  const filledEl = document.getElementById('spProgressFilled');
  if (curTimeEl) curTimeEl.innerText = formatTrackDuration(spotifyElapsedSecs);
  if (filledEl) filledEl.style.width = `${ratio * 100}%`;
}

/* --- Web Audio API Relaxing Lofi Chord Synthesizer --- */
let lofiStep = 0;
function startLofiSynthesizer() {
  initAudioContext();
  if (!lofiMasterGain) {
    lofiMasterGain = audioCtx.createGain();
    lofiMasterGain.gain.setValueAtTime(0.22, audioCtx.currentTime);
    lofiMasterGain.connect(audioCtx.destination);
  }

  const currentPl = spotifyPlaylists[currentPlaylistIdx];
  if (currentPl.isEmbed) return;

  const bpm = currentPl.bpm || 75;
  const stepIntervalMs = (60 / bpm) * 500; // eighth notes

  function scheduleLofiStep() {
    if (!isSpotifyPlaying) return;

    const scale = currentPl.scale || [261.63, 293.66, 329.63, 392.00, 440.00];
    const now = audioCtx.currentTime;

    // 1. Mellow Electric Piano Chord note
    if (lofiStep % 2 === 0) {
      const noteIdx = (lofiStep % 4) * 2 % scale.length;
      const freq = scale[noteIdx];

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = lofiStep % 4 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now);
      filter.Q.setValueAtTime(1.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (stepIntervalMs / 1000) * 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(lofiMasterGain);

      osc.start(now);
      osc.stop(now + (stepIntervalMs / 1000) * 2);
    }

    // 2. Warm Bass Note on Beat 1 and 5
    if (lofiStep % 8 === 0 || lofiStep % 8 === 4) {
      const bassOsc = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bassOsc.type = 'sine';
      const rootFreq = (scale[0] || 261.63) / 2;
      bassOsc.frequency.setValueAtTime(rootFreq, now);

      bassGain.gain.setValueAtTime(0.24, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + (stepIntervalMs / 1000) * 3);

      bassOsc.connect(bassGain);
      bassGain.connect(lofiMasterGain);

      bassOsc.start(now);
      bassOsc.stop(now + (stepIntervalMs / 1000) * 3.2);
    }

    // 3. Subtle Lofi Vinyl / Tape Snare Click
    if (lofiStep % 4 === 2) {
      const bufferSize = audioCtx.sampleRate * 0.05;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const nFilter = audioCtx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(1800, now);
      const nGain = audioCtx.createGain();
      nGain.gain.setValueAtTime(0.15, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(lofiMasterGain);

      noise.start(now);
    }

    lofiStep = (lofiStep + 1) % 32;
    lofiTimeoutId = setTimeout(scheduleLofiStep, stepIntervalMs);
  }

  scheduleLofiStep();
}

function stopLofiSynthesizer() {
  if (lofiTimeoutId) {
    clearTimeout(lofiTimeoutId);
    lofiTimeoutId = null;
  }
}

/* =========================================================================
   7. APP BOOTSTRAP
========================================================================= */
window.addEventListener('DOMContentLoaded', async () => {
  initThreeScene();
  applyWallpaperMode(wallpaperModes[currentWallpaperMode]);
  loadAirports();
  updateFlightDisplay();
  initSpotifyUI();

  // Fetch initial Flightradar24 live radar stats
  try {
    const res = await fetch('/api/flights/radar?lat=28.65&lon=77.23&zoom=6');
    if (res.ok) {
      const data = await res.json();
      if (data && data.flights && data.flights.length > 0) {
        const badge = document.getElementById('fr24BadgeText');
        if (badge) badge.innerText = `FR24 LIVE: ${data.flights.length} FLIGHTS`;
      }
    }
  } catch (e) {
    // Fallback gracefully
  }

  // Pre-load default flight catalog
  fetchAndRenderFlights({ durationMinutes: 135 });
});


