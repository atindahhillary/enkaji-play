// Animated 3D story scenes. One shot per story page; characters and animals move procedurally.
// createPlayer(el) -> { show(storyId, page), dispose() }.  STORY_COVERS for the studio renders.
import { THREE, person, cow, sheep, goat, acacia, hut, boma, brick, maize, ground, lights, walk, idle, wave, clay } from './models.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEX = { r: '#E53935', o: '#FB8C00', g: '#43A047', b: '#1E88E5', p: '#29B6F6', y: '#FDD835' };
const SKIES = { day: ['#7cc8f5', '#e8f6ff'], dawn: ['#f7a07a', '#ffe6c4'], sunset: ['#f2703a', '#ffd08a'], night: ['#101a3d', '#34457e'] };
const GROUND = { day: '#d6bf73', dawn: '#cdb06a', sunset: '#b99952', night: '#4a5236' };

// Cast (same presets as the 2D stories)
const mama = () => person({ kind: 'woman', wrap: '#c62828', collar: ['#E53935', '#ffffff', '#1E88E5', '#FDD835'] });
const naserian = () => person({ kind: 'girl', wrap: '#1E88E5', collar: ['#FDD835', '#ffffff', '#E53935'] });
const lemayian = () => person({ kind: 'boy', wrap: '#E53935', collar: ['#1E88E5', '#ffffff'] });
const koko = () => person({ kind: 'elder', wrap: '#0277BD', collar: ['#ffffff', '#E53935', '#43A047', '#FDD835'] });
const calf = () => { const c = cow('#f2efe6', { muzzle: '#e8c4b0', patch: '#8d5524', patches: [[.05, .95, .25, .14]] }); c.scale.setScalar(.55); return c; };

function skyTexture(sky) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256); grad.addColorStop(0, SKIES[sky][0]); grad.addColorStop(1, SKIES[sky][1]);
  g.fillStyle = grad; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// A fresh scene with sky, savanna ground, sun or moon and lighting.
function stage(sky = 'day') {
  const scene = new THREE.Scene();
  scene.background = skyTexture(sky);
  scene.fog = new THREE.Fog(SKIES[sky][1], 16, 42);
  scene.add(ground(GROUND[sky]));
  lights(scene, sky);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(sky === 'night' ? 1.2 : 2, 32), new THREE.MeshBasicMaterial({ color: sky === 'night' ? '#fff6c9' : sky === 'day' ? '#ffe680' : '#ff7a3d', fog: false }));
  disc.position.set(sky === 'day' ? 12 : 4, sky === 'day' || sky === 'night' ? 12 : 4, -35); scene.add(disc);
  if (sky === 'night') {
    const g = new THREE.BufferGeometry(), p = [];
    for (let i = 0; i < 300; i++) p.push((Math.random() - .5) * 80, 8 + Math.random() * 20, -30 - Math.random() * 10);
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: .12, fog: false })));
  }
  // distant acacias for depth
  [[-14, -18, 1.4], [16, -22, 1.7], [-6, -26, 1.2], [9, -15, 1]].forEach(([x, z, s]) => { const a = acacia(s); a.position.set(x, 0, z); scene.add(a); });
  return scene;
}
const put = (scene, obj, x, z, ry = 0, y = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; scene.add(obj); return obj; };
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

