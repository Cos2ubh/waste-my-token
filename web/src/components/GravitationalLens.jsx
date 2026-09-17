import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// --- GLSL Shaders ---

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  // Fast hash for procedural stars
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Procedural star field
  float stars(vec2 uv, float scale) {
    vec2 grid = floor(uv * scale);
    vec2 local = fract(uv * scale) - 0.5;
    float r = hash(grid);
    float size = 0.015 + r * 0.025;
    float brightness = step(0.88, r);
    return brightness * smoothstep(size, 0.0, length(local));
  }

  // Accretion disk color + Doppler beaming
  vec3 accretionDisk(vec2 p, float t) {
    float r = length(p);
    float angle = atan(p.y, p.x);

    // Disk only exists in a band of radii
    float innerEdge = 0.13;
    float outerEdge = 0.55;
    float band = smoothstep(innerEdge, innerEdge + 0.04, r) *
                 smoothstep(outerEdge, outerEdge - 0.08, r);

    // Temperature: inner = blue-white, outer = orange-red
    float heat = 1.0 - smoothstep(innerEdge, outerEdge, r);
    vec3 hot  = vec3(0.85, 0.95, 1.00); // blue-white
    vec3 warm = vec3(1.00, 0.55, 0.10); // orange
    vec3 cool = vec3(0.80, 0.10, 0.02); // deep red
    vec3 diskColor = heat > 0.5
      ? mix(warm, hot,  (heat - 0.5) * 2.0)
      : mix(cool, warm,  heat * 2.0);

    // Relativistic Doppler beaming — left side blazes, right side dims
    float doppler = 1.0 + 0.75 * sin(angle + t * 0.25);

    // Thin disk: suppress above/below equatorial plane
    float equator = exp(-abs(p.y / (r + 0.001)) * 12.0);

    // Turbulent brightness variation
    float flicker = 0.75 + 0.25 * sin(angle * 7.0 + t * 2.0 + r * 30.0);

    return diskColor * band * doppler * equator * flicker * 2.5;
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.5);
    vec2 p = uv - center;

    // Correct for aspect ratio
    float aspect = u_resolution.x / u_resolution.y;
    p.x *= aspect;

    float r = length(p);
    float rs = 0.10; // Schwarzschild radius

    // Absolute black inside event horizon
    if (r < rs) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // Photon sphere — razor-thin bright ring at 1.5 * rs
    float photonRing = smoothstep(0.008, 0.0, abs(r - rs * 1.5)) * 4.5;

    // Gravitational lensing: deflect background UV
    float deflection = (rs * rs) / (r * r + 0.001);
    vec2 lensed = p - normalize(p) * deflection * 1.2;

    // Undo aspect for texture sampling
    lensed.x /= aspect;
    lensed += center;

    // Background star field (lensed)
    float s = 0.0;
    s += stars(lensed * 1.8,  18.0);
    s += stars(lensed * 3.1 + 0.17, 28.0) * 0.6;
    s += stars(lensed * 5.7 + 0.43, 45.0) * 0.3;
    // Subtle blue tint on stars closer to the lens
    float starHeat = smoothstep(0.45, 0.0, r);
    vec3 starColor = mix(vec3(0.7, 0.75, 1.0), vec3(0.4, 0.55, 1.0), starHeat) * s * 2.5;

    // Gravitational redshift darkens stars near event horizon
    float redshift = smoothstep(rs, rs * 2.8, r);
    starColor *= redshift;

    // Accretion disk
    vec3 disk = accretionDisk(p, u_time);

    // Purple nebula glow around singularity
    float nebula = exp(-r * r * 3.5) * 0.18;
    vec3 nebulaColor = vec3(0.25, 0.0, 0.55) * nebula;

    // Outer ambient glow (very faint dark blue)
    float outerGlow = exp(-r * r * 0.8) * 0.06;
    vec3 glowColor = vec3(0.05, 0.08, 0.22) * outerGlow;

    vec3 color = starColor + disk + nebulaColor + glowColor;
    color += vec3(0.55, 0.75, 1.0) * photonRing;

    // Tone map and gamma correct
    color = color / (color + 0.8);
    color = pow(color, vec3(0.45));

    gl_FragColor = vec4(color, 1.0);
  }
