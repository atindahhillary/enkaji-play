// Enkaji Play 3D cast (tools only, not deployed). Rounded, toy-like Maasai characters built from
// three.js primitives, posed in code, and rendered by studio3d.html into small WebP images and
// sprite strips that the site plays back. Units: about 1 = 1 metre.
import * as THREE from './vendor/three.module.min.js';
export { THREE };

// ---------- materials ----------
const cache = {};
const once = (k, f) => cache[k] || (cache[k] = f());
export const gloss = c => once('g' + c, () => new THREE.MeshPhysicalMaterial({ color: c, roughness: .22, clearcoat: 1, clearcoatRoughness: .15 }));
export const matte = (c, r = .8) => once('m' + c + r, () => new THREE.MeshStandardMaterial({ color: c, roughness: r }));
const skinMat = c => once('s' + c, () => new THREE.MeshPhysicalMaterial({ color: c, roughness: .5, sheen: .4, sheenColor: '#ffb08a', clearcoat: .12, clearcoatRoughness: .6 }));
// Maasai shuka: a base colour with darker and lighter check lines.
export function shuka(base) {
  return once('k' + base, () => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(0, 44, 128, 22); g.fillRect(44, 0, 22, 128);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, 98, 128, 5); g.fillRect(98, 0, 5, 128); g.fillRect(0, 20, 128, 2); g.fillRect(20, 0, 2, 128);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return new THREE.MeshPhysicalMaterial({ map: t, roughness: .9, sheen: 1, sheenRoughness: .6, sheenColor: '#fff0e0', side: THREE.DoubleSide });
  });
}

// ---------- geometry helpers ----------
const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
export const ball = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = M(new THREE.SphereGeometry(r, 48, 32), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
const cap = (r, len, mat, y) => M(new THREE.CapsuleGeometry(r, len, 12, 32), mat, 0, y, 0);
const put = (parent, child) => (parent.add(child), child); // add() returns the parent; this returns the child
const G = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
// A ring of real beads (instanced spheres) in a repeating colour pattern.
export function beadRing(radius, y, beadR, colours, flatten = 1) {
  const n = Math.max(6, Math.round((Math.PI * 2 * radius) / (beadR * 2.05)));
  const g = G(0, y, 0);
  colours.forEach((col, ci) => {
    const idx = [...Array(n).keys()].filter(i => i % colours.length === ci);
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(beadR, 14, 10), gloss(col), idx.length);
    const o = new THREE.Object3D();
    idx.forEach((i, j) => { const a = i / n * Math.PI * 2; o.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius * flatten); o.updateMatrix(); im.setMatrixAt(j, o.matrix); });
    im.castShadow = true; g.add(im);
  });
  return g;
}

