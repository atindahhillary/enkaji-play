// The 19 story pages as 3D scenes (tools only). Each page builds its world, poses the cast, and records
// "anchors": points projected to the 800x450 story frame, so art.js can place labels, marks and arrows on top.
import { THREE, person, rest, wave, point, hold, ball, matte, gloss, brick, BRICK_COLS, cow, hut, acacia, boma, river, fire, maize, rain, seed, soil, beadRing } from './cast3d.js';

const SKIES = {
  dawn: ['#f3a98b', '#fde7c2', '#e9b06a'], day: ['#7fb6d6', '#fbe0a6', '#cf9f52'],
  sunset: ['#e9773f', '#ffd69a', '#c98d47'], night: ['#121c40', '#33417a', '#3a3324'],
};
const BRICK = { r: BRICK_COLS[0], o: BRICK_COLS[1], g: BRICK_COLS[2], b: BRICK_COLS[3], p: BRICK_COLS[4], y: BRICK_COLS[5] };

export function world(t) {
  const [top, low, ground] = SKIES[t], night = t === 'night';
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g2 = c.getContext('2d');
  const gr = g2.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(.6, low); gr.addColorStop(1, low);
  g2.fillStyle = gr; g2.fillRect(0, 0, 4, 256); const sky = new THREE.CanvasTexture(c); sky.colorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = sky; scene.fog = new THREE.Fog(low, 30, 95);
  scene.add(new THREE.HemisphereLight(night ? '#5a6aa8' : '#fff0dc', night ? '#1a1408' : '#b8601e', night ? .55 : 1.15));
  const key = new THREE.DirectionalLight(night ? '#9fb4ff' : t === 'sunset' ? '#ffd0a0' : '#fff1e0', night ? .5 : 2.5);
  key.position.set(t === 'sunset' || t === 'dawn' ? -5 : 3, 6, 5); key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -.0004; key.shadow.normalBias = .03;
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 7, bottom: -4, far: 40 }); scene.add(key);
  const rim = new THREE.DirectionalLight(night ? '#6f86ff' : '#cfe6ff', night ? .8 : 1.8); rim.position.set(-3, 4, -5); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), matte(ground, 1)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  for (const [x, z, s] of [[-16, -28, 7], [-3, -32, 9], [11, -29, 7.5], [24, -34, 9]]) scene.add(ball(1, matte(night ? '#2a3350' : '#8b9db0', 1), x, 0, z, s * 1.6, s * .55, s));
  const orb = night ? ball(1.1, new THREE.MeshBasicMaterial({ color: '#fff6c9' }), 9, 7.5, -34) : ball(1.6, new THREE.MeshBasicMaterial({ color: t === 'day' ? '#fff0b0' : '#ffb867' }), t === 'day' ? 10 : -9, t === 'day' ? 8 : 4.2, -34);
  scene.add(orb);
  if (night) for (let i = 0; i < 40; i++) scene.add(ball(.06, new THREE.MeshBasicMaterial({ color: '#fff8d0' }), -20 + (i * 7.3) % 40, 5 + (i * 3.1) % 9, -36));
  return scene;
}