`;

// --- Token particle labels (cycles through these) ---
const TOKEN_LABELS = [
  'GPTBot/1.0', 'context_window', '{"role":"user"}', 'ClaudeBot',
  'tokens_left:', 'PerplexityBot', 'embedding[]', 'system_prompt',
  '0x4f2a9c', 'MAX_TOKENS', 'logprobs', 'temperature:0',
  'attention_mask', 'input_ids', 'hidden_state', 'BeamSearch',
];

function buildTokenTexture(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, 128, 32);
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#a78bfa';
  ctx.fillText(label, 4, 20);
  return new THREE.CanvasTexture(canvas);
}

export default function GravitationalLens({ style }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Scene setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // --- Lens plane (fullscreen quad) ---
    const uniforms = {
      u_time:       { value: 0 },
      u_resolution: { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
    };

    const lensGeo  = new THREE.PlaneGeometry(2, 2);
    const lensMat  = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    scene.add(lensMesh);

    // --- Token particles ---
    const PARTICLE_COUNT = 320;
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 2); // angle speed, radial speed
    const scales     = new Float32Array(PARTICLE_COUNT);
    const lifetimes  = new Float32Array(PARTICLE_COUNT);

    function resetParticle(i) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = 0.55 + Math.random() * 0.85;
      positions[i * 3]     = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.55; // flatten into disk plane
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      velocities[i * 2]    = 0.003 + Math.random() * 0.004; // angular speed
      velocities[i * 2 + 1] = 0.0004 + Math.random() * 0.0006; // inward drift
      scales[i]    = 0.3 + Math.random() * 0.7;
      lifetimes[i] = Math.random(); // stagger start phases
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) resetParticle(i);

    // Build sprite sheet — one texture per label, reuse across particles
    const textures = TOKEN_LABELS.map(buildTokenTexture);

    // Use one Points object for performance
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.018,
      color: new THREE.Color(0x7c3aed),
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // Sprite layer for text labels (subset of particles, every 8th)
    const sprites = [];
    for (let i = 0; i < PARTICLE_COUNT; i += 8) {
      const tex = textures[i % textures.length];
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55 });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.22, 0.055, 1);
      sprite.userData.particleIndex = i;
      scene.add(sprite);
      sprites.push(sprite);
    }

    // --- Animation loop ---
    let frameId;
    const clock = new THREE.Clock();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      uniforms.u_time.value = elapsed;

      // Update particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const r = Math.sqrt(x * x + (y / 0.55) * (y / 0.55));
        const angle = Math.atan2(y / 0.55, x);

        const angSpeed = velocities[i * 2];
        const radSpeed = velocities[i * 2 + 1];

        // Orbital spiral: speed up as radius shrinks (conservation of angular momentum)
        const newR     = r - radSpeed * (1.0 / (r * r + 0.1));
        const newAngle = angle + angSpeed / (r + 0.1);

        positions[i * 3]     = Math.cos(newAngle) * newR;
        positions[i * 3 + 1] = Math.sin(newAngle) * newR * 0.55;

        // Swallowed — reset to outer ring
        if (newR < 0.08) resetParticle(i);
      }

      pGeo.attributes.position.needsUpdate = true;

      // Sync sprite positions to their particle
      for (const sprite of sprites) {
        const i = sprite.userData.particleIndex;
        sprite.position.set(positions[i * 3], positions[i * 3 + 1], 0.01);
        // Fade out as they approach the event horizon
        const r = Math.sqrt(positions[i * 3] ** 2 + (positions[i * 3 + 1] / 0.55) ** 2);
        sprite.material.opacity = Math.min(0.6, (r - 0.08) * 1.5);
      }

      renderer.render(scene, camera);
    }

    animate();

    // --- Resize handler ---
    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w, h);
    }
    window.addEventListener('resize', onResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      lensMat.dispose();
      lensGeo.dispose();
      pGeo.dispose();
      pMat.dispose();
      textures.forEach(t => t.dispose());
      sprites.forEach(s => s.material.dispose());
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: '#050508',
        ...style,
      }}
    />
  );
}
