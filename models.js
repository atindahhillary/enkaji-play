// 3D clay-style models for Enkaji Play, built from three.js primitives (no model files).
// Used by the story player (story3d.js) and the portrait studio (studio.html).
// Units: 1 = about 1 metre. Characters face +Z, animals face +X.
import * as THREE from './vendor/three.module.min.js';

export { THREE };
const SEG = 20;
const mats = {};
// Matte clay material, cached per colour.
export const clay = (color, rough = .78) => mats[color + rough] || (mats[color + rough] = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 }));
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
const sphere = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = mesh(new THREE.SphereGeometry(r, SEG, SEG / 1.5 | 0), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
const capsule = (r, len, mat) => mesh(new THREE.CapsuleGeometry(r, len, 6, SEG), mat);
// A capsule laid between two points (used for limbs, necks, horns).
function limb(r, a, b, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const m = capsule(r, Math.max(.001, len), mat);
  m.position.copy(A.clone().add(B).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}

// Maasai shuka check cloth as a small canvas texture.
const texCache = {};
export function shukaTex(base, line = 'rgba(0,0,0,.28)', thin = 'rgba(0,0,0,.5)') {
  const k = base + line; if (texCache[k]) return texCache[k];
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  g.fillStyle = line; g.fillRect(0, 24, 64, 10); g.fillRect(24, 0, 10, 64);
  g.fillStyle = thin; g.fillRect(0, 50, 64, 2); g.fillRect(50, 0, 2, 64);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3); t.colorSpace = THREE.SRGBColorSpace;
  return texCache[k] = t;
}
const cloth = (base) => new THREE.MeshStandardMaterial({ map: shukaTex(base), roughness: .9 });

// Beaded collar (enkarewa): flat rings of colour, like Maasai beadwork.
function beadCollar(cols, r0, y, scale = 1) {
  const g = new THREE.Group();
  cols.forEach((c, i) => {
    const ring = mesh(new THREE.TorusGeometry((r0 + i * .028) * scale, .016 * scale, 8, 40), clay(c, .45));
    ring.rotation.x = Math.PI / 2; ring.position.y = -i * .012 * scale; g.add(ring);
  });
  g.position.y = y; g.rotation.x = .35;
  return g;
}

// ---------- People ----------
// kind: woman | man | girl | boy | elder.  o: { wrap, collar[], skin, holding }
export function person(o = {}) {
  const kind = o.kind || 'woman', child = kind === 'girl' || kind === 'boy', female = kind !== 'man' && kind !== 'boy';
  const skin = clay(o.skin || '#7a4a2e', .55), dark = clay('#1a0f0a', .5), wrap = cloth(o.wrap || '#c62828');
  const cols = o.collar || ['#E53935', '#ffffff', '#1E88E5', '#FDD835'];
  const P = new THREE.Group(); P.name = 'person';
  const body = new THREE.Group(); P.add(body);

  // Legs and sandals
  const legs = [-1, 1].map(s => {
    const leg = new THREE.Group(); leg.position.set(s * .085, .78, 0);
    leg.add(limb(.058, [0, 0, 0], [0, -.68, 0], skin));
    const foot = mesh(new THREE.BoxGeometry(.11, .05, .2), clay('#6d4c41'), 0, -.74, .04); leg.add(foot);
    body.add(leg); return leg;
  });
  // Shuka: a lathe-turned robe, longer for women
  const hem = female ? .42 : .62;
  const prof = [[.0, 1.47], [.2, 1.46], [.24, 1.36], [.22, 1.15], [.25, .9], [female ? .32 : .27, hem], [0, hem]].map(([r, y]) => new THREE.Vector2(r, y));
  const robe = mesh(new THREE.LatheGeometry(prof, 28), wrap); body.add(robe);
  if (!female) body.add(sphere(.07, wrap, .2, 1.43, .02, 1, .8, 1));
  // Arms with hands, as pivot groups so they can wave and swing
  const arms = [-1, 1].map(s => {
    const arm = new THREE.Group(); arm.position.set(s * .25, 1.4, 0);
    arm.add(limb(.05, [0, 0, 0], [s * .06, -.5, .04], skin));
    arm.add(sphere(.055, skin, s * .065, -.56, .05));
    arm.rotation.z = s * .12; body.add(arm); return arm;
  });
  // Neck, collar, head
  body.add(limb(.055, [0, 1.42, 0], [0, 1.52, 0], skin));
  body.add(beadCollar(cols, .1, 1.5));
  const head = new THREE.Group(); head.position.set(0, 1.64, 0); body.add(head);
  head.add(sphere(.135, skin, 0, 0, 0, 1, 1.08, 1));
  // Close-cropped hair (Maasai women often shave their heads), grey for elders
  const hairGeo = new THREE.SphereGeometry(.14, SEG, 12, 0, Math.PI * 2, 0, Math.PI * .45);
  const hair = mesh(hairGeo, clay(kind === 'elder' ? '#cfc8bd' : '#140b07', .95), 0, .015, -.005); hair.scale.set(1, 1.08, 1); head.add(hair);
  // Face: eyes with highlights, brows, nose, smile
  [-1, 1].forEach(s => {
    head.add(sphere(.02, clay('#ffffff', .3), s * .048, .02, .122));
    head.add(sphere(.013, dark, s * .048, .02, .136));
    head.add(sphere(.004, clay('#ffffff', .2), s * .044, .025, .148));
    const brow = mesh(new THREE.BoxGeometry(.04, .009, .01), dark, s * .05, .063, .123); brow.rotation.z = -s * .15; head.add(brow);
    head.add(sphere(.03, skin, s * .14, 0, 0, .5, 1, .8)); // ears
    if (female) { // long beaded earrings
      const loop = mesh(new THREE.TorusGeometry(.04, .009, 6, 16), clay(cols[0], .4), s * .15, -.07, 0); loop.rotation.y = Math.PI / 2; head.add(loop);
      head.add(sphere(.014, clay(cols[2] || '#1E88E5', .4), s * .15, -.115, 0));
    }
  });
  head.add(sphere(.024, clay('#4a2a18', .6), 0, -.02, .135, 1, .8, 1));
  const smile = mesh(new THREE.TorusGeometry(.035, .008, 6, 16, Math.PI), clay('#6b1d1d', .5), 0, -.055, .122); smile.rotation.z = Math.PI; head.add(smile);
  if (kind === 'girl') { const band = mesh(new THREE.TorusGeometry(.142, .014, 8, 32), clay(cols[2] || '#1E88E5', .4), 0, .075, 0); band.rotation.x = Math.PI / 2 - .35; head.add(band); }
  if (kind === 'elder') { const stick = limb(.018, [.32, 0, .1], [.34, 1.2, .1], clay('#6d4c41')); body.add(stick); }

  if (!female && !child) { robe.scale.set(1.15, 1, 1.05); arms.forEach((a, i) => a.position.x = (i ? 1 : -1) * .29); head.scale.set(.97, 1.05, .97); }
  if (female && !child) { // beaded headband with hanging beads, worn by Maasai women
    const band = mesh(new THREE.TorusGeometry(.148, .012, 8, 32), clay(cols[1] || '#ffffff', .4), 0, .05, -.01); band.rotation.x = Math.PI / 2 - .38; head.add(band);
    [-1, 1].forEach(sd => [0, 1, 2].forEach(j => head.add(sphere(.011, clay(cols[j % cols.length], .4), sd * .128, .03 - j * .03, .05))));
  }
  if (child) P.scale.setScalar(.62), head.scale.setScalar(1.22);
  P.userData = { legs, arms, head, body, kind };
  return P;
}

// ---------- Animals ----------
// East African zebu: hump, dewlap, lyre horns. coat = main colour, patch = optional patches.
export function cow(coat = '#8d5524', o = {}) {
  const C = new THREE.Group(), m = clay(coat), dark = clay('#1a0f0a', .5), horn = clay('#efe6cf', .5);
  C.add(sphere(.34, m, 0, .9, 0, 1.55, .95, .85));                 // body
  C.add(sphere(.18, m, .32, 1.16, 0, 1, .9, .8));                   // hump
  C.add(sphere(.13, m, .55, .86, 0, .6, 1.1, .4));                  // dewlap
  C.add(limb(.12, [.42, 1.0, 0], [.7, 1.05, 0], m));                // neck
  const head = new THREE.Group(); head.position.set(.78, 1.04, 0); C.add(head);
  head.add(limb(.11, [0, .04, 0], [.2, -.12, 0], m));
  head.add(sphere(.09, clay(o.muzzle || '#d7a98c', .5), .25, -.17, 0, 1, .8, 1.1));
  [-1, 1].forEach(s => {
    head.add(sphere(.022, dark, .1, .02, s * .085));
    head.add(sphere(.007, clay('#fff', .2), .115, .03, s * .1));
    const ear = sphere(.045, m, -.04, -.01, s * .12, .45, .3, 1); ear.rotation.x = s * .5; head.add(ear);
    // lyre-shaped horn from a curve
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.02, .1, s * .07), new THREE.Vector3(-.05, .24, s * .2), new THREE.Vector3(.0, .42, s * .25), new THREE.Vector3(.06, .52, s * .17)]);
    head.add(mesh(new THREE.TubeGeometry(curve, 12, .024, 8), horn));
    head.add(sphere(.012, clay('#3e2723'), .06, .52, s * .17));
  });
  const legs = [[.32, .17], [.32, -.17], [-.32, .17], [-.32, -.17]].map(([x, z]) => {
    const leg = new THREE.Group(); leg.position.set(x, .72, z);
    leg.add(limb(.055, [0, 0, 0], [0, -.62, 0], m));
    leg.add(mesh(new THREE.CylinderGeometry(.05, .06, .07, 10), dark, 0, -.68, 0));
    C.add(leg); return leg;
  });
  const tail = new THREE.Group(); tail.position.set(-.52, 1.0, 0); C.add(tail);
  tail.add(limb(.015, [0, 0, 0], [-.05, -.55, 0], m)); tail.add(sphere(.045, dark, -.05, -.6, 0, .8, 1.4, .8));
  (o.patches || []).forEach(([x, y, z, r]) => C.add(sphere(r, clay(o.patch || '#f2efe6'), x, y, z, 1.2, .8, .4)));
  if (o.bell) { const b = mesh(new THREE.ConeGeometry(.05, .09, 10), clay('#b8860b', .3), .6, .72, 0); C.add(b); }
  C.userData = { legs, head, tail };
  return C;
}

