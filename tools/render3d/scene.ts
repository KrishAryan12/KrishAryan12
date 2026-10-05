/**
 * The hero scene: "The Grid, but it's production".
 *
 * Story, 8 s, seamless loop:
 *   0.0–3.0  an orange cycle (an incident) streaks across the grid
 *   1.2–3.0  a cyan cycle (the agent) turns and cuts it off
 *   3.0–4.6  both trails dissolve into particles: the page is auto-resolved
 *   3.9–5.4  the title powers on
 *   5.4–7.1  hold
 *   7.1–8.0  title powers down; the scene returns to its first frame
 * A second cyan cycle runs in the far lane the whole time (healthy traffic).
 *
 * Deterministic: everything is a pure function of t, exposed as window.renderFrame(t).
 * Reusable: createGridScene() takes a canvas and options, so the portfolio can mount it live.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export interface TitleGlyphs {
  /** SVG path data per glyph for the title, drawn at 100 units per em, y down. */
  d: string[];
  width: number;
  /** Optional subtitle glyph paths, same convention. */
  subD?: string[];
  subWidth?: number;
}

export interface GridSceneOptions {
  width: number;
  height: number;
  title: TitleGlyphs;
  loop?: number;
  /**
   * Camera dolly amplitude (0 = locked). The recorded GIF/WebP keeps the camera locked because a
   * moving grid changes every pixel of every frame and multiplies file size; live use can turn it on.
   */
  cameraDrift?: number;
  colors?: { void: string; cyan: string; cyanMid: string; orange: string; white: string };
}

const DEFAULT_COLORS = { void: '#04070D', cyan: '#66F6FF', cyanMid: '#18C8E0', orange: '#FF7A18', white: '#E8FAFF' };

// ---------- small deterministic helpers ----------
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A polyline path in the XZ plane with arc-length lookup. */
class Path2 {
  private seg: number[] = [0];
  readonly length: number;
  constructor(readonly pts: THREE.Vector2[]) {
    for (let i = 1; i < pts.length; i++) this.seg.push(this.seg[i - 1]! + pts[i]!.distanceTo(pts[i - 1]!));
    this.length = this.seg[this.seg.length - 1]!;
  }
  at(s: number): { p: THREE.Vector2; dir: THREE.Vector2 } {
    s = Math.min(Math.max(s, 0), this.length);
    let i = 1;
    while (i < this.seg.length - 1 && this.seg[i]! < s) i++;
    const a = this.pts[i - 1]!;
    const b = this.pts[i]!;
    const t = (s - this.seg[i - 1]!) / Math.max(1e-6, this.seg[i]! - this.seg[i - 1]!);
    return { p: a.clone().lerp(b, t), dir: b.clone().sub(a).normalize() };
  }
  /** Points from arc length s0 to s1, including corners. */
  slice(s0: number, s1: number, step = 0.25): THREE.Vector2[] {
    const out: THREE.Vector2[] = [];
    if (s1 <= s0) return out;
    for (let s = s0; s < s1; s += step) out.push(this.at(s).p);
    out.push(this.at(s1).p);
    return out;
  }
}

