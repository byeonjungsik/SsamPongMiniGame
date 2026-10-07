/**
 * 3D Porcelain Toilet Simulator - Main Application with Precision Sitting Height Adjustment
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-container');
  const flushStatus = document.getElementById('flush-status');

  if (!container) return;

  // UI Elements
  const flushBtn = document.getElementById('flush-btn');
  const diarrheaBtn = document.getElementById('diarrhea-btn');
  const toggleLidBtn = document.getElementById('toggle-lid-btn');
  const toggleSeatBtn = document.getElementById('toggle-seat-btn');
  const skinBtns = document.querySelectorAll('.skin-btn');
  const roughnessSlider = document.getElementById('roughness-slider');
  const roughnessValEl = document.getElementById('roughness-val');
  const waterVisibleToggle = document.getElementById('water-visible-toggle');

  // Custom Sound Picker Elements
  const soundPickerBtn = document.getElementById('sound-picker-btn');
  const audioFileInput = document.getElementById('audio-file-input');
  const diarrheaSoundName = document.getElementById('diarrhea-sound-name');
  const flushSoundName = document.getElementById('flush-sound-name');
  const resetSoundBtn = document.getElementById('reset-sound-btn');

  // Sound Modal Elements
  const soundModal = document.getElementById('sound-modal');
  const modalFilename = document.getElementById('modal-filename');
  const mapDiarrheaBtn = document.getElementById('map-diarrhea-btn');
  const mapFlushBtn = document.getElementById('map-flush-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');

  let pendingSoundFile = null;
  let customDiarrheaAudioUrl = null;
  let customFlushAudioUrl = null;

  // Web Audio API Sound Synthesizer Fallback Engine
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthDiarrheaSound() {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 1.2);
    
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
    
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.5);

    const bufferSize = audioCtx.sampleRate * 1.6;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(2.5, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.45, now + 0.15);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + 1.6);

    for (let i = 0; i < 6; i++) {
      const popTime = now + 0.1 + Math.random() * 1.0;
      const popOsc = audioCtx.createOscillator();
      const popGain = audioCtx.createGain();
      
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(220 + Math.random() * 300, popTime);
      popOsc.frequency.exponentialRampToValueAtTime(80, popTime + 0.08);

      popGain.gain.setValueAtTime(0.2, popTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.08);

      popOsc.connect(popGain);
      popGain.connect(audioCtx.destination);
      popOsc.start(popTime);
      popOsc.stop(popTime + 0.09);
    }
  }

  function playSynthFlushSound() {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    const bufferSize = audioCtx.sampleRate * 2.8;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(300, now + 2.5);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 2.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(now);
    noise.stop(now + 2.8);
  }

  function triggerDiarrheaAudio() {
    if (customDiarrheaAudioUrl) {
      const customAudio = new Audio(customDiarrheaAudioUrl);
      customAudio.play().catch(e => console.log('Audio playback error:', e));
    } else {
      playSynthDiarrheaSound();
    }
  }

  function triggerFlushAudio() {
    if (customFlushAudioUrl) {
      const customAudio = new Audio(customFlushAudioUrl);
      customAudio.play().catch(e => console.log('Audio playback error:', e));
    } else {
      playSynthFlushSound();
    }
  }

  // Custom Sound Handlers
  soundPickerBtn.addEventListener('click', () => {
    audioFileInput.value = '';
    audioFileInput.click();
  });

  audioFileInput.addEventListener('change', (evt) => {
    if (evt.target.files && evt.target.files.length > 0) {
      pendingSoundFile = evt.target.files[0];
      modalFilename.textContent = pendingSoundFile.name;
      soundModal.classList.remove('hidden');
    }
  });

  mapDiarrheaBtn.addEventListener('click', () => {
    if (pendingSoundFile) {
      customDiarrheaAudioUrl = URL.createObjectURL(pendingSoundFile);
      diarrheaSoundName.textContent = pendingSoundFile.name;
      soundModal.classList.add('hidden');
    }
  });

  mapFlushBtn.addEventListener('click', () => {
    if (pendingSoundFile) {
      customFlushAudioUrl = URL.createObjectURL(pendingSoundFile);
      flushSoundName.textContent = pendingSoundFile.name;
      soundModal.classList.add('hidden');
    }
  });

  modalCancelBtn.addEventListener('click', () => {
    pendingSoundFile = null;
    soundModal.classList.add('hidden');
  });

  resetSoundBtn.addEventListener('click', () => {
    customDiarrheaAudioUrl = null;
    customFlushAudioUrl = null;
    diarrheaSoundName.textContent = '기본 합성 음향';
    flushSoundName.textContent = '기본 합성 음향';
  });

  // 1. Three.js Scene, Camera, Renderer Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#090d16');
  scene.fog = new THREE.FogExp2('#090d16', 0.02);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 9, 14);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  let controls;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 6;
    controls.maxDistance = 35;
    controls.target.set(0, 3.5, 0);
  } else {
    controls = createFallbackCameraControls(camera, renderer.domElement);
  }

  // 2. Lighting Setup
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight('#fff7ed', 1.8);
  sunLight.position.set(12, 20, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 50;
  const d = 10;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  const fillLight = new THREE.PointLight('#38bdf8', 1.2, 20);
  fillLight.position.set(-8, 10, -6);
  scene.add(fillLight);

  const floorGeo = new THREE.PlaneGeometry(30, 30);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const gridHelper = new THREE.GridHelper(30, 30, '#1e293b', '#0f172a');
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  // 3. Porcelain, Chrome & Person Models
  const porcelainMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'),
    roughness: 0.1,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'),
    roughness: 0.1,
    metalness: 0.95
  });

  const toilet = createToilet3DModel(porcelainMat, chromeMat);
  scene.add(toilet.group);

  const person = createPerson3DModel();
  scene.add(person.group);

  // 4. Diarrhea Particle System
  class DiarrheaParticleSystem {
    constructor(scene, maxParticles = 200) {
      this.scene = scene;
      this.maxParticles = maxParticles;
      this.particles = [];

      this.geometry = new THREE.BufferGeometry();
      this.positions = new Float32Array(maxParticles * 3);
      this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(120, 53, 15, 0.95)');
      grad.addColorStop(0.6, 'rgba(161, 98, 7, 0.7)');
      grad.addColorStop(1, 'rgba(161, 98, 7, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);

      this.material = new THREE.PointsMaterial({
        size: 0.7,
        map: texture,
        transparent: true,
        depthWrite: false
      });

      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.scene.add(this.pointsMesh);
    }

    spawnStream(count = 60) {
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= this.maxParticles) break;

        this.particles.push({
          x: (Math.random() - 0.5) * 0.6,
          y: 3.6 + Math.random() * 0.8,
          z: 0.4 + (Math.random() - 0.5) * 0.6,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -5 - Math.random() * 5,
          vz: (Math.random() - 0.5) * 0.5,
          life: 1.0,
          decay: 2.0 + Math.random() * 2.0
        });
      }
    }

    update(dt) {
      const posAttr = this.geometry.attributes.position;
      let activeCount = 0;

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= p.decay * dt;

        if (p.life <= 0 || p.y < 2.2) {
          this.particles.splice(i, 1);
          continue;
        }

        p.vy -= 9.8 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        const idx = activeCount * 3;
        this.positions[idx] = p.x;
        this.positions[idx + 1] = p.y;
        this.positions[idx + 2] = p.z;
        activeCount++;
      }

      for (let i = activeCount * 3; i < this.maxParticles * 3; i++) {
        this.positions[i] = 0;
      }

      posAttr.needsUpdate = true;
      this.geometry.setDrawRange(0, activeCount);
    }
  }

  const diarrheaParticles = new DiarrheaParticleSystem(scene);

  // 5. State & Animation Sequences
  let isLidOpen = true;
  let isSeatOpen = false;
  let lidTargetRotX = -Math.PI * 0.55;
  let seatTargetRotX = 0;

  let isFlushing = false;
  let flushTimer = 0;
  let leverTargetRotZ = 0;
  let isDirty = false;

  let personState = 'IDLE';
  let personTimer = 0;
  let walkCycleTime = 0;

  // Target Y sitting position on top of the seat ring
  const targetSittingY = 2.2;

  const cleanWaterColor = new THREE.Color('#00d2ff');

  toilet.lidGroup.rotation.x = lidTargetRotX;

  toggleLidBtn.addEventListener('click', () => {
    isLidOpen = !isLidOpen;
    lidTargetRotX = isLidOpen ? -Math.PI * 0.55 : 0;
  });

  toggleSeatBtn.addEventListener('click', () => {
    isSeatOpen = !isSeatOpen;
    seatTargetRotX = isSeatOpen ? -Math.PI * 0.52 : 0;
    if (isSeatOpen && !isLidOpen) {
      isLidOpen = true;
      lidTargetRotX = -Math.PI * 0.55;
    }
  });

  diarrheaBtn.addEventListener('click', () => {
    if (personState !== 'IDLE') return;

    if (!isLidOpen) {
      isLidOpen = true;
      lidTargetRotX = -Math.PI * 0.55;
    }

    personState = 'WALK_IN';
    personTimer = 0;
    person.group.position.set(10, 0, 0.4);
    person.group.rotation.y = -Math.PI / 2;
    person.group.visible = true;

    flushStatus.textContent = '🏃 사람이 급하게 화장실로 뛰어오는 중...';
    flushStatus.style.color = '#f59e0b';
  });

  flushBtn.addEventListener('click', () => {
    if (isFlushing) return;

    triggerFlushAudio();

    isFlushing = true;
    flushTimer = 0;
    flushStatus.textContent = '🌊 회오리 물 내리는 중...';
    flushStatus.style.color = '#38bdf8';

    leverTargetRotZ = Math.PI / 4;
    setTimeout(() => { leverTargetRotZ = 0; }, 400);
  });

  const skinColors = {
    white: { color: '#ffffff', metalness: 0.05 },
    black: { color: '#1e293b', metalness: 0.1 },
    gold: { color: '#f59e0b', metalness: 0.8 },
    rosegold: { color: '#fb7185', metalness: 0.7 }
  };

  skinBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      skinBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const skinName = btn.getAttribute('data-skin');
      const skinData = skinColors[skinName];

      if (skinData) {
        porcelainMat.color.set(skinData.color);
        porcelainMat.metalness = skinData.metalness;
      }
    });
  });

  roughnessSlider.addEventListener('input', (e) => {
    roughnessValEl.textContent = parseFloat(e.target.value).toFixed(2);
    porcelainMat.roughness = parseFloat(e.target.value);
  });

  waterVisibleToggle.addEventListener('change', (e) => {
    toilet.waterGroup.visible = e.target.checked;
  });

  // 6. Animation Loop
  let lastTime = performance.now();

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    if (controls && controls.update) controls.update();

    toilet.lidGroup.rotation.x += (lidTargetRotX - toilet.lidGroup.rotation.x) * 0.12;
    toilet.seatGroup.rotation.x += (seatTargetRotX - toilet.seatGroup.rotation.x) * 0.12;
    toilet.leverGroup.rotation.z += (leverTargetRotZ - toilet.leverGroup.rotation.z) * 0.2;

    diarrheaParticles.update(dt);

    if (personState !== 'IDLE') {
      personTimer += dt;
      walkCycleTime += dt * 10;

      if (personState === 'WALK_IN') {
        person.group.position.x -= dt * 6.0;

        const swing = Math.sin(walkCycleTime) * 0.6;
        person.leftArmGroup.rotation.x = swing;
        person.rightArmGroup.rotation.x = -swing;
        person.leftLegGroup.rotation.x = -swing;
        person.rightLegGroup.rotation.x = swing;

        if (person.group.position.x <= 0.2) {
          person.group.position.x = 0;
          personState = 'SIT';
          personTimer = 0;
          flushStatus.textContent = '🚽 사람이 변기에 앉았습니다!';
        }
      } else if (personState === 'SIT') {
        person.group.rotation.y = 0;
        // Smoothly move UP onto the seat ring at Y = 2.2
        person.group.position.y = Math.min(targetSittingY, person.group.position.y + dt * 5.0);
        person.leftLegGroup.rotation.x = Math.PI / 2;
        person.rightLegGroup.rotation.x = Math.PI / 2;

        if (personTimer > 0.8) {
          personState = 'POOP';
          personTimer = 0;

          triggerDiarrheaAudio();
          diarrheaParticles.spawnStream(80);
          isDirty = true;

          setTimeout(() => {
            toilet.waterSurfaceMesh.material.color.set('#78350f');
            toilet.swirlMesh.material.color.set('#b45309');
          }, 200);

          flushStatus.textContent = '💩 시원하게 물설사 보는 중... 콰아아-!';
        }
      } else if (personState === 'POOP') {
        // Shimmer slightly on top of the seat ring
        person.group.position.y = targetSittingY + Math.sin(personTimer * 15) * 0.05;

        if (personTimer > 2.0) {
          personState = 'STAND';
          personTimer = 0;
          flushStatus.textContent = '💨 옷을 입고 일어나는 중...';
        }
      } else if (personState === 'STAND') {
        // Lower back down to floor Y = 0 as person stands up
        person.group.position.y = Math.max(0, person.group.position.y - dt * 5.0);
        person.leftLegGroup.rotation.x = 0;
        person.rightLegGroup.rotation.x = 0;

        if (personTimer > 0.6) {
          personState = 'WALK_OUT';
          personTimer = 0;
          person.group.rotation.y = Math.PI / 2;
          flushStatus.textContent = '💨 사람이 시원하게 싸고 떠났습니다! (물 내리기가 필요합니다)';
          flushStatus.style.color = '#ca8a04';
        }
      } else if (personState === 'WALK_OUT') {
        person.group.position.x -= dt * 5.0;

        const swing = Math.sin(walkCycleTime) * 0.6;
        person.leftArmGroup.rotation.x = swing;
        person.rightArmGroup.rotation.x = -swing;
        person.leftLegGroup.rotation.x = -swing;
        person.rightLegGroup.rotation.x = swing;

        if (person.group.position.x < -9.5) {
          personState = 'IDLE';
          person.group.visible = false;
        }
      }
    }

    if (isFlushing) {
      flushTimer += dt;

      if (flushTimer < 1.4) {
        const t = flushTimer / 1.4;
        toilet.waterGroup.position.y = 2.6 - t * 1.3;
        toilet.swirlMesh.visible = true;
        toilet.swirlMesh.rotation.y += 18 * dt;
      } else if (flushTimer < 3.0) {
        const t = (flushTimer - 1.4) / 1.6;
        toilet.waterGroup.position.y = 1.3 + t * 1.3;
        toilet.swirlMesh.rotation.y += (1 - t) * 10 * dt;

        if (isDirty && t > 0.3) {
          toilet.waterSurfaceMesh.material.color.lerp(cleanWaterColor, 0.08);
          toilet.swirlMesh.material.color.set('#38bdf8');
        }
      } else {
        isFlushing = false;
        isDirty = false;
        toilet.waterGroup.position.y = 2.6;
        toilet.swirlMesh.visible = false;
        toilet.waterSurfaceMesh.material.color.set('#00d2ff');
        flushStatus.textContent = '깨끗함 (대기 중)';
        flushStatus.style.color = '#22c55e';
      }
    }

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
  let spherical = { radius: 16, theta: 0, phi: Math.PI / 3 };

  function updateCamera() {
    camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.position.y = spherical.radius * Math.cos(spherical.phi);
    camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.lookAt(0, 3.5, 0);
  }

  domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  domElement.addEventListener('pointerdown', (e) => {
    if (e.button === 0 || e.button === 2) {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  domElement.addEventListener('pointermove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      spherical.theta -= deltaX * 0.005;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 + 0.1, spherical.phi - deltaY * 0.005));

      previousMousePosition = { x: e.clientX, y: e.clientY };
      updateCamera();
    }
  });

  window.addEventListener('pointerup', () => { isDragging = false; });
  domElement.addEventListener('wheel', (e) => {
    spherical.radius = Math.max(6, Math.min(35, spherical.radius + e.deltaY * 0.02));
    updateCamera();
  });

  updateCamera();
  return { update: () => {} };
}
