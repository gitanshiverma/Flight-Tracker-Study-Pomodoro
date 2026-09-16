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
let currentWallpaperMode = 0; // 0: Student with Laptop Aesthetic Video (Default)
const wallpaperModes = [
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
    id: 'video-sunset-wing', 
    type: 'video', 
    label: '🎬 Live Video: Airplane Wing Sunset Flight', 
    videoSrc: 'https://assets.mixkit.co/videos/42171/42171-720.mp4' 
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

  document.getElementById('airlineTag').innerText = (activeFlight.airline || 'AIRLINE').toUpperCase();
  document.getElementById('flightNoDisplay').innerText = activeFlight.flightNumber || 'FLIGHT';
  document.getElementById('aircraftTypeDisplay').innerText = activeFlight.aircraft || 'Commercial Jetliner';

  const orig = activeFlight.origin || {};
  const dest = activeFlight.destination || {};
  document.getElementById('originCode').innerText = orig.code || 'DEP';
  document.getElementById('originCity').innerText = orig.city ? `${orig.city}` : 'Origin';
  document.getElementById('depTime').innerText = `STD: ${activeFlight.departureTimeUTC || '04:30'} UTC`;

  document.getElementById('destCode').innerText = dest.code || 'ARR';
  document.getElementById('destCity').innerText = dest.city ? `${dest.city}` : 'Destination';
  document.getElementById('arrTime').innerText = `STA: ${activeFlight.arrivalTimeUTC || '06:45'} UTC`;

  updateTelemetryAndProgress();
}

function updateTelemetryAndProgress() {
  const total = Math.max(1, sessionTotalSeconds);
  const progress = Math.min(1.0, sessionElapsedSeconds / total);
  const percent = Math.round(progress * 100);

  const progressBar = document.getElementById('routeProgressBar');
  const planeMarker = document.getElementById('planeMarker');
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (planeMarker) planeMarker.style.left = `${percent}%`;

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

  const totalKm = activeFlight.distanceKm || 2000;
  const totalNM = Math.round(totalKm * 0.539957);
  const remNM = Math.max(0, Math.round(totalNM * (1.0 - progress)));
  document.getElementById('teleDistance').innerHTML = `${remNM.toLocaleString()} <span>NM</span>`;

  const remainingSecs = Math.max(0, sessionTotalSeconds - sessionElapsedSeconds);
  document.getElementById('teleETA').innerText = formatHMS(remainingSecs);

  document.getElementById('studyClockDisplay').innerText = formatHMS(remainingSecs);
  document.getElementById('sessionStatusSub').innerText = isTimerRunning
    ? `Study In-Flight · ${percent}% Completed · Next Waypoint: WP${Math.min(5, Math.floor(progress * 4) + 1)}`
    : `Session Ready · Target Time: ${formatHMS(sessionTotalSeconds)}`;
}

function formatHMS(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatMS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

/* --- Wallpaper Mode Switcher & Video Wallpaper Controller --- */
function applyWallpaperMode(mode) {
  if (!mode) return;
  const liveCont = document.getElementById('liveWallpaperContainer');
  const exactImg = document.getElementById('exactBgPhoto');
  const webglCanvas = document.getElementById('webglCanvas');
  const videoCont = document.getElementById('videoWallpaperContainer');
  const videoPlayer = document.getElementById('bgVideoPlayer');
  const photoLayer = document.getElementById('photoBgLayer');
  const bgModeLabel = document.getElementById('bgModeLabel');

  if (bgModeLabel) bgModeLabel.innerText = mode.label;

  if (mode.type === 'video') {
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

/* --- Pure Zen Mode (Full-Screen Animated Wallpaper) --- */
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
window.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
  applyWallpaperMode(wallpaperModes[currentWallpaperMode]);
  loadAirports();
  fetchAndRenderFlights({ durationMinutes: 135 });
  updateFlightDisplay();
  initSpotifyUI();
});

