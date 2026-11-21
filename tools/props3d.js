// Renders Kerri, word pictures, game props and the 13 game tiles (tools only). Each object is framed
// automatically from its bounding box and saved on a transparent background.
import { THREE, cow, hut, acacia, fire, brick, BRICK_COLS, lamb, goat, drum, bean, cob, stone, basket, cup, shukaCloth, sun3d, drop, stick, bundle, textBlock, coin, beadString } from './cast3d.js';

const B = Object.fromEntries(['r', 'o', 'g', 'b', 'p', 'y'].map((k, i) => [k, BRICK_COLS[i]]));
const grp = (...items) => { const g = new THREE.Group(); items.forEach(([o, x = 0, z = 0, ry = 0, s = 1, y = 0]) => { o.position.set(x, y, z); o.rotation.y = ry; o.scale.multiplyScalar(s); g.add(o); }); return g; };

export const PROPS = {
  kerri: [() => lamb(), 240, 220, .55],
  'pic-goat': [() => goat(), 240, 200, .55], 'pic-hut': [() => hut(), 240, 200, .3], 'pic-tree': [() => acacia(), 240, 200, .2],
  'pic-beads': [() => beadString(), 240, 160, 0, .05], 'pic-sun': [() => sun3d(), 220, 220, 0, 0], 'pic-water': [() => drop(), 180, 220, .2, .1],
  'pic-fire': [() => fire(), 200, 220, .4], 'pic-cup': [() => cup(.75), 180, 220, .2], 'pic-shuka': [() => shukaCloth(), 240, 180, .4, .55],
  'pic-brick': [() => brick(B.r), 240, 150, .4],
  'hv-bean': [() => bean(), 150, 110, .3, .5], 'hv-maize': [() => cob(), 120, 220, .3, .15], 'hv-stone': [() => stone(), 150, 110, .3, .45],
  'basket-bean': [() => basket(bean), 260, 210, 0, .5], 'basket-maize': [() => basket(cob), 260, 210, 0, .5], 'basket-stone': [() => basket(stone), 260, 210, 0, .5],
  'drum-L': [() => drum('L'), 240, 280, 0, .45], 'drum-H': [() => drum('H'), 240, 280, 0, .45],
  stick: [() => stick(), 56, 360, 0, .05, 1.02], bundle: [() => bundle(), 210, 270, .1, .15, 1.02],
};
// Game tiles (4:3), one small 3D still life per game.
const T = (f, yaw = .35, pitch = .35) => [f, 360, 270, yaw, pitch];
export const TILES = {
  copy: T(() => grp([brick(B.r), 0, 0, 0, 1, 0], [brick(B.y), 0, 0, .1, 1, .2], [brick(B.b), 0, 0, -.1, 1, .4], [brick(B.g), .55, .2, .6], [brick(B.o), -.55, .25, -.5])),
  cattle: T(() => grp([cow('#a0612c', '#f4efe6'), -.7, 0, -.4, .9], [cow('#f4efe6', '#2b1d16'), .8, -.3, -.8, .85]), .1, .3),
  beads: T(() => beadString(), 0, .1),
  colour: T(() => grp([brick(B.r), -.45, -.2, .3], [brick(B.g), .4, -.25, -.4], [brick(B.b), -.35, .3, -.2], [brick(B.p), .45, .3, .5])),
  code: T(() => grp([cow('#a0612c', '#f4efe6'), -.9, -.2, -1.2, .7], [textBlock('→', '#ffffff', '#1565C0', .6), .05, .4, 0, 1], [textBlock('→', '#ffffff', '#1565C0', .6), .7, .4, 0, 1], [drop(), 1.4, 0, 0, .9]), .1, .25),
  harvest: T(() => grp([basket(cob), 0, 0, 0, 1], [bean(), .9, .4, .4], [stone(), -.9, .4]), .1, .4),
  milk: T(() => grp([cup(.3), -.6, 0], [cup(.6), 0, 0], [cup(.9), .6, 0]), 0, .2),
  drum: T(() => grp([drum('L'), -.45, 0, 0, 1], [drum('H'), .5, .2, 0, .75]), .1, .35),
  silabi: T(() => grp([textBlock('ma', '#FDD835'), -.5, 0, .1], [textBlock('ji', '#29B6F6', '#ffffff'), .5, .1, -.1]), 0, .2),
  letters: T(() => grp([textBlock('c', '#ffffff', '#E53935', .8), -.6, .2, .15], [cow('#a0612c', '#f4efe6'), .7, -.2, -.9, .6]), .1, .25),
  herd: T(() => grp([textBlock('3+2', '#FDD835', '#2a1a12', 1.5), 0, .5, 0, .8], [cow('#f4efe6', '#2b1d16'), -.9, -.6, -.6, .55], [cow('#3a2a20', '#f4efe6'), .9, -.6, -1, .55]), 0, .3),
  firewood: T(() => grp([bundle(), -.6, 0, 0, .6], [stick(), .1, .1, 0, .6], [fire(), .8, .2, 0, .9]), .1, .3),
  market: T(() => grp([coin(), -.5, .2, 0, 1, 0], [coin(), -.45, .1, .3, 1, .08], [shukaCloth(), .5, 0, .4, .8]), .1, .45),
};

// Frame an object from its bounding box: yaw turns the camera round it, pitch looks down on it.
export function frame(obj, w, h, yaw = .3, pitch = .3, pad = 1.12) {
  const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const fov = 24, t = Math.tan(THREE.MathUtils.degToRad(fov / 2)), aspect = w / h;
  const dist = Math.max(s.y / 2 / t, Math.max(s.x, s.z) / 2 / (t * aspect)) * pad + Math.max(s.x, s.z) / 2;
  const cam = new THREE.PerspectiveCamera(fov, aspect, .05, 100);
  cam.position.set(c.x + Math.sin(yaw) * Math.cos(pitch) * dist, c.y + Math.sin(pitch) * dist, c.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  cam.lookAt(c); return cam;
}