// ---------- characters ----------
// o: { kind: girl|boy|woman|man|elder, wrap, collar[], skin }
export function person(o) {
  const kind = o.kind || 'woman', child = kind === 'girl' || kind === 'boy', female = kind === 'girl' || kind === 'woman' || kind === 'elder';
  const LS = child ? 1 : 1.55, TS = child ? 1 : 1.3, HR = child ? .44 : .37;
  const skin = skinMat(o.skin || (kind === 'elder' ? '#6e3a22' : '#7a4026')), skinDk = matte('#4f2715', .55);
  const cloth = shuka(o.wrap || '#1E88E5'), cols = o.collar || ['#E53935', '#ffffff', '#1E88E5', '#FDD835'];
  const root = G(), hips = G(0, .66 * (child ? 1 : 1.42), 0); root.add(hips);
  const rig = { root, hips, base: hips.position.y, child };

  const leg = side => {
    const hip = G(side * (child ? .15 : .14), -.02, 0); hips.add(hip);
    hip.add(cap(.125 * (child ? 1 : .92), .1 * LS, skin, -.12 * LS));
    const knee = G(0, -.25 * LS, 0); hip.add(knee);
    knee.add(cap(.115 * (child ? 1 : .9), .08 * LS, skin, -.1 * LS));
    const ankle = G(0, -.23 * LS, 0); knee.add(ankle);
    ankle.add(ball(.12, skin, 0, -.04, .05, 1, .8, 1.45));
    put(ankle, M(new THREE.CylinderGeometry(.13, .13, .045, 32), matte('#2b211c', .7), 0, -.12, .06)).scale.set(1, 1, 1.55); // akala tyre sandal
    ankle.add(M(new THREE.TorusGeometry(.1, .018, 10, 32, Math.PI), gloss('#d9302c'), 0, -.06, .1));
    if (female) ankle.add(beadRing(.1, .06, .02, ['#ffffff', '#1E88E5', '#FDD835']));
    return { hip, knee, ankle };
  };
  rig.L = leg(1); rig.R = leg(-1);

  const body = G(); hips.add(body); rig.body = body;
  body.add(ball(.28, skin, 0, .28 * TS, 0, 1, 1.1 * TS, .9));
  const prof = [[.0, -.32], [.38, -.32], [.41, -.28], [.37, -.05], [.34, .2], [.34, .42], [.27, .54], [.1, .6], [.0, .6]];
  const hem = child ? 0 : -.18; // adults: shuka reaches below the knee
  const dress = M(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x * (child ? 1 : .94), y < 0 ? y + hem : y * TS)), 48), cloth, 0, .02, 0);
  dress.scale.z = .85; body.add(dress); rig.dress = dress;
  body.add(ball(.1, cloth, .24, .6 * TS, .06)); // the knot of the shuka on one shoulder

  const chest = G(0, .5 * TS, 0); body.add(chest); rig.chest = chest;
  // Enkarewa: the flat beaded collar. Women and Koko wear the biggest ones.
  const rings = kind === 'man' || kind === 'boy' ? 3 : kind === 'girl' ? 6 : 8;
  const collar = G(0, .13, .02); collar.rotation.x = .22; chest.add(collar); rig.collar = collar;
  const outer = .165 + (rings - 1) * .05;
  collar.add(M(new THREE.CylinderGeometry(.14, outer + .02, .02 + rings * .02, 48, 1, true), gloss('#f4efe6'), 0, -.01 - rings * .01, 0));
  for (let i = 0; i < rings; i++) collar.add(beadRing(.165 + i * .05, -.003 - .02 * i, .027, i % 2 ? [cols[i % cols.length], '#ffffff'] : [cols[i % cols.length]], .92));
  chest.add(cap(.09, .06 + (child ? 0 : .05), skin, .1));

  const arm = side => {
    const sh = G(side * .33, -.02, 0); chest.add(sh);
    sh.add(ball(.1, cloth, 0, 0, 0));
    sh.add(cap(.075, .16 * (child ? 1 : 1.3), skin, -.13 * (child ? 1 : 1.3)));
    const el = G(0, -.27 * (child ? 1 : 1.3), 0); sh.add(el);
    el.add(cap(.07, .14 * (child ? 1 : 1.3), skin, -.11 * (child ? 1 : 1.3)));
    el.add(beadRing(.075, -.19 * (child ? 1 : 1.3), .018, ['#FDD835', '#E53935', '#ffffff']));
    el.add(ball(.09, skin, 0, -.27 * (child ? 1 : 1.3), .01, .95, 1, .8));
    return { sh, el };
  };
  rig.AL = arm(1); rig.AR = arm(-1);

  const head = G(0, (child ? .63 : .6), 0); chest.add(head); rig.head = head;
  const s = HR / .44; // everything on the face scales with the head
  const h = G(); h.scale.setScalar(s); head.add(h);
  h.add(ball(.44, skin, 0, .02, 0, 1, .96, .94));
  const hairCol = kind === 'elder' ? '#b9b0a6' : '#1a110c';
  const hair = M(new THREE.SphereGeometry(.452, 48, 32, 0, Math.PI * 2, 0, 1.25), matte(hairCol, .95), 0, .04, -.01); hair.scale.set(1, .97, .95); h.add(hair);
  if (female) h.add(beadRing(.4, .25, .026, ['#E53935', '#ffffff', '#1E88E5', '#ffffff'], .94));
  for (const sd of [1, -1]) {
    h.add(ball(.09, skin, sd * .43, -.02, 0, .55, 1, .8));
    if (female) h.add(beadRing(.05, -.12, .016, ['#FDD835', '#E53935']).rotateX(Math.PI / 2).translateX(sd * .45));
    const eye = G(sd * .16, .02, .36); eye.scale.setScalar(child ? 1 : .85); h.add(eye);
    eye.add(ball(.105, gloss('#fbf7f2'), 0, 0, 0, 1, 1.12, .55));
    eye.add(ball(.07, gloss('#3a1e10'), 0, -.005, .045, 1, 1.1, .5));
    eye.add(ball(.038, gloss('#0b0503'), 0, -.005, .07, 1, 1.1, .4));
    eye.add(ball(.018, once('hl', () => new THREE.MeshBasicMaterial({ color: '#ffffff' })), .025, .03, .085));
    const brow = M(new THREE.CapsuleGeometry(.016, .07, 6, 12), matte(kind === 'elder' ? '#d8d0c6' : '#140c08'), sd * .16, .17, .38); brow.rotation.z = Math.PI / 2 + sd * .18; h.add(brow);
    if (child || female) h.add(ball(.065, once('blush', () => new THREE.MeshStandardMaterial({ color: '#c9705a', roughness: .8, transparent: true, opacity: .16 })), sd * .26, -.12, .33, 1, .7, .4));
  }
  h.add(ball(.05, skinDk, 0, -.08, .43, 1.1, .85, .8));
  const mouth = M(new THREE.TorusGeometry(.085, .02, 12, 32, Math.PI), matte('#3a1210', .6), 0, -.165, .395); mouth.rotation.set(-.25, 0, Math.PI); h.add(mouth);
  h.add(ball(.07, matte('#3a1210', .6), 0, -.2, .392, 1.15, .52, .28));   // open smile, flat on the face
  h.add(ball(.035, matte('#e2766e', .6), 0, -.218, .402, 1.3, .45, .25)); // tongue
  h.add(ball(.05, gloss('#fbf7f2'), 0, -.178, .403, 1.35, .22, .2));       // teeth
  return rig;
}