function fire(scene, x, z) {
  const f = new THREE.Group();
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, .6, 6), clay('#4e342e')); l.rotation.set(Math.PI / 2.3, i * 1.25, 0); l.position.y = .08; f.add(l); }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 12), new THREE.MeshBasicMaterial({ color: '#ffa726' })); flame.position.y = .35; f.add(flame);
  const light = new THREE.PointLight('#ff9e40', 6, 8); light.position.y = .6; f.add(light);
  put(scene, f, x, z);
  return t => { flame.scale.set(1 + Math.sin(t * 13) * .08, 1 + Math.sin(t * 9) * .15, 1); light.intensity = 5 + Math.sin(t * 17) * 1.2; };
}
function river(scene) {
  const m = new THREE.MeshStandardMaterial({ color: '#4fc3f7', roughness: .15, metalness: .1, emissive: '#0d47a1', emissiveIntensity: .15 });
  const r = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.4, 1, 1), m); r.rotation.x = -Math.PI / 2; r.position.set(0, .02, -1.5); r.receiveShadow = true; scene.add(r);
  return t => { m.emissiveIntensity = .15 + Math.sin(t * 2) * .05; };
}
function rain(scene) {
  const n = 600, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * 14; p[i * 3 + 1] = Math.random() * 8; p[i * 3 + 2] = (Math.random() - .5) * 8; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#e1f5fe', size: .1, transparent: true, opacity: .95 })));
  return (t, dt) => { for (let i = 0; i < n; i++) { p[i * 3 + 1] -= dt * 7; if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 8; } g.attributes.position.needsUpdate = true; };
}
// A brick that drops in with a bounce at time `at`.
function dropBrick(scene, color, x, z, at, y0 = 0, s = 1) {
  const b = put(scene, brick(HEX[color] || color, s), x, z, 0, y0);
  return t => { const k = ease((t - at) / .5); b.visible = t >= at; b.position.y = y0 + (1 - k) * 2.5 + Math.sin(Math.min(1, Math.max(0, (t - at - .5) / .3)) * Math.PI) * .06; };
}

