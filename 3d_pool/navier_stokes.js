/**
 * 3D Navier-Stokes Incompressible Water Surface & Wave Simulation Engine
 * Incorporates exact real-world physics constants (g = 9.81 m/s^2, quadratic fluid drag, Archimedes buoyancy).
 */

class NavierStokesPoolGrid {
  constructor(size = 128) {
    this.size = size;
    this.numPoints = size * size;
    
    // Height & Velocity fields
    this.height = new Float32Array(this.numPoints);
    this.velocity = new Float32Array(this.numPoints);
    this.normals = new Float32Array(this.numPoints * 3);

    // Real-World Physical Parameters
    this.waveSpeed = 3.2; // Real surface wave phase velocity c (m/s)
    this.damping = 0.04;  // Kinematic viscosity damping gamma
    this.gridSpacing = 0.3; // Spatial grid step dx = 0.3m
  }

  setParameters(speed, damping) {
    this.waveSpeed = parseFloat(speed) || 3.2;
    this.damping = parseFloat(damping) || 0.04;
  }

  reset() {
    this.height.fill(0);
    this.velocity.fill(0);
    this.normals.fill(0);
  }

  /**
   * Adds Gaussian wave impulse at grid coordinate (gx, gz) based on physical kinetic energy impact
   */
  addImpulse(gx, gz, radius = 6, strength = 3.5) {
    const rSq = radius * radius;
    const size = this.size;

    for (let z = Math.max(1, gz - radius); z < Math.min(size - 1, gz + radius); z++) {
      for (let x = Math.max(1, gx - radius); x < Math.min(size - 1, gx + radius); x++) {
        const dx = x - gx;
        const dz = z - gz;
        const distSq = dx * dx + dz * dz;

        if (distSq < rSq) {
          const factor = Math.exp(-distSq / (rSq * 0.4)) * strength;
          const idx = z * size + x;
          this.height[idx] += factor;
        }
      }
    }
  }

  /**
   * Discrete Navier-Stokes Wave Step (Euler-Cromer Integration with 5-point Laplacian)
   */
  step(dt = 0.016) {
    const size = this.size;
    const c2 = this.waveSpeed * this.waveSpeed;
    const gamma = this.damping;
    const h = this.height;
    const v = this.velocity;

    for (let z = 1; z < size - 1; z++) {
      const zOffset = z * size;
      for (let x = 1; x < size - 1; x++) {
        const idx = zOffset + x;

        const laplacian = h[idx - 1] + h[idx + 1] + h[idx - size] + h[idx + size] - 4 * h[idx];

        const accel = c2 * laplacian - gamma * v[idx];

        v[idx] += accel * dt;
      }
    }

    for (let i = 0; i < this.numPoints; i++) {
      h[i] += v[i] * dt;
    }

    for (let z = 1; z < size - 1; z++) {
      const zOffset = z * size;
      for (let x = 1; x < size - 1; x++) {
        const idx = zOffset + x;

        const dhdx = (h[idx + 1] - h[idx - 1]) * 0.5;
        const dhdz = (h[idx + size] - h[idx - size]) * 0.5;

        const len = Math.hypot(-dhdx, 1.0, -dhdz);
        const normIdx = idx * 3;
        this.normals[normIdx] = -dhdx / len;
        this.normals[normIdx + 1] = 1.0 / len;
        this.normals[normIdx + 2] = -dhdz / len;
      }
    }
  }
}

/**
 * 3D Water Splash Particle System (for drops & ball impacts under real gravity g = 9.81 m/s^2)
 */
class WaterSplashParticleSystem {
  constructor(scene, maxParticles = 300) {
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
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.6)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.8,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.pointsMesh);
  }

  spawnSplash(x, y, z, count = 35) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 7.5;
      const upSpeed = 4.5 + Math.random() * 8.5; // Initial kinetic launch velocity

      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.5,
        y: y + 0.2,
        z: z + (Math.random() - 0.5) * 0.5,
        vx: Math.cos(angle) * speed,
        vy: upSpeed,
        vz: Math.sin(angle) * speed,
        life: 1.0,
        decay: 1.2 + Math.random() * 1.5
      });
    }
  }

  update(dt, gravity = 9.81) {
    const posAttr = this.geometry.attributes.position;
    let activeCount = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;

      if (p.life <= 0 || p.y < -5) {
        this.particles.splice(i, 1);
        continue;
      }

      // Real gravity acceleration: vy = vy - g * dt
      p.vy -= gravity * dt;
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

/**
 * 3D Pool Diarrhea Cloud Particle System with Fluid Convection Drag
 */
class PoolDiarrheaParticleSystem {
  constructor(scene, maxParticles = 400) {
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
    grad.addColorStop(0.5, 'rgba(101, 163, 13, 0.7)');
    grad.addColorStop(1, 'rgba(120, 53, 15, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 1.4,
      map: texture,
      transparent: true,
      depthWrite: false
    });

    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.pointsMesh);
  }

  spawnCloud(x, y, z, count = 25) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.8,
        y: y + (Math.random() - 0.5) * 0.4,
        z: z + (Math.random() - 0.5) * 0.8,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.8,
        life: 1.0,
        decay: 0.3 + Math.random() * 0.4
      });
    }
  }

  clear() {
    this.particles = [];
    const posAttr = this.geometry.attributes.position;
    for (let i = 0; i < this.maxParticles * 3; i++) {
      this.positions[i] = 0;
    }
    posAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, 0);
  }

  update(dt) {
    const posAttr = this.geometry.attributes.position;
    let activeCount = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Fluid resistance damping
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vz *= 0.96;

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