// ---------- poses ----------
const ease = x => x * x * (3 - 2 * x);
export function rest(rig) {
  for (const A of [rig.AL, rig.AR]) { A.sh.rotation.set(0, 0, 0); A.el.rotation.set(0, 0, 0); }
  rig.AL.sh.rotation.z = .18; rig.AR.sh.rotation.z = -.18;
  rig.AL.el.rotation.x = rig.AR.el.rotation.x = -.25;
  for (const L of [rig.L, rig.R]) { L.hip.rotation.set(0, 0, 0); L.knee.rotation.set(0, 0, 0); L.ankle.rotation.set(0, 0, 0); }
  rig.hips.position.y = rig.base; rig.root.scale.set(1, 1, 1); rig.head.rotation.set(.04, 0, .06);
}
// Wave hello: weight shifts, right hand waves high, head tilts.
export function wave(rig, t) {
  rest(rig);
  const w = Math.sin(t * Math.PI * 2 * 1.6);
  rig.AR.sh.rotation.z = -2.5; rig.AR.sh.rotation.x = -.2; rig.AR.el.rotation.z = -.5 * w; rig.AR.el.rotation.x = -.35;
  rig.hips.rotation.z = .03 * Math.sin(t * Math.PI * 2 * .8); rig.head.rotation.z = .1 + .05 * w;
  rig.hips.position.y = rig.base - .015 * Math.abs(w);
}
// The win dance from the test: bounce on every beat, knee lifts, arm pumps, a jump and a cheer.
export const BPM = 112;
export function dance(rig, t, loop = 8) {
  const b = (t * BPM / 60) % loop, beat = Math.floor(b), d = b - beat;
  const land = Math.exp(-Math.pow(d / .16, 2)) + Math.exp(-Math.pow((1 - d) / .16, 2));
  let lift = Math.max(0, Math.sin(Math.PI * d)) * .6, liftSide = beat % 2 ? 1 : -1, cheer = 0, jump = 0;
  if (b >= loop - 4) { const p = (b - (loop - 4)) / 4; jump = Math.max(0, Math.sin(Math.PI * Math.min(1, p * 2))) * (p < .5 ? 1 : 0); cheer = ease(Math.min(1, p * 2.2)) * (1 - ease(Math.max(0, (p - .8) * 5))); lift *= 1 - cheer; }
  rig.root.scale.set(1 + .03 * land, 1 - .06 * land, 1 + .03 * land);
  rig.hips.position.y = rig.base - .06 * land + .3 * jump;
  const sway = Math.sin(Math.PI * b);
  rig.hips.rotation.y = .18 * sway * (1 - cheer); rig.hips.rotation.z = .05 * sway;
  for (const [Lg, s] of [[rig.L, 1], [rig.R, -1]]) {
    const me = s === liftSide ? lift : 0, bend = .28 * land + .35 * jump;
    Lg.hip.rotation.set(-bend - 1.05 * me, 0, s * (.04 + .1 * jump)); Lg.knee.rotation.set(2 * bend + 1.35 * me, 0, 0); Lg.ankle.rotation.set(-bend * .6 + .3 * me, 0, 0);
  }
  for (const [A, s] of [[rig.AL, 1], [rig.AR, -1]]) {
    const pump = Math.sin(Math.PI * b + (s > 0 ? 0 : Math.PI));
    A.sh.rotation.set((-.55 + .45 * pump) * (1 - cheer) - 2.7 * cheer, 0, s * (.25 + .15 * land) * (1 - cheer) + s * .35 * cheer);
    A.el.rotation.set(-1.5 * (1 - cheer) - .2 * cheer, 0, 0);
  }
  const lag = Math.sin(Math.PI * (b - .18));
  rig.head.rotation.set(.1 * Math.sin(2 * Math.PI * (b - .12)) - .15 * cheer, -.12 * sway, .12 * lag);
  rig.chest.rotation.set(.06 * land, -.08 * sway, 0);
  rig.dress.rotation.z = -.07 * lag; rig.dress.scale.x = 1 + .05 * Math.sin(2 * Math.PI * (b - .25));
  rig.collar.rotation.set(.22 + .08 * Math.sin(2 * Math.PI * (b - .3)), 0, .06 * lag);
  return { jump };
}

