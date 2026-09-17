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

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float stars(vec2 uv, float scale) {
    vec2 grid = floor(uv * scale);
    vec2 local = fract(uv * scale) - 0.5;
    float r = hash(grid);
    float size = 0.012 + r * 0.02;
    return step(0.86, r) * smoothstep(size, 0.0, length(local));
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.5);
    vec2 p = uv - center;
    float aspect = u_resolution.x / u_resolution.y;
    p.x *= aspect;

    float r = length(p);
    float angle = atan(p.y, p.x);
    float t = u_time;

    // --- Constants ---
    float RS   = 0.14;   // event horizon radius
    float INNER = 0.18;  // disk inner edge
    float OUTER = 0.72;  // disk outer edge
    float TILT  = 3.2;   // y squish — simulates ~72° viewing angle (Interstellar-style)

    // --- Event horizon: absolute black ---
    if (r < RS) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // --- Gravitational lensing of background ---
    float deflection = (RS * RS * 1.6) / (r * r + 0.001);
    vec2 lensed = p - normalize(p) * deflection;
    lensed.x /= aspect;
    lensed += center;

    float s = 0.0;
    s += stars(lensed * 2.1, 20.0) * 1.2;
    s += stars(lensed * 3.8 + 0.23, 32.0) * 0.7;
    s += stars(lensed * 6.5 + 0.61, 50.0) * 0.4;
    float redshift = smoothstep(RS, RS * 3.2, r);
    float starHeat = smoothstep(0.5, 0.0, r);
    vec3 starColor = mix(vec3(0.75, 0.8, 1.0), vec3(0.3, 0.5, 1.0), starHeat) * s * 3.0 * redshift;

    // --- Tilted accretion disk ---
    // Squish y to simulate viewing the disk at an angle
    vec2 diskCoord = vec2(p.x, p.y * TILT);
    float diskR = length(diskCoord);
    float diskAngle = atan(p.y, p.x);

    // Doppler beaming: left side (approaching) blazes 3-4x brighter
    float doppler = pow(max(0.0, 1.0 + 0.85 * cos(diskAngle + t * 0.18)), 2.8);

    // Radial disk profile
    float diskBand = smoothstep(INNER - 0.01, INNER + 0.05, diskR)
                   * smoothstep(OUTER, OUTER * 0.55, diskR);

    // Temperature: blue-white inner → bright yellow mid → deep red outer
    float heat = 1.0 - smoothstep(INNER, OUTER, diskR);
    vec3 outerColor = vec3(0.9,  0.12, 0.01);  // deep red-orange
    vec3 midColor   = vec3(1.0,  0.65, 0.15);  // bright amber
    vec3 innerColor = vec3(0.6,  0.85, 1.5);   // blue-white (over-exposed)
    vec3 diskColor  = heat < 0.5
      ? mix(outerColor, midColor, heat * 2.0)
      : mix(midColor, innerColor, (heat - 0.5) * 2.0);

    // Turbulent flicker
    float flicker = 0.78 + 0.22 * sin(diskAngle * 9.0 + t * 2.5 + diskR * 25.0);

    vec3 disk = diskColor * diskBand * doppler * flicker * 4.5;

    // --- Photon ring: soft gaussian glow, not a hard circle ---
    float photonR = RS * 1.5;
    float photon  = exp(-pow((r - photonR) / 0.012, 2.0)) * 7.0;
    // Only glow on the lit side of the disk (not behind the singularity)
    float litSide = smoothstep(-0.1, 0.4, cos(angle + t * 0.18));
    vec3 photonColor = mix(vec3(0.5, 0.7, 1.0), vec3(1.0, 0.8, 0.5), litSide) * photon;

    // --- Inner shadow ring (dark region just outside event horizon) ---
    float innerShadow = smoothstep(RS * 1.0, RS * 1.35, r)
                      * smoothstep(RS * 2.2, RS * 1.5, r);
    vec3 shadowColor  = vec3(0.0) * innerShadow;

    // --- Volumetric glow halo around the whole black hole ---
    float halo = exp(-r * r * 2.2) * 0.35;
    vec3 haloColor = vec3(0.18, 0.04, 0.45) * halo;

    // Wide diffuse orange glow from the bright disk side
    float diskGlow = exp(-pow(r - 0.4, 2.0) * 3.0) * doppler * 0.25;
    vec3 diskGlowColor = vec3(0.9, 0.35, 0.05) * diskGlow;

    // --- Compose ---
    vec3 color = starColor + disk + photonColor + haloColor + diskGlowColor;

    // Cinematic tone mapping (ACES approximation)
    color = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
    color = pow(max(color, 0.0), vec3(0.42));

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