// Red Maasai sheep (fat-tailed). mascot adds big eyes and a bead collar (Kerri).
export function sheep(o = {}) {
  const S = new THREE.Group(), coat = clay(o.coat || '#a0522d', .9), face = clay(o.face || '#7b3f1f', .7), dark = clay('#1a0f0a', .5);
  S.add(sphere(.27, coat, 0, .62, 0, 1.35, .95, .9));
  const wool = clay(o.wool || '#e9c9a0', .95);
  for (let i = 0; i < 26; i++) { const a = i * 2.4, b = (i % 5) / 5 * 1.2 - .6; S.add(sphere(.075, wool, Math.cos(a) * .3 * Math.cos(b) * 1.1, .7 + Math.sin(b) * .2, Math.sin(a) * .22 * Math.cos(b))); }
  S.add(sphere(.16, coat, -.36, .5, 0, .8, 1.1, 1));               // fat tail
  const head = new THREE.Group(); head.position.set(.38, .78, 0); S.add(head);
  head.add(sphere(.13, face, 0, 0, 0, 1.15, .95, .9));
  head.add(sphere(.08, clay('#d9a27a', .6), .11, -.05, 0, 1, .85, 1));
  head.add(sphere(.07, wool, -.03, .11, 0, 1, .7, 1.1));
  const eye = o.mascot ? .036 : .02;
  [-1, 1].forEach(s => {
    head.add(sphere(eye, clay('#fff', .3), .09, .04, s * .07));
    head.add(sphere(eye * .6, dark, .11, .04, s * .075));
    const ear = sphere(.07, face, -.03, -.06, s * .13, .35, 1, .3); ear.rotation.x = s * .9; head.add(ear);
  });
  if (o.mascot) { const col = beadCollar(['#E53935', '#1E88E5', '#FDD835'], .1, 0, .95); col.rotation.set(0, 0, Math.PI / 2 - .35); col.position.set(.26, .7, 0); col.scale.setScalar(1.15); S.add(col); }
  const legs = [[.2, .12], [.2, -.12], [-.2, .12], [-.2, -.12]].map(([x, z]) => {
    const leg = new THREE.Group(); leg.position.set(x, .45, z);
    leg.add(limb(.045, [0, 0, 0], [0, -.42, 0], face)); S.add(leg); return leg;
  });
  S.userData = { legs, head };
  return S;
}