// ---------- props ----------
export const BRICK_COLS = ['#E53935', '#FB8C00', '#43A047', '#1E88E5', '#29B6F6', '#FDD835'];
export function brick(c) {
  const g = G(), m = gloss(c);
  g.add(M(new THREE.BoxGeometry(.32, .19, .16), m, 0, .095, 0));
  for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) g.add(M(new THREE.CylinderGeometry(.03, .03, .03, 20), m, -.12 + a * .08, .205, -.04 + b * .08));
  return g;
}
// Cartoon cow (style from the user's reference): big round head, wide pink muzzle, huge eyes with
// sleepy lids, big floppy ears, small horns, round barrel body, short legs. Keeps the zebu hump of Mara cattle.
export function cow(col = '#8d5524', patch = null) {
  const g = G(), hide = once('hide' + col, () => new THREE.MeshPhysicalMaterial({ color: col, roughness: .6, sheen: .6, sheenColor: '#ffffff' }));
  const spot = patch && matte(patch, .65), pink = once('pink', () => new THREE.MeshPhysicalMaterial({ color: '#eda7a2', roughness: .45, clearcoat: .3 }));
  const body = ball(.5, hide, 0, .78, 0, 1.3, .92, .88); g.add(body);
  if (spot) for (const [x, y, z, r] of [[-.25, .95, .3, .22], [.2, .7, .38, .18], [-.4, .7, -.3, .2], [.15, 1.05, -.25, .2]]) put(g, ball(r, spot, x, y, z, 1.2, 1, .35)).lookAt(0, .78, 0);
  g.add(ball(.2, hide, .32, 1.18, 0, 1.1, .8, .8));                         // hump
  for (const [x, z] of [[.38, .26], [.38, -.26], [-.4, .26], [-.4, -.26]]) {
    g.add(M(new THREE.CapsuleGeometry(.1, .26, 8, 16), hide, x, .3, z));
    g.add(M(new THREE.CylinderGeometry(.1, .11, .08, 20), matte('#2b211c', .5), x, .04, z));  // hoof
  }
  const head = G(.72, 1.12, 0); g.add(head);
  head.add(ball(.33, hide, 0, 0, 0, 1, 1.12, .95));
  head.add(ball(.27, pink, .24, -.2, 0, .85, .72, 1.05));                    // muzzle
  for (const s of [1, -1]) {
    head.add(ball(.045, matte('#3b1c18', .6), .44, -.16, s * .1, .6, .9, 1));  // nostril
    const eye = G(.2, .08, s * .2); head.add(eye); eye.rotation.y = -s * .55;
    eye.add(ball(.11, gloss('#fbf7f2'), 0, 0, 0, .6, 1.1, 1));
    eye.add(ball(.075, gloss('#4a2a14'), .045, -.01, 0, .5, 1.05, 1));
    eye.add(ball(.04, gloss('#0b0503'), .07, -.01, 0, .4, 1.05, 1));
    eye.add(ball(.017, once('hl', () => new THREE.MeshBasicMaterial({ color: '#ffffff' })), .085, .03, .02));
    put(eye, M(new THREE.SphereGeometry(.118, 32, 16, 0, Math.PI * 2, 0, 1.25), hide, 0, .005, 0)).scale.set(.62, 1.1, 1.02); // sleepy upper lid
    const ear = ball(.17, hide, -.05, .12, s * .38, .55, .28, 1); ear.rotation.x = s * .35; head.add(ear);
    put(head, ball(.12, pink, -.02, .12, s * .4, .3, .18, .8)).rotation.x = s * .35;
    const horn = M(new THREE.ConeGeometry(.05, .2, 16), matte('#f1e6cf', .4), -.08, .36, s * .17); horn.rotation.set(s * .5, 0, .25); head.add(horn);
  }
  head.add(ball(.09, spot || hide, -.02, .33, 0, 1.4, .6, 1.3));            // forelock tuft
  const tail = G(-.66, .95, 0); g.add(tail); tail.add(M(new THREE.CapsuleGeometry(.03, .4, 6, 10), hide, 0, -.2, 0)); tail.add(ball(.07, spot || matte('#2b211c'), 0, -.45, 0, .8, 1.2, .8));
  g.userData = { head, tail };
  return g;
}
export function hut() {
  const g = G();
  g.add(M(new THREE.CylinderGeometry(.75, .8, .7, 40), matte('#b9814f', .95), 0, .35, 0));
  g.add(M(new THREE.ConeGeometry(1.05, .95, 40), matte('#cfa45a', .95), 0, 1.15, 0));
  g.add(M(new THREE.BoxGeometry(.32, .5, .1), matte('#3e2723'), 0, .25, .76));
  return g;
}
export function acacia() {
  const g = G(), bark = matte('#6d4c41', .9), leaf = matte('#6f9a3a', .9);
  g.add(M(new THREE.CylinderGeometry(.07, .11, 1.6, 12), bark, 0, .8, 0));
  for (const [x, y, z, sx] of [[0, 1.75, 0, 1.6], [.7, 1.65, .1, 1], [-.75, 1.62, -.1, 1.1]]) g.add(ball(.6, leaf, x, y, z, sx, .28, .9));
  return g;
}

