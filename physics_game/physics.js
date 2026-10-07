/**
 * 2D Free-Fall & Rigid-Wall Physics Engine
 * Explicitly applies fundamental kinematic equations of motion:
 * 1) Velocity Equation:     v = v₀ + a * dt   (v_x = v_x0 + a_x * dt,  v_y = v_y0 + a_y * dt)
 * 2) Displacement Equation: x = x₀ + v₀ * dt + 0.5 * a * dt²
 */

class PhysicsEngine {
  constructor() {
    this.gravity = 15; // m/s^2 (scaled for canvas)
    this.restitution = 0.75; // Bounciness e
    this.friction = 0.08; // Wall friction coefficient mu
    this.scale = 100; // 100 pixels = 1 meter
  }

  setParameters(g, e, mu) {
    this.gravity = parseFloat(g) || 15;
    this.restitution = parseFloat(e) !== undefined ? parseFloat(e) : 0.75;
    this.friction = parseFloat(mu) !== undefined ? parseFloat(mu) : 0.08;
  }
}

class WallSegment {
  constructor(pA, pB) {
    this.a = pA;
    this.b = pB;
    this.dx = pB.x - pA.x;
    this.dy = pB.y - pA.y;
    this.len = Math.hypot(this.dx, this.dy);
    this.nx = this.len > 1e-5 ? -this.dy / this.len : 0;
    this.ny = this.len > 1e-5 ? this.dx / this.len : -1;
  }
}

class MultiStrokeWall {
  constructor() {
    this.strokes = [];
    this.segments = [];
  }

  addStroke(rawPoints) {
    if (!rawPoints || rawPoints.length < 2) return;
    this.strokes.push(rawPoints);
    this.buildSegments();
  }

  clear() {
    this.strokes = [];
    this.segments = [];
  }

  buildSegments() {
    this.segments = [];
    if (!this.strokes || this.strokes.length === 0) return;

    this.strokes.forEach(stroke => {
      if (stroke.length < 2) return;

      const smoothed = [stroke[0]];
      for (let i = 1; i < stroke.length - 1; i++) {
        smoothed.push({
          x: 0.25 * stroke[i - 1].x + 0.5 * stroke[i].x + 0.25 * stroke[i + 1].x,
          y: 0.25 * stroke[i - 1].y + 0.5 * stroke[i].y + 0.25 * stroke[i + 1].y
        });
      }
      smoothed.push(stroke[stroke.length - 1]);

      for (let i = 0; i < smoothed.length - 1; i++) {
        const seg = new WallSegment(smoothed[i], smoothed[i + 1]);
        if (seg.len > 1) {
          this.segments.push(seg);
        }
      }
    });
  }

  eraseAt(centerPt, eraserRadius = 25) {
    if (!this.strokes || this.strokes.length === 0) return;

    const newStrokes = [];
    this.strokes.forEach(stroke => {
      let currentSubStroke = [];
      stroke.forEach(pt => {
        const dist = Math.hypot(pt.x - centerPt.x, pt.y - centerPt.y);
        if (dist > eraserRadius) {
          currentSubStroke.push(pt);
        } else {
          if (currentSubStroke.length >= 2) {
            newStrokes.push(currentSubStroke);
          }
          currentSubStroke = [];
        }
      });
      if (currentSubStroke.length >= 2) {
        newStrokes.push(currentSubStroke);
      }
    });

    this.strokes = newStrokes;
    this.buildSegments();
  }
}

class RigidBall {
  constructor(startPt, radius = 12, color = '#f97316') {
    this.startPt = startPt;
    this.radius = radius;
    this.color = color;
    this.reset();
  }

  reset() {
    this.x = this.startPt ? this.startPt.x : 80;
    this.y = this.startPt ? this.startPt.y : 80;
    this.vx = 0; // initial velocity v_x0
    this.vy = 0; // initial velocity v_y0
    this.ax = 0; // acceleration a_x
    this.ay = 0; // acceleration a_y
    this.isFinished = false;
    this.elapsedTime = 0;
    this.trail = [];
  }