// ---------- Shots: one per story page ----------
// Each returns { sky, cam, look, drift, build(scene) -> update(t, dt) }
const SHOTS = {
  'six-bricks': [
    { sky: 'dawn', cam: [1.5, 1.6, 7], look: [0, 1, 0], drift: [-.08, 0, -.12], build(s) {
      put(s, hut(1.3), -1.8, -2.5, .4); put(s, acacia(1.2), 3.5, -4); put(s, boma(5, 1.1), 0, -2.5, -Math.PI / 2);
      const n = put(s, naserian(), -1.5, -1.2, .6), g = put(s, goat(), 2.2, -.5, -2.4);
      return t => { const k = Math.min(t / 4, 1); n.position.set(lerp(-1.5, .2, k), 0, lerp(-1.2, 1.2, k)); k < 1 ? walk(n, t) : (wave(n, t), idle(n, t)); idle(g, t); }; } },
    { sky: 'day', cam: [0, 1.4, 4.2], look: [0, .9, 0], drift: [.05, 0, -.06], build(s) {
      put(s, hut(1.2), 2.6, -3, -.5); put(s, acacia(1), -3.5, -3);
      const m = put(s, mama(), -.55, 0, .5), n = put(s, naserian(), .55, 0, -.5);
      const pouch = put(s, new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), clay('#c62828', .6)), -.2, .25, 0, .95);
      const tick = Object.keys(HEX).map((c, i) => { const b = put(s, brick(HEX[c], .45), 0, .25, 0, 1); return t => { const k = ease((t - 1.2 - i * .3) / .6); b.visible = k > 0; b.position.set(lerp(0, -.45 + i * .18, k), lerp(1, 1.45 + Math.sin(k * Math.PI) * .25, k), .3); b.rotation.y = k * Math.PI * 2; }; });
      return t => { idle(m, t); idle(n, t, 1); m.userData.arms[1].rotation.x = -.9; pouch.position.x = lerp(-.2, .1, ease(t / 1)); tick.forEach(f => f(t)); }; } },
    { sky: 'day', cam: [0, .8, 2.6], look: [0, .25, 0], drift: [.15, 0, 0], build(s) {
      const n = put(s, naserian(), 0, -1.2);
      const bricks = Object.keys(HEX).map((c, i) => put(s, brick(HEX[c], .9), -1.05 + i * .42, .2));
      return t => { idle(n, t); bricks.forEach((b, i) => { const ph = (t * 1.2 - i * .35) % 3; b.position.y = ph > 0 && ph < .5 ? Math.sin(ph / .5 * Math.PI) * .25 : 0; }); }; } },
    { sky: 'day', cam: [1.8, 1.4, 4.2], look: [0, .5, -.5], drift: [-.08, 0, 0], build(s) {
      put(s, boma(1.8, .7), .9, -1.2, -Math.PI / 2);
      const k = put(s, koko(), -2, 0, .7), n = put(s, naserian(), -.9, .6, .4);
      const drops = ['r', 'o', 'g'].map((c, i) => dropBrick(s, c, .3 + i * .5, -1 + (i % 2) * .4, .8 + i * .9, 0, .9));
      return t => { idle(k, t); wave(n, t); drops.forEach(f => f(t)); }; } },
    { sky: 'sunset', cam: [5.5, 2, 5.5], look: [0, .8, -1], drift: [-.12, 0, -.05], build(s) {
      put(s, boma(3, .7), 0, -1.5, 0);
      const n = put(s, naserian(), -2.2, 1.5, .9);
      const cows = [['#8d5524'], ['#f2efe6', { muzzle: '#e8c4b0' }], ['#2b1d16']].map(([c, o], i) => ({ c: put(s, cow(c, { ...o, bell: i === 0 }), 9, -1.5 + (i - 1) * .9, Math.PI), at: i * 1.6 }));
      return t => { idle(n, t); n.userData.arms[1].rotation.x = -1.4; cows.forEach(({ c, at }, i) => { const k = Math.min(Math.max((t - at) / 4, 0), 1); c.position.x = lerp(9, -1 + i * 1.1, ease(k)); k < 1 && k > 0 ? walk(c, t, 5, .35) : idle(c, t, i); }); }; } },
    { sky: 'night', cam: [0, 1.5, 5.2], look: [0, .8, 0], drift: [0, 0, -.1], build(s) {
      put(s, hut(1.4), 0, -3.5);
      const tickFire = fire(s, 0, .4);
      const m = put(s, mama(), -1.1, -.2, .7), n = put(s, naserian(), 1, -.1, -.7), baby = put(s, lemayian(), .5, .9, -2.5); baby.scale.setScalar(.45);
      const b = ['r', 'b', 'y'].map((c, i) => put(s, brick(HEX[c], .6), .1 + i * .22, 1.3, .2));
      return t => { tickFire(t); idle(m, t); idle(n, t, 2); idle(baby, t, 4); b.forEach((x, i) => x.position.y = Math.abs(Math.sin(t * 2 + i)) * .05); }; } },
  ],
  'lost-calf': [
    { sky: 'day', cam: [3, 1.8, 6], look: [0, .8, -1], drift: [-.08, 0, 0], build(s) {
      put(s, boma(2.5, .8), -.5, -1.5, -Math.PI / 2); const m = put(s, cow('#8d5524'), -.8, -1.5, .4), l = put(s, lemayian(), 1.8, .8, -.6);
      return t => { idle(m, t); idle(l, t); l.userData.head.rotation.y = Math.sin(t * 1.5) * .8; }; } },
    { sky: 'day', cam: [0, 1.6, 6.5], look: [0, 1.2, 0], drift: [0, .05, -.1], build(s) {
      put(s, acacia(1.6), .4, -1); const l = put(s, lemayian(), -2.5, 1.5, .8);
      return t => { const k = Math.min(t / 3, 1); l.position.set(lerp(-2.5, -.6, k), 0, lerp(1.5, .2, k)); k < 1 ? walk(l, t) : (idle(l, t), l.userData.head.rotation.x = .3 + Math.sin(t) * .1); }; } },
    { sky: 'day', cam: [2.5, 1.7, 6], look: [0, .9, -1], drift: [-.1, 0, 0], build(s) {
      put(s, hut(1.4), 0, -1.6); const l = put(s, lemayian(), 2.4, .5, -1);
      return t => { const a = t * .5; l.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2 - 1.6); l.rotation.y = -a; walk(l, t); }; } },
    { sky: 'day', cam: [0, 1.3, 5], look: [0, .5, -1], drift: [.08, 0, 0], build(s) {
      const tickRiver = river(s); const c = put(s, calf(), .9, -.6, Math.PI * .9), l = put(s, lemayian(), -3, 1.2, 1.2);
      return t => { tickRiver(t); c.userData.head.rotation.z = -.5 + Math.sin(t * 2) * .15; const k = Math.min(t / 2.5, 1); l.position.set(lerp(-3, -.4, k), 0, lerp(1.2, .1, k)); k < 1 ? walk(l, t, 9, .7) : wave(l, t); }; } },
    { sky: 'sunset', cam: [2.5, 1.6, 5.5], look: [-.5, .7, -1], drift: [-.06, 0, 0], build(s) {
      put(s, boma(2.6, .8), -.5, -1.5, -Math.PI / 2); const m = put(s, cow('#8d5524'), -1, -1.5, .3), c = put(s, calf(), -.1, -1, .3), l = put(s, lemayian(), 2, .6, -.6);
      return t => { idle(m, t); idle(c, t, 1); c.position.y = Math.abs(Math.sin(t * 3)) * .05; wave(l, t); }; } },
  ],
  'mama-beads': [
    { sky: 'day', cam: [1.5, 1.6, 5], look: [0, 1.1, 0], drift: [-.05, 0, -.08], build(s) {
      put(s, acacia(1.4), .3, -1.2); const m = put(s, mama(), 0, .3, .2);
      const bowl = put(s, new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clay('#6d4c41')), .6, .8, 0, .22);
      ['#E53935', '#ffffff', '#1E88E5', '#FDD835', '#43A047'].forEach((c, i) => put(s, new THREE.Mesh(new THREE.SphereGeometry(.04, 12, 8), clay(c, .4)), .55 + (i % 3) * .06, .78 + (i / 3 | 0) * .06, 0, .22));
      return t => { idle(m, t); m.userData.arms[1].rotation.x = -.7 + Math.sin(t * 3) * .1; bowl.rotation.y = t * .2; }; } },
    { sky: 'day', cam: [0, 1.2, 2.4], look: [0, .9, 0], drift: [0, 0, -.05], build(s) {
      const beads = Array.from({ length: 12 }, (_, i) => { const a = Math.PI * (i + .5) / 12, b = put(s, new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), clay(i % 2 ? '#ffffff' : '#E53935', .35)), -Math.cos(a) * .8, 0, .2, 1.4 - Math.sin(a) * .6); b.userData.y = b.position.y; return b; });
      return t => beads.forEach((b, i) => { const k = ease((t - i * .25) / .4); b.scale.setScalar(Math.max(.001, k)); b.position.y = b.userData.y + Math.sin(t * 2 + i * .5) * .02; }); } },
    { sky: 'day', cam: [0, 1.2, 4.4], look: [0, .6, 0], drift: [.06, 0, 0], build(s) {
      const m = put(s, mama(), -1.2, -.5, .5), n = put(s, naserian(), .9, -.4, -.4);
      const d = ['r', 'b', 'r', 'b'].map((c, i) => dropBrick(s, c, -.6 + i * .4, .8, .6 + i * .7, 0, .85));
      return t => { idle(m, t); idle(n, t, 1); d.forEach(f => f(t)); }; } },
    { sky: 'sunset', cam: [0, 1.2, 4.4], look: [0, .6, 0], drift: [0, 0, -.08], build(s) {
      const m = put(s, mama(), -1.2, -.5, .5), n = put(s, naserian(), .9, -.4, -.4);
      ['r', 'b', 'r', 'b'].forEach((c, i) => put(s, brick(HEX[c], .85), -.6 + i * .4, .8));
      const next = dropBrick(s, 'r', 1, .8, 1.5, 0, .85);
      return t => { wave(m, t); wave(n, t + .5); next(t); }; } },
  ],
  'little-seed': [
    { sky: 'day', cam: [0, 1.3, 4.2], look: [0, .9, 0], drift: [.05, 0, -.05], build(s) {
      const k = put(s, koko(), -.7, 0, .5), l = put(s, lemayian(), .7, 0, -.5);
      const seed = put(s, new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), clay('#FDD835', .4)), -.4, .25, 0, 1.25);
      return t => { idle(k, t); idle(l, t, 1); k.userData.arms[1].rotation.x = -.9; const e = ease((t - 1) / 1.5); seed.position.set(lerp(-.4, .4, e), 1.25 + Math.sin(e * Math.PI) * .3, .25); seed.rotation.y = t * 3; }; } },
    { sky: 'day', cam: [0, .6, 3], look: [0, -.1, 0], drift: [0, 0, -.06], build(s) {
      [['#4e342e', 0, .3], ['#8d6e63', -.3, .3], ['#9e9e9e', -.6, .3]].forEach(([c, y, h]) => put(s, new THREE.Mesh(new THREE.BoxGeometry(3, h, 1), clay(c, 1)), 0, .6, 0, y - h / 2 + .02));
      const seed = put(s, new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 12), clay('#FDD835', .4)), 0, .6, 0, 1.5);
      const worm = put(s, new THREE.Mesh(new THREE.CapsuleGeometry(.025, .2, 4, 8), clay('#e57373')), .8, 1.12, 0, -.15); worm.rotation.z = Math.PI / 2;
      return t => { seed.position.y = lerp(1.5, -.08, ease(t / 2)); worm.position.x = .8 + Math.sin(t) * .3; }; } },
    { sky: 'day', cam: [0, 1.2, 3.4], look: [0, .6, 0], drift: [0, 0, -.06], build(s) {
      const tickRain = rain(s); const plant = put(s, maize(.6), 0, 0); const l = put(s, lemayian(), 1.3, .3, -.8);
      return (t, dt) => { tickRain(t, dt); plant.scale.setScalar(.2 + ease(t / 4) * .8); idle(l, t); l.userData.head.rotation.x = -.4; }; } },
    { sky: 'sunset', cam: [0, 1.6, 4.8], look: [0, 1, 0], drift: [.05, .03, -.05], build(s) {
      put(s, maize(1.1), 0, -.3); put(s, maize(1), -.6, -.8); put(s, maize(1.05), .6, -.9);
      const l = put(s, lemayian(), -1.2, .5, .5), k = put(s, koko(), 1.3, .3, -.5);
      return t => { wave(l, t); idle(k, t); }; } },
  ],
};