// ---------- story props and poses ----------
// Point: right arm reaches forward and up toward what the character is looking at.
export function point(rig) { rest(rig); rig.AR.sh.rotation.set(-1.35, 0, -.35); rig.AR.el.rotation.set(-.15, 0, 0); rig.head.rotation.set(-.05, -.2, .05); }
// Hold something in front of the chest with both hands.
export function hold(rig, prop) {
  rest(rig); for (const [A, s] of [[rig.AL, 1], [rig.AR, -1]]) { A.sh.rotation.set(-.7, 0, s * .1); A.el.rotation.set(-1.1, 0, 0); }
  if (prop && prop.isObject3D) { prop.position.set(0, -.25, .55); rig.chest.add(prop); }
}
// Boma: a ring (or arc) of thorny sticks.
export function boma(r = 1.6, arc = Math.PI * 1.4, start = Math.PI * .8) {
  const g = G(), n = Math.round(r * arc * 6), wood = matte('#7a5a40', .95);
  for (let i = 0; i <= n; i++) { const a = start + arc * i / n; const st = M(new THREE.CylinderGeometry(.035, .05, .8 + (i % 3) * .12, 8), wood, Math.cos(a) * r, .42, Math.sin(a) * r); st.rotation.set((i % 2 ? .12 : -.1), 0, (i % 3 - 1) * .1); g.add(st); }
  for (const y of [.35, .65]) { const rail = M(new THREE.TorusGeometry(r, .03, 6, 64, arc), wood, 0, y, 0); rail.rotation.set(Math.PI / 2, 0, start); g.add(rail); }
  return g;
}
export function river(w = 30, d = 3.2) {
  const g = G(); const water = M(new THREE.BoxGeometry(w, .06, d), new THREE.MeshPhysicalMaterial({ color: '#4fb3e8', roughness: .15, clearcoat: 1, transmission: 0 }), 0, .03, 0); water.receiveShadow = true; g.add(water);
  for (const s of [1, -1]) g.add(M(new THREE.BoxGeometry(w, .1, .25), matte('#a7834a', 1), 0, .05, s * d / 2));
  for (let i = 0; i < 9; i++) g.add(ball(.09, matte('#9e9e9e', .7), -10 + i * 2.4, .06, (i % 2 ? 1 : -1) * (d / 2 + .1), 1.4, .6, 1));
  return g;
}
export function fire() {
  const g = G(), wood = matte('#6d4c41', .9);
  for (const r of [0, 1.05, 2.1]) { const arm = G(); arm.rotation.y = r; const log = M(new THREE.CylinderGeometry(.07, .08, .95, 10), wood, 0, .08, 0); log.rotation.z = Math.PI / 2; arm.add(log); g.add(arm); }
  const flame = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }); // unlit so the flame stays vivid
  g.add(ball(.24, flame('#ff6a13'), 0, .38, 0, 1, 1.5, 1)); g.add(M(new THREE.ConeGeometry(.2, .42, 24), flame('#ff6a13'), 0, .72, 0));
  g.add(ball(.15, flame('#ffb02e'), .02, .34, .1, 1, 1.5, 1)); g.add(M(new THREE.ConeGeometry(.12, .28, 20), flame('#ffb02e'), .02, .58, .1));
  g.add(ball(.08, flame('#fff3a0'), .03, .3, .18, 1, 1.4, 1));
  const light = new THREE.PointLight('#ff9a3c', 14, 9, 1.6); light.position.set(0, .7, 0); light.castShadow = true; g.add(light);
  return g;
}
export function maize(h = 1, cob = true) {
  const g = G(), green = matte('#5aa83a', .7), leaf = matte('#6fbf47', .7);
  g.add(M(new THREE.CylinderGeometry(.04, .06, 2.2 * h, 10), green, 0, 1.1 * h, 0));
  for (let i = 0; i < 6; i++) { const lf = ball(.32 * h, leaf, 0, (.5 + i * .3) * h, 0, 1.4, .06, .35); lf.rotation.set(0, i * 2.1, -.5); lf.translateX(.35 * h); g.add(lf); }
  if (cob) { g.add(ball(.11 * h, gloss('#FDD835'), .12 * h, 1.4 * h, 0, .8, 1.9, .8)); g.add(ball(.1 * h, leaf, .1 * h, 1.3 * h, 0, .9, 1.6, .9)); }
  return g;
}
export function rain(n = 140) {
  const g = G(), m = new THREE.MeshPhysicalMaterial({ color: '#7fd0ff', roughness: .1, clearcoat: 1 });
  for (let i = 0; i < n; i++) g.add(ball(.035, m, -7 + (i * 1.37) % 14, .4 + (i * .53) % 4.2, -3 + (i * .71) % 4.5, 1, 2.6, 1));
  return g;
}
export function seed(s = 1) { return ball(.16 * s, gloss('#FDD835'), 0, 0, 0, 1, .78, .9); }
// Soil cut-away: topsoil, subsoil, rock.
export function soil() {
  const g = G(), w = 4.2, d = 1.2;
  [['#4e342e', .55], ['#a1887f', .55], ['#9e9e9e', .6]].forEach(([c, h], i) => g.add(M(new THREE.BoxGeometry(w, h, d), matte(c, .95), 0, 1.7 - i * .58, 0)));
  g.add(ball(.13, gloss('#FDD835'), -.4, 2.03, .3, 1, .75, .9));
  const worm = M(new THREE.TorusGeometry(.18, .045, 10, 24, Math.PI * 1.3), matte('#e57373', .5), -1.3, 1.75, .62); g.add(worm);
  return g;
}