  update(dt, wallPath, engine, goalPt) {
    if (this.isFinished) return;

    this.elapsedTime += dt;
    const gPx = engine.gravity * engine.scale; // Acceleration due to gravity (px/s^2)

    // 1. Acceleration Definition
    this.ax = 0;
    this.ay = gPx;

    const airDrag = 1 - engine.friction * 0.05 * dt * 60;
    const v_x0 = this.vx * Math.max(0.95, airDrag);
    const v_y0 = this.vy * Math.max(0.95, airDrag);

    // 2. Kinematic Velocity Equation (v = v₀ + a * dt)
    this.vx = v_x0 + this.ax * dt;
    this.vy = v_y0 + this.ay * dt;

    // 3. Kinematic Position Equation (x = x₀ + v₀ * dt + 0.5 * a * dt²)
    this.x = this.x + v_x0 * dt + 0.5 * this.ax * dt * dt;
    this.y = this.y + v_y0 * dt + 0.5 * this.ay * dt * dt;

    // Motion Trail
    if (Math.random() < 0.3) {
      this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
      if (this.trail.length > 15) this.trail.shift();
    }
    this.trail.forEach(t => t.alpha -= dt * 1.5);
    this.trail = this.trail.filter(t => t.alpha > 0);

    // 4. Wall Collisions
    if (wallPath && wallPath.segments && wallPath.segments.length > 0) {
      for (let pass = 0; pass < 3; pass++) {
        for (const seg of wallPath.segments) {
          this.checkAndResolveWallCollision(seg, engine, dt);
        }
      }
    }

    // 5. Canvas Boundary Collisions
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx) * engine.restitution;
    } else if (this.x + this.radius > 960) {
      this.x = 960 - this.radius;
      this.vx = -Math.abs(this.vx) * engine.restitution;
    }

    if (this.y + this.radius > 540) {
      this.y = 540 - this.radius;
      this.vy = -Math.abs(this.vy) * engine.restitution;
      this.vx *= Math.max(0, 1 - engine.friction * 2);
      if (Math.abs(this.vy) < 15) this.vy = 0;
      if (Math.abs(this.vx) < 5) this.vx = 0;
    }

    // 6. Goal Detection
    if (goalPt) {
      const distToGoal = Math.hypot(this.x - goalPt.x, this.y - goalPt.y);
      if (distToGoal <= this.radius + 20) {
        this.isFinished = true;
      }
    }
  }

  checkAndResolveWallCollision(seg, engine, dt) {
    const pA = seg.a;
    const pB = seg.b;

    const abX = pB.x - pA.x;
    const abY = pB.y - pA.y;
    const abLenSq = abX * abX + abY * abY;
    if (abLenSq === 0) return;

    const acX = this.x - pA.x;
    const acY = this.y - pA.y;

    let t = (acX * abX + acY * abY) / abLenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = pA.x + t * abX;
    const closestY = pA.y + t * abY;

    const distX = this.x - closestX;
    const distY = this.y - closestY;
    const dist = Math.hypot(distX, distY);

    if (dist < this.radius) {
      let nx = dist > 1e-4 ? distX / dist : seg.nx;
      let ny = dist > 1e-4 ? distY / dist : seg.ny;

      const overlap = this.radius - dist;

      this.x += nx * overlap;
      this.y += ny * overlap;

      const vDotN = this.vx * nx + this.vy * ny;
      const vnX = vDotN * nx;
      const vnY = vDotN * ny;
      const vtX = this.vx - vnX;
      const vtY = this.vy - vnY;

      if (vDotN < 0) {
        const restitution = engine.restitution;
        const frictionDamping = Math.max(0, 1 - engine.friction * 4.0);
        
        this.vx = vtX * frictionDamping - restitution * vnX;
        this.vy = vtY * frictionDamping - restitution * vnY;
      } else {
        const frictionDamping = Math.max(0, 1 - engine.friction * 2.0 * dt * 60);
        this.vx = vtX * frictionDamping + vnX;
        this.vy = vtY * frictionDamping + vnY;
      }

      const currentSpeed = Math.hypot(this.vx, this.vy);
      if (currentSpeed < engine.friction * 80) {
        const wallSlopeAbs = Math.abs(seg.dy / (seg.dx || 1e-4));
        if (wallSlopeAbs < engine.friction * 2.5) {
          this.vx *= 0.5;
          this.vy *= 0.5;
          if (currentSpeed < 3) {
            this.vx = 0;
            this.vy = 0;
          }
        }
      }
    }
  }
}