function build(storyId, page) {
  const shot = (SHOTS[storyId] || [])[page]; if (!shot) return null;
  const scene = stage(shot.sky), update = shot.build(scene);
  return { scene, update, shot };
}

// Covers for the studio: first shot, a moment in.
export const STORY_COVERS = Object.fromEntries(Object.keys(SHOTS).map(id => [id, () => {
  const { scene, update, shot } = build(id, 0); update(2.5, .016);
  const cam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 100); cam.position.set(...shot.cam); cam.lookAt(...shot.look);
  return { scene, cam };
}]));

export function supported() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
}

export function createPlayer(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);
  const cam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 100);
  let cur = null, t0 = 0, last = 0, raf = 0;
  const size = () => { const w = el.clientWidth || 640; renderer.setSize(w, w * 9 / 16, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = 'auto'; };
  size(); addEventListener('resize', size);
  function dispose(obj) { obj.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  function loop(now) {
    if (!el.isConnected) return api.dispose();
    raf = requestAnimationFrame(loop);
    if (!cur) return;
    const t = REDUCED ? 3 : (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
    cur.update(t, dt);
    const d = cur.shot.drift || [0, 0, 0], k = REDUCED ? 0 : Math.min(t, 8);
    cam.position.set(cur.shot.cam[0] + d[0] * k, cur.shot.cam[1] + d[1] * k, cur.shot.cam[2] + d[2] * k);
    cam.lookAt(...cur.shot.look);
    renderer.render(cur.scene, cam);
  }
  const api = {
    show(storyId, page) {
      if (cur) dispose(cur.scene);
      cur = build(storyId, page); t0 = last = performance.now();
      return !!cur;
    },
    dispose() { cancelAnimationFrame(raf); removeEventListener('resize', size); if (cur) dispose(cur.scene); cur = null; renderer.dispose(); renderer.domElement.remove(); },
  };
  raf = requestAnimationFrame(loop);
  return api;
}