/** Vertical light wall that follows a path: the light-cycle trail. */
class Trail {
  readonly mesh: THREE.Mesh;
  private geo = new THREE.BufferGeometry();
  private max = 400;
  private pos = new Float32Array(this.max * 2 * 3);
  private alpha = new Float32Array(this.max * 2);
  constructor(color: THREE.Color, private height: number) {
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('a', new THREE.BufferAttribute(this.alpha, 1));
    const idx: number[] = [];
    for (let i = 0; i < this.max - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.geo.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: color }, uOpacity: { value: 1 } },
      vertexShader: `attribute float a; varying float vA; varying float vY; void main(){ vA=a; vY=position.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vA; varying float vY;
        void main(){ float h = clamp(vY/${this.height.toFixed(3)},0.0,1.0); float edge = smoothstep(0.0,0.08,1.0-h);
          float core = 0.55 + 0.45*smoothstep(0.75,1.0,h);
          gl_FragColor = vec4(uColor*(0.35+0.75*core), vA*uOpacity*edge*(0.18+0.5*core)); }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geo, mat);
    this.mesh.frustumCulled = false;
  }
  set(points: THREE.Vector2[], opacity: number) {
    const n = Math.min(points.length, this.max);
    for (let i = 0; i < this.max; i++) {
      const p = points[Math.min(i, n - 1)] ?? new THREE.Vector2();
      const k = i * 6;
      this.pos.set([p.x, 0, p.y, p.x, this.height, p.y], k);
      // Fade the tail end of the wall.
      const a = n > 1 ? smooth(0, 0.25, i / (n - 1)) : 0;
      this.alpha[i * 2] = i < n ? a : 0;
      this.alpha[i * 2 + 1] = i < n ? a : 0;
    }
    this.geo.attributes.position!.needsUpdate = true;
    this.geo.attributes.a!.needsUpdate = true;
    this.geo.setDrawRange(0, Math.max(0, n - 1) * 6);
    (this.mesh.material as THREE.ShaderMaterial).uniforms.uOpacity!.value = opacity;
  }
}

/** A generic light cycle: a low glowing wedge. Deliberately not a copy of any film prop. */
function makeCycle(color: THREE.Color): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.32, 0.28),
    new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(0.25) }),
  );
  body.position.y = 0.22;
  g.add(body);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    new THREE.LineBasicMaterial({ color: color.clone() }),
  );
  edges.position.copy(body.position);
  g.add(edges);
  for (const x of [-0.34, 0.34]) {
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.035, 8, 24),
      new THREE.MeshBasicMaterial({ color: color.clone() }),
    );
    wheel.position.set(x, 0.16, 0);
    g.add(wheel);
  }
  return g;
}

export function createGridScene(canvas: HTMLCanvasElement, opts: GridSceneOptions) {
  const col = { ...DEFAULT_COLORS, ...opts.colors };
  const LOOP = opts.loop ?? 8;
  const cyan = new THREE.Color(col.cyan);
  const cyanMid = new THREE.Color(col.cyanMid);
  const orange = new THREE.Color(col.orange);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(opts.width, opts.height, false);
  // The composer's render target re-encodes the clear colour, so pass it pre-linearised
  // to land exactly on the void token in the output.
  renderer.setClearColor(new THREE.Color(col.void).convertSRGBToLinear(), 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(col.void), 18, 46);
  const camera = new THREE.PerspectiveCamera(34, opts.width / opts.height, 0.1, 200);

  // ---------- floor grid with distance fade ----------
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: cyanMid }, uFogFar: { value: 44 } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uFogFar; varying vec3 vW;
        float line(float c, float w){ float d = abs(fract(c-0.5)-0.5)/fwidth(c); return 1.0-min(d/w,1.0); }
        void main(){
          float g = max(line(vW.x/1.5,1.0), line(vW.z/1.5,1.0));
          float G = max(line(vW.x/7.5,1.4), line(vW.z/7.5,1.4));
          float dist = length(vW.xz - cameraPosition.xz);
          float fade = 1.0 - smoothstep(6.0, uFogFar, dist);
          float a = (g*0.22 + G*0.42) * fade;
          gl_FragColor = vec4(uColor, a);
        }`,
      transparent: true,
      depthWrite: false,
      extensions: { derivatives: true } as never,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // ---------- horizon glow ----------
  const horizon = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 16),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: cyanMid } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `uniform vec3 uColor; varying vec2 vUv; void main(){ float y = vUv.y; float a = exp(-pow((y-0.08)*7.0,2.0))*0.22 + exp(-pow((y-0.06)*40.0,2.0))*0.35; float x = 1.0 - pow(abs(vUv.x-0.5)*2.0, 3.0); gl_FragColor = vec4(uColor, a*x); }`,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  horizon.position.set(0, 0.6, -40);
  scene.add(horizon);

  // ---------- identity-disc ring (background, slow rotation with 12-fold symmetry) ----------
  const ring = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: cyanMid.clone().multiplyScalar(0.55), transparent: true, opacity: 0.4, fog: false });
  ring.add(new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.035, 8, 160), ringMat));
  ring.add(new THREE.Mesh(new THREE.TorusGeometry(6.9, 0.018, 8, 160), ringMat));
  for (let i = 0; i < 12; i++) {
    const seg = new THREE.Mesh(new THREE.RingGeometry(7.1, 7.35, 24, 1, (i / 12) * Math.PI * 2, (Math.PI * 2) / 12 * 0.62), ringMat);
    ring.add(seg);
  }
  ring.position.set(0, 3.4, -12);
  scene.add(ring);

  // ---------- title ----------
  const loader = new SVGLoader();
  const makeText = (glyphs: string[], width: number, worldWidth: number, depth: number) => {
    // One <path> per glyph so hole detection never spans two letters.
    const shapes = glyphs.flatMap((d, i) => {
      try {
        const data = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
        return data.paths.flatMap((p) => SVGLoader.createShapes(p));
      } catch (e) {
        throw new Error(`glyph ${i} failed (${d.slice(0, 40)}): ${(e as Error).message}`);
      }
    });
    const geo = depth > 0
      ? new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 0.8, bevelSegments: 2, curveSegments: 6 })
      : new THREE.ShapeGeometry(shapes, 6);
    const s = worldWidth / width;
    geo.scale(s, -s, s);
    geo.translate(-worldWidth / 2, 0, 0);
    return geo;
  };
  const titleGroup = new THREE.Group();
  const faceMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(col.white), transparent: true });
  const FACE = new THREE.Color('#9FEFF7');
  const sideMat = new THREE.MeshBasicMaterial({ color: cyanMid.clone().multiplyScalar(0.35), transparent: true });
  const titleGeo = makeText(opts.title.d, opts.title.width, 19, 10);
  const title = new THREE.Mesh(titleGeo, [faceMat, sideMat]);
  titleGroup.add(title);
  const titleEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(titleGeo, 30),
    new THREE.LineBasicMaterial({ color: cyan.clone(), transparent: true }),
  );
  titleGroup.add(titleEdges);
  let sub: THREE.Mesh | null = null;
  if (opts.title.subD && opts.title.subWidth) {
    const subGeo = makeText(opts.title.subD, opts.title.subWidth, 12.5, 0);
    sub = new THREE.Mesh(subGeo, new THREE.MeshBasicMaterial({ color: cyan, transparent: true, side: THREE.DoubleSide }));
    sub.position.set(0, -1.15, 0.2);
    titleGroup.add(sub);
  }
  titleGroup.position.set(0, 4.05, -3.2);
  scene.add(titleGroup);
  // Scan line that sweeps the title as it powers on.
  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 3.4),
    new THREE.MeshBasicMaterial({ color: cyan.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  scan.position.set(0, 3.5, -2.9);
  scene.add(scan);

  // ---------- cycles and trails ----------
  const v = (x: number, z: number) => new THREE.Vector2(x, z);
  const T_IMPACT = 3.0;
  // Orange: left to right along z = -1.2, stopped by the cyan wall at x = 2.
  const orangePath = new Path2([v(-30, -1.2), v(2.0, -1.2)]);
  // Cyan agent: comes from the right along z = 1.6, turns up at x = 2 and cuts across.
  const cyanPath = new Path2([v(26, 1.6), v(2.0, 1.6), v(2.0, -8)]);
  // Background healthy traffic: crosses the far lane once per loop.
  const farPath = new Path2([v(-34, -12), v(34, -12)]);
  const oCycle = makeCycle(orange);
  const cCycle = makeCycle(cyan);
  const fCycle = makeCycle(cyanMid);
  const oTrail = new Trail(orange, 0.75);
  const cTrail = new Trail(cyan, 0.75);
  const fTrail = new Trail(cyanMid, 0.6);
  scene.add(oCycle, cCycle, fCycle, oTrail.mesh, cTrail.mesh, fTrail.mesh);

  // ---------- dissolve particles ----------
  const N = 900;
  const rand = mulberry32(7);
  const pBase = new Float32Array(N * 3);
  const pVel = new Float32Array(N * 3);
  const pCol = new Float32Array(N * 3);
  const pPos = new Float32Array(N * 3);
  const oSlice = orangePath.slice(orangePath.length - 12, orangePath.length, 0.05);
  const cSlice = cyanPath.slice(cyanPath.at(0).p.distanceTo(v(2.0, 1.6)) - 10, cyanPath.at(0).p.distanceTo(v(2.0, 1.6)) + 4.5, 0.05);
  for (let i = 0; i < N; i++) {
    const fromOrange = i % 2 === 0;
    const src = fromOrange ? oSlice : cSlice;
    const p = src[Math.floor(rand() * src.length)]!;
    pBase.set([p.x, rand() * 0.75, p.y], i * 3);
    pVel.set([(rand() - 0.5) * 1.2, 0.6 + rand() * 1.6, (rand() - 0.5) * 1.2], i * 3);
    const c = fromOrange ? orange : cyan;
    pCol.set([c.r, c.g, c.b], i * 3);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const particles = new THREE.Points(pGeo, pMat);
  particles.frustumCulled = false;
  scene.add(particles);

  // ---------- post ----------
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(opts.width, opts.height);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(opts.width, opts.height), 0.6, 0.4, 0.55);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const placeCycle = (g: THREE.Group, path: Path2, s: number) => {
    const { p, dir } = path.at(s);
    g.position.set(p.x, 0, p.y);
    g.rotation.y = Math.atan2(-dir.y, dir.x);
  };

  function renderFrame(tRaw: number) {
    const t = ((tRaw % LOOP) + LOOP) % LOOP;

    // Camera: gentle seamless dolly and drift.
    const ph = (t / LOOP) * Math.PI * 2;
    const k = opts.cameraDrift ?? 0;
    camera.position.set(Math.sin(ph) * 0.6 * k, 2.7 + Math.sin(ph) * 0.08 * k, 13.2 + Math.cos(ph) * 0.45 * k);
    camera.lookAt(0, 2.3, -3);

    ring.rotation.z = -(t / LOOP) * ((Math.PI * 2) / 12);

    // Orange incident: runs until impact, trail hangs, then dissolves.
    const oSpeed = orangePath.length / T_IMPACT;
    const oS = Math.min(t, T_IMPACT) * oSpeed;
    const dissolve = smooth(T_IMPACT, T_IMPACT + 0.9, t);
    const reset = t > 4.8 ? 0 : 1;
    placeCycle(oCycle, orangePath, oS);
    oCycle.visible = t < T_IMPACT + 0.05 && t > 0.02;
    oTrail.set(orangePath.slice(Math.max(0, oS - 22), oS), (1 - dissolve) * reset * smooth(0.0, 0.25, t));

    // Cyan agent: starts at 1.2 s, reaches the corner before the orange arrives, keeps going.
    const turnS = cyanPath.at(0).p.distanceTo(v(2.0, 1.6));
    const cStart = 1.2;
    const cReachCorner = 2.35;
    const cSpeed = turnS / (cReachCorner - cStart);
    const cS = Math.max(0, t - cStart) * cSpeed;
    placeCycle(cCycle, cyanPath, Math.min(cS, cyanPath.length));
    cCycle.visible = t > cStart && cS < turnS + 6.0;
    const cFade = smooth(T_IMPACT, T_IMPACT + 0.9, t);
    cTrail.set(cyanPath.slice(Math.max(0, cS - 18), Math.min(cS, turnS + 6.0)), (1 - cFade) * reset);

    // Far lane: constant, wraps exactly once per loop.
    const fS = (t / LOOP) * farPath.length;
    placeCycle(fCycle, farPath, fS);
    fTrail.set(farPath.slice(Math.max(0, fS - 14), fS), 0.8);

    // Particles rise and fade between impact and 4.6 s.
    const pt = t - T_IMPACT;
    const pOn = pt > 0 && pt < 1.8;
    particles.visible = pOn;
    if (pOn) {
      for (let i = 0; i < N; i++) {
        const k = i * 3;
        pPos[k] = pBase[k]! + pVel[k]! * pt;
        pPos[k + 1] = pBase[k + 1]! + pVel[k + 1]! * pt - 0.35 * pt * pt;
        pPos[k + 2] = pBase[k + 2]! + pVel[k + 2]! * pt;
      }
      pGeo.attributes.position!.needsUpdate = true;
      pMat.opacity = 1 - smooth(0.4, 1.8, pt);
    }

    // Title: powers on with a left-to-right sweep, holds, powers down before the loop ends.
    const on = smooth(3.9, 5.2, t) * (1 - smooth(7.1, 7.9, t));
    const sweep = smooth(3.9, 5.0, t);
    faceMat.opacity = on;
    sideMat.opacity = on * 0.9;
    (titleEdges.material as THREE.LineBasicMaterial).opacity = Math.min(1, on * 1.4) * (1 - smooth(7.1, 7.9, t));
    if (sub) (sub.material as THREE.MeshBasicMaterial).opacity = smooth(4.8, 5.6, t) * (1 - smooth(7.1, 7.9, t));
    const scanOn = t > 3.85 && t < 5.1;
    scan.visible = scanOn;
    scan.position.x = -10 + sweep * 20;
    (scan.material as THREE.MeshBasicMaterial).opacity = scanOn ? Math.sin(Math.PI * clamp01((t - 3.85) / 1.25)) : 0;
    // Brighter faces while powered: bloom picks this up.
    faceMat.color.copy(FACE).multiplyScalar(0.75 + 0.25 * on);

    composer.render();
  }

  return { renderFrame, renderer, scene, camera, loop: LOOP };
}

declare global {
  interface Window {
    renderFrame?: (t: number) => void;
    __HERO__?: GridSceneOptions;
    __READY__?: boolean;
  }
}

// Recorder entry point: the page sets window.__HERO__ before loading this bundle.
if (typeof window !== 'undefined' && window.__HERO__) {
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const s = createGridScene(canvas, window.__HERO__);
  window.renderFrame = s.renderFrame;
  window.__READY__ = true;
}
