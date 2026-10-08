// Ray-traced Schwarzschild black hole.
//
// Units: Schwarzschild radius = 1, so the event horizon is r = 1, the photon sphere
// r = 1.5 and the innermost stable circular orbit (disk inner edge) r = 3.
//
// Every pixel fires a ray from the camera and integrates its null geodesic backwards.
// For a photon around a Schwarzschild mass the bending reduces to a central
// acceleration a = -1.5 · h² · x / r⁵ (h = |x × v|, conserved), which bends rays
// the way GR does — the lensed back of the disk, the photon ring and the warped
// starfield all fall out of the integration instead of being painted on.

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;        // seconds, drives disk turbulence
  uniform float uAspect;      // width / height
  uniform vec3  uCamPos;
  uniform mat3  uCamBasis;    // columns: right, up, forward
  uniform float uFov;         // tan(vfov / 2)
  uniform float uShift;       // lens shift — moves the hole down the frame without tilting the camera
  uniform float uDiskTemp;    // peak disk temperature, Kelvin
  uniform float uBeaming;     // 1 = full relativistic beaming (g^4)
  uniform float uExposure;

  varying vec2 vUv;

  #define STEPS 280
  #define R_IN  3.0
  #define R_OUT 13.0

  // ── noise ───────────────────────────────────────────────────────────────
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i),                    hash13(i + vec3(1, 0, 0)), f.x),
          mix(hash13(i + vec3(0, 1, 0)),    hash13(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0, 0, 1)),    hash13(i + vec3(1, 0, 1)), f.x),
          mix(hash13(i + vec3(0, 1, 1)),    hash13(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * vnoise(p);
      p = p * 2.03 + vec3(17.1, 9.2, 4.7);
      a *= 0.5;
    }
    return s;
  }

  // ── blackbody colour (Tanner Helland fit), linear-ish RGB ──────────────
  vec3 blackbody(float kelvin) {
    float t = clamp(kelvin, 1000.0, 40000.0) / 100.0;
    float r = t <= 66.0 ? 1.0 : 1.29293618606 * pow(t - 60.0, -0.1332047592);
    float g = t <= 66.0 ? 0.39008157876 * log(t) - 0.63184144378
                        : 1.12989086089 * pow(t - 60.0, -0.0755148492);
    float b = t >= 66.0 ? 1.0
            : (t <= 19.0 ? 0.0 : 0.54320678911 * log(t - 10.0) - 1.19625408914);
    vec3 c = clamp(vec3(r, g, b), 0.0, 1.0);
    return c * c; // to linear
  }

  // ── accretion disk ──────────────────────────────────────────────────────
  // turbulent gas in the co-rotating frame. Keplerian shear would smear any
  // pattern into infinitely thin rings over time, so two phases of the flow are
  // cross-faded (the flow-map trick) and the shear never accumulates.
  float gas(float r, float phi) {
    // round clumps in disk-plane space; the Keplerian shear winds them into spiral
    // arms on its own, plus a faint radial grain so it still reads as orbiting gas
    vec2 xy = vec2(cos(phi), sin(phi)) * r;
    float clumps = fbm(vec3(xy * 0.85, r * 0.3));
    float grain = vnoise(vec3(r * 5.0, xy * 0.6));
    return clumps * 0.85 + grain * 0.3;
  }

  vec4 disk(vec3 p, vec3 rayDir) {
    float r = length(p.xz);
    if (r < R_IN || r > R_OUT) return vec4(0.0);

    float phi = atan(p.z, p.x);
    float omega = sqrt(0.5 / (r * r * r));   // Kepler, M = 0.5 in these units
    float P = 14.0;
    float t1 = mod(uTime, P);
    float t2 = mod(uTime + 0.5 * P, P);
    float w1 = 1.0 - abs(2.0 * t1 / P - 1.0);
    float n = mix(gas(r, phi - omega * t2 * 2.5), gas(r, phi - omega * t1 * 2.5), w1);

    float density = smoothstep(0.38, 0.95, n);
    float edge = smoothstep(R_IN, R_IN + 0.5, r) * smoothstep(R_OUT, R_OUT * 0.55, r);

    // thin-disk temperature profile (Novikov–Thorne shape), peak ≈ r 4.1
    float prof = pow(r / R_IN, -0.75) * pow(max(1.0 - sqrt(R_IN / r), 0.0), 0.25) / 0.488;

    // relativistic Doppler + gravitational redshift
    float v = sqrt(0.5 / (r - 1.0));
    vec3 vdir = normalize(vec3(-p.z, 0.0, p.x));
    float gamma = inversesqrt(1.0 - v * v);
    float dop = 1.0 / (gamma * (1.0 - v * dot(vdir, -rayDir)));
    float g = dop * sqrt(1.0 - 1.0 / r);

    float temp = uDiskTemp * prof * g;
    float intensity = pow(prof, 4.0) * pow(g, 4.0 * uBeaming);

    vec3 emit = blackbody(temp) * intensity * (0.25 + density * 1.5) * 1.6;
    float alpha = clamp((0.25 + density * 0.9) * edge, 0.0, 1.0);
    return vec4(emit * edge, alpha);
  }

  // ── background sky ──────────────────────────────────────────────────────
  // stars live on a cube-map grid (one 2D grid per face) and each pixel checks its
  // 3×3 neighbourhood, so a star is never clipped by a cell edge into a sliver
  vec3 starLayer(vec3 d, float scale, float density) {
    vec3 a = abs(d);
    vec2 uv; float face;
    if (a.x >= a.y && a.x >= a.z) { uv = d.yz / a.x; face = d.x > 0.0 ? 0.0 : 1.0; }
    else if (a.y >= a.z)          { uv = d.xz / a.y; face = d.y > 0.0 ? 2.0 : 3.0; }
    else                          { uv = d.xy / a.z; face = d.z > 0.0 ? 4.0 : 5.0; }

    vec2 g = uv * scale;
    vec2 id = floor(g);
    vec3 c = vec3(0.0);
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 cell = id + vec2(float(x), float(y));
        vec3 key = vec3(cell, face * 131.0 + scale);
        if (hash13(key) < 1.0 - density) continue;
        vec2 sp = cell + 0.5 + (vec2(hash13(key + 7.1), hash13(key + 3.3)) - 0.5) * 0.8;
        vec2 o = g - sp;
        float core = exp(-dot(o, o) * 110.0);
        float mag = pow(hash13(key + 11.0), 8.0) * 4.5 + 0.18;
        c += blackbody(mix(3200.0, 14000.0, hash13(key + 5.0))) * core * mag;
      }
    }
    return c;
  }

  vec3 sky(vec3 d) {
    vec3 c = starLayer(d, 60.0, 0.03) + starLayer(d, 140.0, 0.025) * 0.5 + starLayer(d, 300.0, 0.02) * 0.3;

    // faint galactic band and violet dust so the void isn't a flat black
    vec3 axis = normalize(vec3(0.35, 1.0, 0.25));
    float band = exp(-pow(dot(d, axis), 2.0) * 9.0);
    float dust = fbm(d * 3.2 + 4.0);
    float lanes = smoothstep(0.35, 0.7, fbm(d * 7.0));
    c += band * (vec3(0.16, 0.10, 0.30) * dust + vec3(0.05, 0.06, 0.10) * lanes) * 0.07;
    c += vec3(0.05, 0.02, 0.10) * fbm(d * 1.6 - 2.0) * 0.04;
    return c;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0 + vec2(0.0, uShift);
    vec3 dir = normalize(uCamBasis * vec3(uv * uFov, 1.0));

    vec3 pos = uCamPos;
    vec3 vel = dir;
    vec3 hv = cross(pos, vel);
    float h2 = dot(hv, hv);

    // the march only records where the ray pierces the disk plane — shading those
    // hits inside the loop would inline the noise into every step and blow up compile
    // times (some drivers unroll the whole loop)
    vec3 hitP0 = vec3(0.0), hitP1 = vec3(0.0), hitP2 = vec3(0.0);
    vec3 hitV0 = vec3(0.0), hitV1 = vec3(0.0), hitV2 = vec3(0.0);
    int hits = 0;
    bool captured = false;

    for (int i = 0; i < STEPS; i++) {
      float r = length(pos);
      if (r > 40.0 && dot(pos, vel) > 0.0) break;            // escaped to the sky
      float dt = clamp(0.09 * (r - 0.85) * (r - 0.85), 0.012, 1.1);

      vec3 prev = pos;
      vel += -1.5 * h2 * pos / (r * r * r * r * r) * dt;
      pos += vel * dt;

      if (prev.y * pos.y < 0.0) {                           // crossed the disk plane
        vec3 hit = mix(prev, pos, prev.y / (prev.y - pos.y));
        float hr = length(hit.xz);
        if (hr > R_IN && hr < R_OUT) {
          if (hits == 0)      { hitP0 = hit; hitV0 = vel; }
          else if (hits == 1) { hitP1 = hit; hitV1 = vel; }
          else                { hitP2 = hit; hitV2 = vel; }
          hits++;
          if (hits == 3) break;
        }
      }

      if (dot(pos, pos) < 1.0) { captured = true; break; }  // fell through the horizon
    }

    // composite disk crossings front to back (first hit is nearest the camera)
    vec3 col = vec3(0.0);
    float cover = 0.0;
    for (int k = 0; k < 3; k++) {
      if (k >= hits) break;
      vec3 hp = k == 0 ? hitP0 : (k == 1 ? hitP1 : hitP2);
      vec3 hd = k == 0 ? hitV0 : (k == 1 ? hitV1 : hitV2);
      vec4 d = disk(hp, normalize(hd));
      col += (1.0 - cover) * d.rgb * d.a;
      cover += (1.0 - cover) * d.a;
    }

    if (!captured && hits < 3) col += (1.0 - cover) * sky(normalize(vel));

    // lens vignette, then a touch of grain to break up banding in the dark falloff
    float vig = smoothstep(1.9, 0.4, length(uv * vec2(0.85, 1.0)));
    col *= mix(0.55, 1.0, vig);
    col += (hash13(vec3(gl_FragCoord.xy, uTime * 60.0)) - 0.5) * 0.004;

    gl_FragColor = vec4(max(col, 0.0) * uExposure, 1.0);
  }
`