// ---------- Kerri, game props and word pictures ----------
// Kerri the Maasai sheep: a round cloud of cream wool, a brown face with big lidded eyes.
export function lamb() {
  const g = G(), wool = once('wool', () => new THREE.MeshPhysicalMaterial({ color: '#f3e6cf', roughness: .95, sheen: 1, sheenColor: '#ffffff' })), face = matte('#8d4a26', .6);
  for (const [x, y, z, r] of [[0, .62, 0, .36], [-.28, .58, .12, .26], [.26, .6, .14, .25], [-.3, .58, -.14, .25], [.22, .58, -.16, .25], [0, .82, 0, .26], [-.12, .78, .2, .22], [.1, .78, -.2, .22], [-.42, .66, 0, .2]]) g.add(ball(r, wool, x, y, z));
  for (const [x, z] of [[.2, .15], [.2, -.15], [-.22, .15], [-.22, -.15]]) g.add(M(new THREE.CapsuleGeometry(.055, .2, 6, 12), matte('#4e2f1c', .6), x, .2, z));
  const head = G(.45, .72, 0); g.add(head); head.add(ball(.22, face, 0, 0, 0, 1.05, 1, .9));
  head.add(ball(.14, wool, -.05, .17, 0, 1, .7, 1));                        // woolly fringe
  head.add(ball(.1, matte('#b5704a', .55), .17, -.08, 0, .8, .7, 1));       // muzzle
  for (const s of [1, -1]) {
    const eye = G(.12, .04, s * .13); head.add(eye); eye.rotation.y = -s * .6;
    eye.add(ball(.075, gloss('#fbf7f2'), 0, 0, 0, .6, 1.1, 1)); eye.add(ball(.05, gloss('#1d0f08'), .035, -.008, 0, .5, 1.05, 1));
    eye.add(ball(.013, once('hl', () => new THREE.MeshBasicMaterial({ color: '#ffffff' })), .055, .02, .015));
    put(head, ball(.08, face, -.06, .06, s * .22, .5, .3, 1)).rotation.x = s * .5; // ear
  }
  return g;
}
export function goat() {
  const g = G(), hair = matte('#f4efe6', .8), patch = matte('#5d4037', .8);
  g.add(ball(.36, hair, 0, .6, 0, 1.25, .85, .8)); g.add(ball(.16, patch, -.12, .72, .18, 1.3, 1, .4));
  for (const [x, z] of [[.24, .14], [.24, -.14], [-.26, .14], [-.26, -.14]]) g.add(M(new THREE.CapsuleGeometry(.05, .26, 6, 12), hair, x, .22, z));
  const head = G(.5, .86, 0); g.add(head); head.add(ball(.18, hair, 0, 0, 0, 1.2, .95, .85));
  put(head, M(new THREE.ConeGeometry(.05, .16, 10), hair, .12, -.2, 0)).rotation.z = Math.PI; // beard
  for (const s of [1, -1]) {
    head.add(ball(.04, gloss('#1d0f08'), .14, .05, s * .1));
    put(head, M(new THREE.ConeGeometry(.03, .22, 10), matte('#bdb3a4', .5), -.05, .2, s * .06)).rotation.z = .5; // horn
    put(head, ball(.09, hair, -.06, .02, s * .17, .4, .25, 1)).rotation.x = s * .9;                         // ear
  }
  return g;
}
export function drum(k = 'L') {
  const g = G(), body = matte(k === 'L' ? '#8d4a26' : '#c62828', .6), skin = matte('#f3e2c7', .7);
  g.add(M(new THREE.CylinderGeometry(.42, .32, .9, 40), body, 0, .45, 0));
  g.add(M(new THREE.CylinderGeometry(.43, .43, .04, 40), skin, 0, .91, 0));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const c = M(new THREE.CylinderGeometry(.012, .012, .9, 6), skin, Math.cos(a) * .375, .45, Math.sin(a) * .375); c.rotation.set(-Math.sin(a) * .11, 0, Math.cos(a) * .11); g.add(c); }
  put(g, M(new THREE.TorusGeometry(.42, .03, 8, 40), gloss('#FDD835'), 0, .86, 0)).rotation.x = Math.PI / 2;
  return g;
}
export const bean = () => { const g = G(); g.add(ball(.2, gloss('#8d3b2a'), 0, .12, 0, 1.4, .75, .9)); g.add(ball(.05, matte('#d08b72', .5), .05, .2, .06, 1.6, .4, .6)); return g; };
export const cob = () => { const g = G(); g.add(ball(.14, gloss('#FDD835'), 0, .32, 0, .8, 2.2, .8)); put(g, ball(.13, matte('#66bb6a', .7), -.08, .22, .05, .6, 2, .7)).rotation.z = .35; return g; };
export const stone = () => { const g = G(); for (const [x, y, z, r, c] of [[-.1, .13, 0, .17, '#9e9e9e'], [.14, .11, .06, .14, '#8d8d8d'], [.02, .28, .02, .12, '#b0b0b0']]) g.add(ball(r, matte(c, .9), x, y, z, 1.15, .85, 1)); return g; };
export function basket(item) {
  const g = G(), weave = matte('#c8a165', .9);
  g.add(M(new THREE.CylinderGeometry(.55, .42, .5, 40, 1, true), weave, 0, .25, 0));
  g.add(M(new THREE.CylinderGeometry(.42, .42, .03, 40), weave, 0, .02, 0));
  for (const y of [.12, .25, .38]) put(g, M(new THREE.TorusGeometry(.43 + y * .25, .018, 6, 48), matte('#9c7a45', .9), 0, y, 0)).rotation.x = Math.PI / 2;
  put(g, M(new THREE.TorusGeometry(.56, .045, 10, 48), matte('#a8844f', .9), 0, .5, 0)).rotation.x = Math.PI / 2;
  if (item) for (const [x, z, r] of [[-.15, .05, .3], [.15, -.05, -.4], [0, .15, 1.2]]) { const it = item(); it.position.set(x, .38, z); it.rotation.y = r; it.scale.setScalar(.8); g.add(it); }
  return g;
}
export function cup(level = .6) {
  const g = G(), glass = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .1, transparent: true, opacity: .45 });
  g.add(M(new THREE.CylinderGeometry(.26, .21, .6, 32, 1, true), glass, 0, .3, 0));
  if (level > 0) g.add(M(new THREE.CylinderGeometry(.205 + .05 * level, .205, .58 * level, 32), matte('#fffdf4', .5), 0, .29 * level + .01, 0));
  put(g, M(new THREE.TorusGeometry(.12, .025, 8, 24, Math.PI), glass, .27, .32, 0)).rotation.z = -Math.PI / 2;
  return g;
}
export function shukaCloth() { const g = G(); for (let i = 0; i < 3; i++) put(g, M(new THREE.BoxGeometry(1, .08, .7), shuka('#c62828'), 0, .04 + i * .085, 0)).rotation.y = (i - 1) * .06; return g; }
export function sun3d() {
  const g = G(), core = new THREE.MeshStandardMaterial({ color: '#ffd54f', emissive: '#ffb300', emissiveIntensity: .8, roughness: .4 });
  g.add(ball(.4, core, 0, .6, 0));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; put(g, M(new THREE.ConeGeometry(.07, .26, 12), core, Math.cos(a) * .58, .6 + Math.sin(a) * .58, 0)).rotation.z = a - Math.PI / 2; }
  return g;
}
export function drop() {
  const g = G(), w = new THREE.MeshPhysicalMaterial({ color: '#4fc3f7', roughness: .05, clearcoat: 1 });
  g.add(ball(.3, w, 0, .32, 0)); g.add(M(new THREE.ConeGeometry(.29, .5, 32), w, 0, .7, 0)); g.add(ball(.07, new THREE.MeshBasicMaterial({ color: '#ffffff' }), -.12, .42, .25));
  return g;
}
export function stick(len = 1.6) {
  const g = G(), wood = matte('#8d6e63', .9);
  g.add(M(new THREE.CylinderGeometry(.06, .07, len, 12), wood, 0, len / 2, 0));
  put(g, M(new THREE.CylinderGeometry(.03, .02, .25, 8), wood, .07, len * .7, 0)).rotation.z = -.6; // a little side twig
  return g;
}
export function bundle() {
  const g = G();
  for (let i = 0; i < 10; i++) { const s = stick(1.6); s.position.set((i % 5 - 2) * .13, 0, i < 5 ? .06 : -.06); s.rotation.z = (i % 5 - 2) * .02; g.add(s); }
  for (const y of [.45, 1.1]) put(g, M(new THREE.TorusGeometry(.36, .03, 8, 32), matte('#c62828', .7), 0, y, 0)).rotation.x = Math.PI / 2;
  return g;
}
// A glossy block with letters printed on the front (syllables, letters, sums).
export function textBlock(text, col = '#ffffff', ink = '#2a1a12', w = .9) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 220; const x = c.getContext('2d');
  x.fillStyle = col; x.fillRect(0, 0, 256, 220); x.fillStyle = ink; x.font = '900 150px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 118);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const side = new THREE.MeshPhysicalMaterial({ color: col, roughness: .35, clearcoat: .6 }), face = new THREE.MeshPhysicalMaterial({ map: t, roughness: .35, clearcoat: .6 });
  const g = G(); g.add(M(new THREE.BoxGeometry(w, .78, .3), [side, side, side, side, face, side], 0, .39, 0)); return g;
}
export function coin() { const g = G(); put(g, M(new THREE.CylinderGeometry(.3, .3, .07, 40), gloss('#fbc02d'), 0, .3, 0)).rotation.x = Math.PI / 2; g.add(M(new THREE.TorusGeometry(.24, .02, 8, 40), gloss('#f9a825'), 0, .3, .04)); return g; }
export function beadString(cols = ['#E53935', '#ffffff', '#1E88E5', '#FDD835', '#E53935', '#ffffff', '#43A047']) {
  const g = G(); cols.forEach((c, i) => { const a = Math.PI * (i + .5) / cols.length; g.add(ball(.13, gloss(c), -Math.cos(a) * .9, .7 - Math.sin(a) * .45, 0)); }); return g;
}