export function goat(o = {}) {
  const G = new THREE.Group(), coat = clay(o.coat || '#f2efe6', .85), patch = clay(o.patch || '#3e2723', .85), dark = clay('#1a0f0a', .5);
  G.add(sphere(.22, coat, 0, .62, 0, 1.4, .9, .8));
  G.add(sphere(.12, patch, -.1, .7, .1, 1.3, .8, .5));
  const head = new THREE.Group(); head.position.set(.34, .85, 0); G.add(head);
  head.add(limb(.075, [0, 0, 0], [.14, -.1, 0], coat));
  [-1, 1].forEach(s => {
    head.add(sphere(.016, dark, .07, .02, s * .06));
    head.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, .06, s * .04), new THREE.Vector3(-.06, .15, s * .05), new THREE.Vector3(-.13, .15, s * .05)]), 8, .014, 6), clay('#8d8478')));
    const ear = sphere(.05, coat, 0, 0, s * .1, .4, .2, 1); ear.rotation.x = s * .5; head.add(ear);
  });
  head.add(sphere(.03, patch, .16, -.17, 0, .6, 1.4, .6));          // beard
  const tail = sphere(.04, coat, -.3, .78, 0, .6, 1.5, .6); tail.rotation.z = -.6; G.add(tail);
  const legs = [[.18, .1], [.18, -.1], [-.18, .1], [-.18, -.1]].map(([x, z]) => { const leg = new THREE.Group(); leg.position.set(x, .45, z); leg.add(limb(.03, [0, 0, 0], [0, -.42, 0], coat)); G.add(leg); return leg; });
  G.userData = { legs, head };
  return G;
}

