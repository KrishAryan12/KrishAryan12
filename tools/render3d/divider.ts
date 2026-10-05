/**
 * Section break: a slim 3D strip of the same grid.
 *
 * 4 s seamless loop: a cyan light cycle streaks left to right leaving a glowing wall; on the way it
 * passes an orange incident node, which flips to cyan with a ring pulse (resolved). The trail then
 * dissolves and a new incident fades in, ready for the next pass.
 *
 * Deterministic like the hero: window.renderFrame(t).
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Path2, Trail, makeCycle, smooth } from './scene.ts';

export interface DividerOptions {
  width: number;
  height: number;
  loop?: number;
  colors?: { void: string; cyan: string; cyanMid: string; orange: string };
}

export function createDividerScene(canvas: HTMLCanvasElement, opts: DividerOptions) {
  const col = { void: '#04070D', cyan: '#66F6FF', cyanMid: '#18C8E0', orange: '#FF7A18', ...opts.colors };
  const LOOP = opts.loop ?? 4;
  const cyan = new THREE.Color(col.cyan);
  const cyanMid = new THREE.Color(col.cyanMid);
  const orange = new THREE.Color(col.orange);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(opts.width, opts.height, false);
  renderer.setClearColor(new THREE.Color(col.void).convertSRGBToLinear(), 1);
  const scene = new THREE.Scene();
  // A long, low view down the strip: wide aspect, narrow vertical field.
  const camera = new THREE.PerspectiveCamera(14, opts.width / opts.height, 0.1, 300);
  camera.position.set(0, 3.0, 23);
  camera.lookAt(0, 0.3, 0);

  // Floor grid, fading towards the edges of the strip.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 30),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: cyanMid } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 uColor; varying vec3 vW;
        float line(float c, float w){ float d = abs(fract(c-0.5)-0.5)/fwidth(c); return 1.0-min(d/w,1.0); }
        void main(){
          float g = max(line(vW.x/1.2,1.0), line(vW.z/1.2,1.0));
          float fadeX = 1.0 - smoothstep(14.0, 24.0, abs(vW.x));
          float fadeZ = 1.0 - smoothstep(2.0, 9.0, abs(vW.z));
          gl_FragColor = vec4(uColor, g*0.38*fadeX*fadeZ);
        }`,
      transparent: true,
      depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // The lane the cycle rides: a faint bright line.
  const lane = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 0.05),
    new THREE.MeshBasicMaterial({ color: cyanMid, transparent: true, opacity: 0.5 }),
  );
  lane.rotation.x = -Math.PI / 2;
  lane.position.y = 0.005;
  scene.add(lane);

  const path = new Path2([new THREE.Vector2(-26, 0), new THREE.Vector2(26, 0)]);
  const cycle = makeCycle(cyan);
  const trail = new Trail(cyan, 0.55);
  scene.add(cycle, trail.mesh);

  // Incident node: a small octahedron that is orange until the cycle passes, then cyan.
  const NODE_X = 3.5;
  const nodeMat = new THREE.MeshBasicMaterial({ color: orange.clone(), transparent: true });
  const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), nodeMat);
  node.position.set(NODE_X, 0.75, -0.9);
  scene.add(node);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.5, 48),
    new THREE.MeshBasicMaterial({ color: cyan, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  ring.position.copy(node.position);
  scene.add(ring);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(opts.width, opts.height);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(opts.width, opts.height), 0.55, 0.15, 0.45));
  composer.addPass(new OutputPass());

  const T_RUN = 2.7; // the cycle crosses the whole strip in this time
  function renderFrame(tRaw: number) {
    const t = ((tRaw % LOOP) + LOOP) % LOOP;
    const s = (t / T_RUN) * path.length;
    const { p, dir } = path.at(Math.min(s, path.length));
    cycle.position.set(p.x, 0, p.y);
    cycle.rotation.y = Math.atan2(-dir.y, dir.x);
    cycle.visible = t < T_RUN;
    const fade = 1 - smooth(T_RUN, T_RUN + 0.8, t);
    trail.set(path.slice(Math.max(0, Math.min(s, path.length) - 16), Math.min(s, path.length)), fade);

    // The node resolves when the cycle passes it.
    const passAt = ((NODE_X + 26) / path.length) * T_RUN;
    const resolved = t >= passAt && t < 3.55;
    nodeMat.color.copy(resolved ? cyan : orange);
    const appear = t >= 3.55 ? smooth(3.55, 3.95, t) : 1; // a fresh incident fades in before the loop restarts
    nodeMat.opacity = t >= 3.55 ? appear : resolved ? 1 - smooth(3.0, 3.5, t) : 1;
    node.rotation.y = (t / LOOP) * Math.PI * 2;
    node.scale.setScalar(t >= 3.55 ? 0.6 + 0.4 * appear : 1);
    // One expanding ring at the moment of resolution.
    const rt = t - passAt;
    const ringOn = rt > 0 && rt < 0.7;
    ring.visible = ringOn;
    if (ringOn) {
      ring.scale.setScalar(1 + rt * 4);
      (ring.material as THREE.MeshBasicMaterial).opacity = 1 - rt / 0.7;
    }
    composer.render();
  }
  return { renderFrame, loop: LOOP };
}

declare global {
  interface Window {
    __DIVIDER__?: DividerOptions;
  }
}

if (typeof window !== 'undefined' && window.__DIVIDER__) {
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const s = createDividerScene(canvas, window.__DIVIDER__);
  window.renderFrame = s.renderFrame;
  window.__READY__ = true;
}