// Cast helpers: put a person at (x, z) facing the camera (or turned by ry), with a pose.
function who(scene, o, x, z, pose = rest, ry = 0, s = 1.3, arg) { // the cast is drawn a little larger than the world, picture-book style
  const r = person(o); pose(r, arg ?? .15); r.root.position.set(x, 0, z); r.root.rotation.y = ry; r.root.scale.multiplyScalar(s); scene.add(r.root); return r;
}
const at = (obj, x, y, z, s = 1, ry = 0) => { obj.position.set(x, y, z); obj.scale.multiplyScalar(s); obj.rotation.y = ry; return obj; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// C is the cast table from the studio (girl, boy, mama, koko).
export const PAGES = C => ({
  'six-bricks': [
    ['dawn', (s, A) => { s.add(at(hut(), 3.6, 0, -1.8, 1.2)); s.add(at(acacia(), -4.2, 0, -2.4, 1.5)); who(s, C.girl, 0, 1, wave); A('girl', V(0, 2.4, 1)); }],
    ['day', (s, A) => {
      s.add(at(hut(), 4.6, 0, -2.6)); who(s, C.mama, -1.4, .4); const n = who(s, C.girl, .9, .8, hold, -.15);
      ['r', 'o', 'g', 'b', 'p', 'y'].forEach((c, i) => s.add(at(brick(BRICK[c]), -.6 + i * .62, 2.85 + Math.sin(i / 5 * Math.PI) * .3, 1.4, 1.5, i * .3)));
      A('bricks', V(.95, 3.6, 1.4)); A('hands', V(.9, 1.2, 1.4));
    }],
    ['day', (s, A) => {
      who(s, C.girl, -3.95, .6, point, .7);
      ['r', 'o', 'g', 'b', 'p', 'y'].forEach((c, i) => { const x = -2.3 + i * 1.24; s.add(at(brick(BRICK[c]), x, 0, .9, 2.4, -.15)); A('b' + i, V(x, -.05, .9)); });
    }],
    ['day', (s, A) => {
      s.add(at(boma(1.9, Math.PI * 1.25, Math.PI * .85), 2.6, 0, -.6)); who(s, C.koko, -4.1, .1); who(s, C.girl, -2.1, .7, point, .8);
      ['r', 'o', 'g'].forEach((c, i) => s.add(at(brick(BRICK[c]), 1.8 + i * .75, 0, -.2 + (i % 2) * .3, 1.8, .4 * i)));
      A('from', V(-1.2, 2.4, .7)); A('to', V(2.4, .9, -.1));
    }],
    ['sunset', (s, A) => {
      s.add(at(boma(1.8, Math.PI * 1.2, -Math.PI * .1), -4.6, 0, -1.2)); who(s, C.girl, -3.6, .9, point, .7);
      [['#a0612c', '#f4efe6', -.6], ['#f4efe6', '#2b1d16', 1.9], ['#3a2a20', '#f4efe6', 4.3]].forEach(([col, pt, x], i) => { s.add(at(cow(col, pt), x, 0, -.1, .95, -1.35)); A('c' + i, V(x, 2.5, -.1)); });
    }],
    ['night', (s, A) => {
      s.add(at(hut(), 3.8, 0, -2.4, 1.2)); s.add(at(fire(), .1, 0, .7));
      who(s, C.mama, -2.2, .3, rest, .3); who(s, C.girl, 1.7, .6, point, -.5); who(s, C.boy, 2.9, 1, wave, -.4, 1);
      ['r', 'b', 'y'].forEach((c, i) => s.add(at(brick(BRICK[c]), -.5 + i * .45, 0, 1.9, 1, i)));
    }],
  ],
  'lost-calf': [
    ['day', (s, A) => { s.add(at(boma(2, Math.PI * 2, 0), -3.2, 0, -.9)); s.add(at(cow('#a0612c', '#f4efe6'), -3.2, 0, -.9, .9, -1.1)); who(s, C.boy, 2.7, .7, rest, -.3); A('q', V(3.6, 3.1, .7)); }],
    ['day', (s, A) => { s.add(at(acacia(), .8, 0, -1.2, 2.1)); who(s, C.boy, -3.4, .7, point, .7); A('x', V(.8, .9, -1)); }],
    ['day', (s, A) => { s.add(at(hut(), 1.3, 0, -1.4, 1.7)); who(s, C.boy, -3.4, .7, point, .7); A('x', V(2.6, 2.9, -2.4)); }],
    ['day', (s, A) => {
      s.add(at(river(30, 4.4), 0, 0, -2.9)); s.add(at(cow('#f4efe6', '#2b1d16'), 2.5, 0, .1, .8, -1.9)); who(s, C.boy, -3.1, .8, wave, .5);
      A('ok', V(2.5, 2.8, .1)); A('from', V(-2, 2.6, .8)); A('to', V(1.7, 1.2, .1));
    }],
    ['sunset', (s, A) => {
      s.add(at(boma(2.1, Math.PI * 1.3, Math.PI * .75), -2.4, 0, -.9)); s.add(at(cow('#a0612c', '#f4efe6'), -2.8, 0, -.6, .95, -1.1)); s.add(at(cow('#f4efe6', '#2b1d16'), -1.2, 0, .2, .58, -1.4));
      who(s, C.boy, 3, .7, wave, -.4); A('heart', V(-1.9, 2.6, -.2));
    }],
  ],
  'mama-beads': [
    ['day', (s, A) => {
      s.add(at(acacia(), 3.2, 0, -1.8, 1.7)); const r = beadRing(.3, 0, .05, ['#E53935', '#ffffff', '#1E88E5', '#FDD835']); r.rotation.x = 1.2;
      who(s, C.mama, -.6, .6, hold, .15, 1.3, r); A('beads', V(-.5, 1.9, 1.3));
    }],
    ['day', (s, A) => {
      const g = new THREE.Group(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.add(ball(.36, gloss(i % 2 ? '#ffffff' : '#E53935'), Math.cos(a) * 2.3, Math.sin(a) * 1.25, 0)); }
      g.position.set(0, 1.75, .4); s.add(g); A('centre', V(0, 1.75, .4));
    }],
    ['day', (s, A) => {
      who(s, C.mama, -4, .2, rest, .4); who(s, C.girl, -2.3, .7, point, .7);
      ['r', 'b', 'r', 'b'].forEach((c, i) => s.add(at(brick(BRICK[c]), -.3 + i * 1.25, 0, .9, 2.2, -.1)));
    }],
    ['sunset', (s, A) => {
      who(s, C.mama, -4.3, .2, wave, .4); who(s, C.girl, -2.8, .7, wave, .5);
      ['r', 'b', 'r', 'b'].forEach((c, i) => s.add(at(brick(BRICK[c]), -1.1 + i * 1.15, 0, .9, 2, -.1)));
      s.add(at(brick(BRICK.r), 4.1, 0, .9, 2, -.1)); A('q', V(4.1, 1.5, .9)); A('next', V(4.1, .3, .9));
    }],
  ],
  'little-seed': [
    ['day', (s, A) => {
      who(s, C.koko, -1.5, .4, point, .3); who(s, C.boy, 1.4, .7, rest, -.3);
      const sd = seed(1.6); sd.position.set(0, 2.1, 1.1); s.add(sd); A('seed', V(0, 2.1, 1.1)); A('from', V(-1.1, 2.6, .5));
    }],
    ['day', (s, A) => {
      s.add(at(soil(), 1.2, 0, 0)); who(s, C.boy, -3.9, .7, point, .7);
      A('top', V(3.4, 1.7, 0)); A('sub', V(3.4, 1.12, 0)); A('rock', V(3.4, .5, 0));
    }],
    ['day', (s, A) => { s.add(rain()); s.add(at(maize(.38, false), -.3, 0, .6)); who(s, C.boy, 2.9, .7, wave, -.4); }],
    ['sunset', (s, A) => {
      [[-.9, -.3, 1.25], [.2, -.6, 1.4], [1.3, -.3, 1.2]].forEach(([x, z, h]) => s.add(at(maize(h), x, 0, z)));
      who(s, C.boy, -3.4, .7, wave, .5); who(s, C.koko, 3.6, .4, rest, -.4); A('top', V(.2, 3.6, -.6));
    }],
  ],
});

// Render one page at 960x540; anchors in 800x450 story coordinates.
export function renderPage(renderer, t, build) {
  const scene = world(t), anchors = {};
  const cam = new THREE.PerspectiveCamera(32, 16 / 9, .1, 200); cam.position.set(0, 2.7, 9.8); cam.lookAt(0, 1.6, 0);
  const pts = []; build(scene, (k, v) => pts.push([k, v]));
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  for (const [k, v] of pts) { const p = v.clone().project(cam); anchors[k] = [Math.round((p.x + 1) / 2 * 800), Math.round((1 - p.y) / 2 * 450)]; }
  renderer.setSize(1920, 1080, false); renderer.render(scene, cam);
  const c = document.createElement('canvas'); c.width = 960; c.height = 540; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(renderer.domElement, 0, 0, 960, 540);
  return { canvas: c, anchors };
}