// ---------- Props ----------
export function acacia(s = 1) {
  const T = new THREE.Group(), bark = clay('#5d4037', .95);
  T.add(limb(.09, [0, 0, 0], [.1, 1.8, 0], bark));
  T.add(limb(.06, [.08, 1.4, 0], [-.7, 2.4, .2], bark)); T.add(limb(.06, [.1, 1.5, 0], [.8, 2.4, -.2], bark));
  [[0, 2.55, 0, 1.6], [-.8, 2.45, .3, 1.0], [.9, 2.45, -.2, 1.0], [.1, 2.7, -.4, .9]].forEach(([x, y, z, r]) => T.add(sphere(r, clay(['#6b8e23', '#7aa02c', '#5f7f1f'][Math.abs(x * 10 | 0) % 3], .95), x, y, z, 1, .22, 1)));
  T.scale.setScalar(s); return T;
}
export function hut(s = 1) {
  const H = new THREE.Group(), mud = clay('#8d6e63', .98);
  const dome = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mud); dome.scale.set(1.3, .95, 1); H.add(dome);
  for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(1.3 - i * .2, .02, 6, 40), clay('#6d4c41')); r.rotation.x = Math.PI / 2; r.position.y = .25 + i * .25; r.scale.y = 1 / 1.3; H.add(r); }
  H.add(mesh(new THREE.BoxGeometry(.4, .55, .1), clay('#2a1a12'), 0, .27, .98));
  H.scale.setScalar(s); return H;
}
// A ring of thorn-branch posts: the boma / enkang fence
export function boma(r = 3, open = .6) {
  const B = new THREE.Group(), wood = clay('#795548', .95);
  for (let a = open; a < Math.PI * 2 - open; a += .2) {
    const h = .45 + ((a * 13) % 1) * .3, p = limb(.035, [Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a) * r * 1.03, h, Math.sin(a) * r * 1.03], wood); B.add(p);
  }
  return B;
}
export function brick(color, scale = 1) {
  const B = new THREE.Group(), m = clay(color, .35);
  B.add(mesh(new THREE.BoxGeometry(.32, .19, .16), m, 0, .095, 0));
  for (let i = 0; i < 4; i++) for (const z of [-.04, .04]) B.add(mesh(new THREE.CylinderGeometry(.03, .03, .04, 12), m, -.12 + i * .08, .21, z));
  B.scale.setScalar(scale); return B;
}
export function maize(h = 1) {
  const M = new THREE.Group(), green = clay('#43A047', .8);
  M.add(limb(.03, [0, 0, 0], [0, 1.6 * h, 0], green));
  for (let i = 0; i < 5; i++) { const leaf = sphere(.25 * h, green, Math.cos(i * 2.3) * .2, (.4 + i * .25) * h, Math.sin(i * 2.3) * .2, 1, .08, .3); leaf.rotation.y = i * 2.3; leaf.rotation.z = .5; M.add(leaf); }
  if (h > .8) M.add(sphere(.07, clay('#FDD835', .6), .08, 1.0 * h, 0, .8, 2, .8));
  return M;
}

