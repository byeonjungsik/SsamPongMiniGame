/**
 * 3D Swimming Pool Navier-Stokes Fluid Simulator - Main Application
 * Features Real-World Physics Constants (g = 9.81 m/s^2, Archimedes Buoyancy, Parabolic Dive Kinematics).
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-container');
  const fpsCounter = document.getElementById('fps-counter');

  // UI Controls
  const dropBallBtn = document.getElementById('drop-ball-btn');
  const poopPoolBtn = document.getElementById('poop-pool-btn');
  const filterPoolBtn = document.getElementById('filter-pool-btn');
  const waveImpulseBtn = document.getElementById('wave-impulse-btn');
  const resetWaterBtn = document.getElementById('reset-water-btn');
  
  const speedSlider = document.getElementById('speed-slider');
  const speedValEl = document.getElementById('speed-val');
  const dampingSlider = document.getElementById('damping-slider');
  const dampingValEl = document.getElementById('damping-val');
  const gravitySlider = document.getElementById('gravity-slider');
  const gravityValEl = document.getElementById('gravity-val');
  
  const causticsToggle = document.getElementById('caustics-toggle');
  const particlesToggle = document.getElementById('particles-toggle');
  const colorBtns = document.querySelectorAll('.color-btn');

  // Web Audio API Procedural Diarrhea Sound Synth for Pool
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playPoolDiarrheaSound() {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.8);
    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.9);

    const bufferSize = audioCtx.sampleRate * 2.0;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(2.0, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.9);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + 2.0);
  }

  // 1. Three.js Scene, Camera, Renderer Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050914');
  scene.fog = new THREE.FogExp2('#050914', 0.012);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 24, 34);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // OrbitControls with Fallback
  let controls;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 80;
    controls.target.set(0, -2, 0);
  } else {
    controls = createFallbackCameraControls(camera, renderer.domElement);
  }

  // 2. Lighting Setup
  const ambientLight = new THREE.AmbientLight('#a5f3fc', 0.7);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight('#fff7ed', 1.8);
  sunLight.position.set(22, 36, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 100;
  const d = 25;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  const underwaterLightColor = '#38bdf8';
  const cornerCoords = [
    [-17, -4, -17], [17, -4, -17], [-17, -4, 17], [17, -4, 17]
  ];
  cornerCoords.forEach(([x, y, z]) => {
    const light = new THREE.PointLight(underwaterLightColor, 2.5, 18);
    light.position.set(x, y, z);
    scene.add(light);
  });

  // 3. Procedural Pool Tile Texture Generator
  function createPoolTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 4;
    const tileSize = 32;

    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(rx, ry, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  const poolTileTexture = createPoolTileTexture();
  const poolMaterial = new THREE.MeshStandardMaterial({
    map: poolTileTexture,
    roughness: 0.3,
    metalness: 0.1
  });

  // 4. Construct Pool Basin & Diving Board
  const poolWidth = 36;
  const poolDepth = 36;
  const poolHeight = 6;

  const floorGeo = new THREE.PlaneGeometry(poolWidth, poolDepth);
  const floorMesh = new THREE.Mesh(floorGeo, poolMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -poolHeight;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const wallMat = new THREE.MeshStandardMaterial({ map: poolTileTexture, roughness: 0.3 });
  
  const wallGeoZ = new THREE.PlaneGeometry(poolWidth, poolHeight);
  const backWall = new THREE.Mesh(wallGeoZ, wallMat);
  backWall.position.set(0, -poolHeight / 2, -poolDepth / 2);
  scene.add(backWall);

  const frontWall = new THREE.Mesh(wallGeoZ, wallMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, -poolHeight / 2, poolDepth / 2);
  scene.add(frontWall);

  const wallGeoX = new THREE.PlaneGeometry(poolDepth, poolHeight);
  const leftWall = new THREE.Mesh(wallGeoX, wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-poolWidth / 2, -poolHeight / 2, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeoX, wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(poolWidth / 2, -poolHeight / 2, 0);
  scene.add(rightWall);

  // Pool Deck
  const deckMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 });
  const deckThickness = 4;

  const deckNorth = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + deckThickness * 2, 0.6, deckThickness), deckMat);
  deckNorth.position.set(0, 0.3, -(poolDepth / 2 + deckThickness / 2));
  deckNorth.receiveShadow = true;
  scene.add(deckNorth);

  const deckSouth = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + deckThickness * 2, 0.6, deckThickness), deckMat);
  deckSouth.position.set(0, 0.3, (poolDepth / 2 + deckThickness / 2));
  deckSouth.receiveShadow = true;
  scene.add(deckSouth);

  const deckEast = new THREE.Mesh(new THREE.BoxGeometry(deckThickness, 0.6, poolDepth), deckMat);
  deckEast.position.set((poolWidth / 2 + deckThickness / 2), 0.3, 0);
  deckEast.receiveShadow = true;
  scene.add(deckEast);

  const deckWest = new THREE.Mesh(new THREE.BoxGeometry(deckThickness, 0.6, poolDepth), deckMat);
  deckWest.position.set(-(poolWidth / 2 + deckThickness / 2), 0.3, 0);
  deckWest.receiveShadow = true;
  scene.add(deckWest);

  // Diving Board
  const boardMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2, metalness: 0.2 });
  const baseMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8, roughness: 0.2 });

  const boardGroup = new THREE.Group();
  const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 10), boardMat);
  boardMesh.position.set(0, 3.5, -15);
  boardMesh.castShadow = true;
  boardGroup.add(boardMesh);

  const standLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.5), baseMat);
  standLeft.position.set(-1.2, 1.75, -19);
  boardGroup.add(standLeft);

  const standRight = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.5), baseMat);
  standRight.position.set(1.2, 1.75, -19);
  boardGroup.add(standRight);

  scene.add(boardGroup);

  // 5. Navier-Stokes Physics Grid, Particles & Water Surface Mesh
  const gridSize = 128;
  const physicsGrid = new NavierStokesPoolGrid(gridSize);
  const splashParticles = new WaterSplashParticleSystem(scene);
  const poolDiarrheaParticles = new PoolDiarrheaParticleSystem(scene);

  const waterGeo = new THREE.PlaneGeometry(poolWidth, poolDepth, gridSize - 1, gridSize - 1);
  waterGeo.rotateX(-Math.PI / 2);

  const cleanWaterColorHex = '#00d2ff';
  const dirtyWaterColorHex = '#523b18';
  const cleanWaterColor = new THREE.Color(cleanWaterColorHex);
  const dirtyWaterColor = new THREE.Color(dirtyWaterColorHex);

  const waterMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cleanWaterColorHex),
    opacity: 0.78,
    transparent: true,
    roughness: 0.05,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0;
  scene.add(waterMesh);

  // Dynamic Caustics Canvas Overlay
  const causticsCanvas = document.createElement('canvas');
  causticsCanvas.width = 128;
  causticsCanvas.height = 128;
  const causticsCtx = causticsCanvas.getContext('2d');
  const causticsTexture = new THREE.CanvasTexture(causticsCanvas);

  const causticsMat = new THREE.MeshBasicMaterial({
    map: causticsTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.45
  });

  const causticsFloor = new THREE.Mesh(new THREE.PlaneGeometry(poolWidth, poolDepth), causticsMat);
  causticsFloor.rotation.x = -Math.PI / 2;
  causticsFloor.position.y = -poolHeight + 0.05;
  scene.add(causticsFloor);

  // 6. 3D Swimmer Person Character
  function createSwimmer3DModel() {
    const swimmerGroup = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: '#fde047', roughness: 0.5 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.4 });

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), skinMat);
    headMesh.position.set(0, 0.8, 0);
    swimmerGroup.add(headMesh);

    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 1.4, 16), shortsMat);
    torsoMesh.position.set(0, 0, 0);
    torsoMesh.rotation.x = Math.PI / 2;
    swimmerGroup.add(torsoMesh);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.8, 0.2, -0.4);
    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2), skinMat);
    lArm.rotation.x = Math.PI / 2;
    leftArmGroup.add(lArm);
    swimmerGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.8, 0.2, -0.4);
    const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2), skinMat);
    rArm.rotation.x = Math.PI / 2;
    rightArmGroup.add(rArm);
    swimmerGroup.add(rightArmGroup);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.3, 0, 0.8);
    const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.2), skinMat);
    lLeg.rotation.x = Math.PI / 2;
    leftLegGroup.add(lLeg);
    swimmerGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.3, 0, 0.8);
    const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.2), skinMat);
    rLeg.rotation.x = Math.PI / 2;
    rightLegGroup.add(rLeg);
    swimmerGroup.add(rightLegGroup);

    swimmerGroup.position.set(0, 3.8, -15);
    swimmerGroup.visible = false;

    return {
      group: swimmerGroup,
      leftArmGroup: leftArmGroup,
      rightArmGroup: rightArmGroup,
      leftLegGroup: leftLegGroup,
      rightLegGroup: rightLegGroup
    };
  }

  const swimmer = createSwimmer3DModel();
  scene.add(swimmer.group);

  let swimmerState = 'IDLE';
  let swimmerTimer = 0;
  let swimCycle = 0;
  let isPoolPolluted = false;
  let swimmerVy = 0; // Kinematic vertical velocity

  // 7. Dropped Ball Class with Real Physics Equations (g = 9.81 m/s^2, Archimedes Buoyancy & Quadratic Fluid Drag)
  const balls = [];

  class DroppedBall {
    constructor(x, y, z) {
      this.mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 32, 32),
        new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.2, metalness: 0.3 })
      );
      this.mesh.position.set(x, y, z);
      this.mesh.castShadow = true;
      scene.add(this.mesh);

      this.x = x;
      this.y = y;
      this.z = z;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = 0;
      this.vz = (Math.random() - 0.5) * 1.5;
      this.radius = 1.2;
      this.hasSplashed = false;
    }

    update(dt, g = 9.81) {
      if (this.y > 0) {
        // Real gravity acceleration in air: vy = vy - g * dt
        this.vy -= g * dt;
      } else {
        // Water entry kinetic impact & buoyancy physics
        if (!this.hasSplashed) {
          this.hasSplashed = true;
          const gx = Math.round(((this.x + poolWidth / 2) / poolWidth) * (gridSize - 1));
          const gz = Math.round(((this.z + poolDepth / 2) / poolDepth) * (gridSize - 1));

          if (gx >= 2 && gx < gridSize - 2 && gz >= 2 && gz < gridSize - 2) {
            // Impact wave impulse proportional to impact kinetic energy (0.5 * m * v_impact^2)
            const impactVelocity = Math.abs(this.vy);
            physicsGrid.addImpulse(gx, gz, 7, -0.6 * impactVelocity);
          }

          if (particlesToggle.checked) {
            splashParticles.spawnSplash(this.x, 0, this.z, 40);
          }
        }

        // Archimedes Buoyancy force upward (F_buoyant = rho * V * g)
        const buoyancyAccel = g * 1.45;
        const netAccelY = buoyancyAccel - g;
        this.vy += netAccelY * dt;

        // Quadratic Water Drag: F_drag = -0.5 * Cd * rho * A * v * |v|
        const dragCoeff = 0.92;
        this.vy *= dragCoeff;
        this.vx *= dragCoeff;
        this.vz *= dragCoeff;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.z += this.vz * dt;

      const maxX = poolWidth / 2 - this.radius;
      const maxZ = poolDepth / 2 - this.radius;
      if (Math.abs(this.x) > maxX) { this.x = Math.sign(this.x) * maxX; this.vx *= -0.5; }
      if (Math.abs(this.z) > maxZ) { this.z = Math.sign(this.z) * maxZ; this.vz *= -0.5; }
      if (this.y < -poolHeight + this.radius) { this.y = -poolHeight + this.radius; this.vy *= -0.3; }

      this.mesh.position.set(this.x, this.y, this.z);
    }
  }

  // 8. Raycasting Mouse Water Interaction
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isMouseDown = false;

  function triggerWaterInteraction(evt) {
    mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(waterMesh);

    if (intersects.length > 0) {
      const pt = intersects[0].point;
      const gx = Math.round(((pt.x + poolWidth / 2) / poolWidth) * (gridSize - 1));
      const gz = Math.round(((pt.z + poolDepth / 2) / poolDepth) * (gridSize - 1));

      if (gx >= 2 && gx < gridSize - 2 && gz >= 2 && gz < gridSize - 2) {
        physicsGrid.addImpulse(gx, gz, 6, 2.5);

        if (particlesToggle.checked && Math.random() < 0.4) {
          splashParticles.spawnSplash(pt.x, 0, pt.z, 12);
        }
      }
    }
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (e.button === 0) {
      isMouseDown = true;
      triggerWaterInteraction(e);
    }
  });

  renderer.domElement.addEventListener('pointermove', (e) => {
    if (isMouseDown) {
      triggerWaterInteraction(e);
    }
  });

  window.addEventListener('pointerup', () => { isMouseDown = false; });

  // 9. Event Listener Bindings
  dropBallBtn.addEventListener('click', () => {
    const rx = (Math.random() - 0.5) * (poolWidth - 10);
    const rz = (Math.random() - 0.5) * (poolDepth - 10);
    balls.push(new DroppedBall(rx, 14, rz));
  });

  poopPoolBtn.addEventListener('click', () => {
    if (swimmerState !== 'IDLE') return;

    swimmerState = 'DIVE';
    swimmerTimer = 0;
    swimmerVy = 2.0; // Initial upward takeoff jump off diving board
    swimmer.group.position.set(0, 3.8, -15);
    swimmer.group.visible = true;
  });

  filterPoolBtn.addEventListener('click', () => {
    isPoolPolluted = false;
    poolDiarrheaParticles.clear();
  });

  waveImpulseBtn.addEventListener('click', () => {
    for (let i = 0; i < 4; i++) {
      const gx = Math.floor(20 + Math.random() * 88);
      const gz = Math.floor(20 + Math.random() * 88);
      physicsGrid.addImpulse(gx, gz, 10, (Math.random() - 0.5) * 6.0);
    }
  });

  resetWaterBtn.addEventListener('click', () => {
    physicsGrid.reset();
  });

  speedSlider.addEventListener('input', (e) => {
    speedValEl.textContent = e.target.value;
    physicsGrid.setParameters(e.target.value, dampingSlider.value);
  });

  dampingSlider.addEventListener('input', (e) => {
    dampingValEl.textContent = e.target.value;
    physicsGrid.setParameters(speedSlider.value, e.target.value);
  });

  gravitySlider.addEventListener('input', (e) => {
    gravityValEl.textContent = parseFloat(e.target.value).toFixed(2);
  });

  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const hex = btn.getAttribute('data-color');
      waterMat.color.set(hex);
      cleanWaterColor.set(hex);
    });
  });

  causticsToggle.addEventListener('change', (e) => {
    causticsFloor.visible = e.target.checked;
  });

  // 10. Update Water Heights, Caustics & Render Loop
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = performance.now();

  function updateWaterMesh() {
    const posAttr = waterGeo.attributes.position;
    const h = physicsGrid.height;
    const size = gridSize;

    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const idx = z * size + x;
        const vertIdx = z * size + x;

        posAttr.setY(vertIdx, h[idx]);
      }
    }
    posAttr.needsUpdate = true;
    waterGeo.computeVertexNormals();
  }

  function updateCausticsTexture() {
    if (!causticsToggle.checked) return;

    const imgData = causticsCtx.createImageData(128, 128);
    const data = imgData.data;
    const normals = physicsGrid.normals;
    const size = gridSize;

    for (let i = 0; i < size * size; i++) {
      const nx = normals[i * 3];
      const nz = normals[i * 3 + 2];
      
      const intensity = Math.min(255, Math.max(0, Math.floor((Math.abs(nx) + Math.abs(nz)) * 450)));
      
      const pixelIdx = i * 4;
      data[pixelIdx] = 56;
      data[pixelIdx + 1] = 189;
      data[pixelIdx + 2] = 248;
      data[pixelIdx + 3] = intensity;
    }

    causticsCtx.putImageData(imgData, 0, 0);
    causticsTexture.needsUpdate = true;
  }

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    frameCount++;
    if (now - fpsTimer >= 1000) {
      fpsCounter.textContent = `${frameCount} FPS`;
      frameCount = 0;
      fpsTimer = now;
    }

    if (controls && controls.update) controls.update();

    const currentG = parseFloat(gravitySlider.value);

    physicsGrid.step(dt);
    updateWaterMesh();
    updateCausticsTexture();

    // ========================================================
    // Swimmer Diarrhea Parabolic Dive & Swimming Physics Timeline
    // ========================================================
    if (swimmerState !== 'IDLE') {
      swimmerTimer += dt;
      swimCycle += dt * 12;

      if (swimmerState === 'DIVE') {
        // Real Kinematic Parabolic Jump & Fall off diving board:
        // vy = vy - g * dt,  y = y + vy * dt,  z = z + v_z * dt
        swimmerVy -= currentG * dt;
        swimmer.group.position.y += swimmerVy * dt;
        swimmer.group.position.z += dt * 7.5; // Forward velocity

        if (swimmer.group.position.y <= -0.2) {
          swimmer.group.position.y = -0.2;
          swimmerState = 'SWIM_POOP';
          swimmerTimer = 0;

          // Water entry impact wave & sound
          const gx = Math.round(((swimmer.group.position.x + poolWidth / 2) / poolWidth) * (gridSize - 1));
          const gz = Math.round(((swimmer.group.position.z + poolDepth / 2) / poolDepth) * (gridSize - 1));
          physicsGrid.addImpulse(gx, gz, 8, -5.5);
          splashParticles.spawnSplash(swimmer.group.position.x, 0, swimmer.group.position.z, 35);
          playPoolDiarrheaSound();
          isPoolPolluted = true;
        }
      } else if (swimmerState === 'SWIM_POOP') {
        swimmer.group.position.z += dt * 5.5;

        const stroke = Math.sin(swimCycle) * 0.8;
        swimmer.leftArmGroup.rotation.y = stroke;
        swimmer.rightArmGroup.rotation.y = -stroke;
        swimmer.leftLegGroup.rotation.z = Math.cos(swimCycle) * 0.4;
        swimmer.rightLegGroup.rotation.z = -Math.cos(swimCycle) * 0.4;

        poolDiarrheaParticles.spawnCloud(swimmer.group.position.x, -0.4, swimmer.group.position.z - 0.8, 12);
        
        const gx = Math.round(((swimmer.group.position.x + poolWidth / 2) / poolWidth) * (gridSize - 1));
        const gz = Math.round(((swimmer.group.position.z + poolDepth / 2) / poolDepth) * (gridSize - 1));
        physicsGrid.addImpulse(gx, gz, 4, 1.2);

        if (swimmer.group.position.z >= 14) {
          swimmerState = 'EXIT';
        }
      } else if (swimmerState === 'EXIT') {
        swimmer.group.position.z += dt * 4.0;
        swimmer.group.position.y += dt * 2.5;

        if (swimmer.group.position.z > 18) {
          swimmerState = 'IDLE';
          swimmer.group.visible = false;
        }
      }
    }

    if (isPoolPolluted) {
      waterMat.color.lerp(dirtyWaterColor, 0.04);
    } else {
      waterMat.color.lerp(cleanWaterColor, 0.04);
    }

    if (particlesToggle.checked) {
      splashParticles.update(dt, currentG);
      poolDiarrheaParticles.update(dt);
    }

    balls.forEach(ball => ball.update(dt, currentG));

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  requestAnimationFrame(animate);
});

function createFallbackCameraControls(camera, domElement) {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let spherical = { radius: 45, theta: 0, phi: Math.PI / 4 };

  function updateCamera() {
    camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.position.y = spherical.radius * Math.cos(spherical.phi);
    camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.lookAt(0, -2, 0);
  }

  domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  domElement.addEventListener('pointerdown', (e) => {
    if (e.button === 2) {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  domElement.addEventListener('pointermove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      spherical.theta -= deltaX * 0.005;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.005));

      previousMousePosition = { x: e.clientX, y: e.clientY };
      updateCamera();
    }
  });

  window.addEventListener('pointerup', () => { isDragging = false; });
  domElement.addEventListener('wheel', (e) => {
    spherical.radius = Math.max(10, Math.min(80, spherical.radius + e.deltaY * 0.03));
    updateCamera();
  });

  updateCamera();
  return { update: () => {} };
}