// Ground with a few gentle hills, warm savanna grass.
export function ground(color = '#d9c37a') {
  const g = new THREE.PlaneGeometry(80, 80, 40, 40), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), d = Math.hypot(x, y); p.setZ(i, d > 10 ? Math.sin(x * .2) * Math.cos(y * .15) * 1.2 * Math.min(1, (d - 10) / 10) : 0); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, clay(color, 1)); m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  return m;
}

// ---------- Procedural motion (no model files, no animation clips) ----------
export function walk(obj, t, speed = 6, amp = .5) {
  const u = obj.userData; if (!u.legs) return;
  u.legs.forEach((l, i) => { l.rotation[obj.name === 'person' ? 'x' : 'z'] = Math.sin(t * speed + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * amp; });
  if (u.arms) u.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * speed + (i ? 0 : Math.PI)) * amp * .7; });
  if (u.body) u.body.position.y = Math.abs(Math.sin(t * speed)) * .03;
}
export function idle(obj, t, k = 0) {
  const u = obj.userData;
  if (u.body) u.body.scale.y = 1 + Math.sin(t * 2 + k) * .008;
  if (u.head) u.head.rotation.y = Math.sin(t * .7 + k) * .15;
  if (u.tail) u.tail.rotation.x = Math.sin(t * 3 + k) * .4;
}
export function wave(obj, t) { const a = obj.userData.arms; if (a) { a[1].rotation.z = 2.4 + Math.sin(t * 8) * .35; a[1].rotation.x = 0; } }

// Standard lighting rig: warm sun with soft shadows plus sky fill.
export function lights(scene, sky = 'day') {
  const warm = { day: 0xfff1d6, dawn: 0xffc49a, sunset: 0xff9e5e, night: 0x8fa6ff }[sky];
  const hemi = new THREE.HemisphereLight(sky === 'night' ? 0x3b4a86 : 0xbfe6ff, 0x8a6d3b, sky === 'night' ? .5 : .9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(warm, sky === 'night' ? .5 : 2.2); sun.position.set(6, 10, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xfff4e8, sky === 'night' ? .3 : .9); fill.position.set(-2, 3, 8); scene.add(fill);
  return sun;
}
