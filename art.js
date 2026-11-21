// Hand-drawn explainer-style SVG art: thick ink outlines, flat warm colours, hand-lettered labels.
// Scenes build up piece by piece (pop-in), with sparkles, arrows and a slow camera push.

const INK = '#2a1a12', SKIN = '#7a4a2e', SKIN_D = '#5e3620', HAIR = '#1b1110';
let _gid = 0;
const uid = p => p + (++_gid);
// An outlined limb: a fat ink stroke with a thinner colour stroke on top.
const limb = (d, col, w = 9) => `<path d="${d}" stroke="${INK}" stroke-width="${w + 5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

// One DUPLO-style 2x4 brick seen from the side. u = stud width in px.
function brickSVG(c, x, y, u = 20) {
  const hex = BRICK[c].hex, w = u * 4, h = u * 1.2, sw = Math.max(1.5, u / 9);
  let s = `<g class="brk">`;
  for (let i = 0; i < 4; i++) s += `<rect x="${x + i * u + u * 0.18}" y="${y - u * 0.32}" width="${u * 0.64}" height="${u * 0.4}" rx="${u * .12}" fill="${hex}" stroke="${INK}" stroke-width="${sw}"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${u * .15}" fill="${hex}" stroke="${INK}" stroke-width="${sw}"/>` +
    `<rect x="${x + u * .2}" y="${y + u * .18}" width="${w - u * .4}" height="${h * 0.22}" rx="2" fill="rgba(255,255,255,.35)"/>`;
  return s + '</g>';
}

// Build from [colour, xStud, level] list. Returns a full svg.
function buildSVG(list, opts = {}) {
  const u = opts.u || 20, maxX = Math.max(16, ...list.map(b => b[1] + 4)), maxL = Math.max(3, ...list.map(b => b[2] + 1));
  const W = maxX * u + 20, H = maxL * u * 1.2 + 30;
  const body = list.map((b, i) => `<g class="drop" style="animation-delay:${opts.anim ? i * 0.5 : 0}s">${brickSVG(b[0], 10 + b[1] * u, H - 10 - (b[2] + 1) * u * 1.2, u)}</g>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="build" role="img" aria-label="Brick model"><rect x="0" y="${H - 10}" width="${W}" height="10" rx="5" fill="#e8d9b5"/>${body}</svg>`;
}
// Vertical tower of colours (for games).
function towerSVG(cols, u = 22) {
  const H = Math.max(cols.length * u * 1.2 + 20, 60), W = u * 4 + 20;
  return `<svg viewBox="0 0 ${W} ${H}" class="tower" aria-hidden="true">${cols.map((c, i) => brickSVG(c, 10, H - 6 - (i + 1) * u * 1.2, u)).join('')}</svg>`;
}

// ---------- People ----------
// o: { kind: woman|man|girl|boy|elder, wrap, collar[], wave, point, holding, cls }
const kindOf = o => o.kind || (o.elder ? 'elder' : o.child ? (o.boy ? 'boy' : 'girl') : o.man ? 'man' : 'woman');
function person(x, y, s = 1, o = {}) {
  const kind = kindOf(o), child = kind === 'girl' || kind === 'boy', male = kind === 'man' || kind === 'boy';
  const wrap = o.wrap || '#c62828', cols = o.collar || ['#E53935', '#ffffff', '#1E88E5', '#FDD835'];
  const hem = male ? -80 : -56, clip = uid('rb');
  const robe = `M-30 -170 Q-40 -120 -42 ${hem} Q0 ${hem + 12} 42 ${hem} Q40 -120 30 -170 Q0 -178 -30 -170Z`;
  let checks = '';
  for (let v = -40; v <= 40; v += 18) checks += `<path d="M${v} -180 V${hem + 14}" stroke="rgba(0,0,0,.22)" stroke-width="6"/><path d="M${v + 7} -180 V${hem + 14}" stroke="rgba(0,0,0,.45)" stroke-width="1.4"/>`;
  for (let h = -165; h <= hem + 10; h += 18) checks += `<path d="M-45 ${h} H45" stroke="rgba(0,0,0,.22)" stroke-width="6"/><path d="M-45 ${h + 7} H45" stroke="rgba(0,0,0,.45)" stroke-width="1.4"/>`;
  const rArm = o.wave ? 'M28 -160 Q52 -186 54 -226' : o.point ? 'M28 -160 Q58 -150 82 -150' : 'M28 -160 Q40 -128 40 -98';
  const rHand = o.wave ? [54, -230] : o.point ? [86, -150] : [40, -94];
  const rings = (male ? cols.slice(0, 2) : cols).map((c, i, a) => { const k = a.length - 1 - i; return `<ellipse cx="0" cy="-170" rx="${22 + k * 8}" ry="${8 + k * 3}" fill="${a[k]}" stroke="${INK}" stroke-width="2"/>`; }).join('');
  const beads = Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (i + .5) / 9, rx = 22 + ((male ? 2 : cols.length) - 1) * 8, ry = 8 + ((male ? 2 : cols.length) - 1) * 3; return `<circle cx="${(-Math.cos(a) * rx).toFixed(1)}" cy="${(-170 + Math.sin(a) * ry).toFixed(1)}" r="1.6" fill="#fff"/>`; }).join('');
  const earrings = male ? '' : [-1, 1].map(sd => `<path d="M${sd * 26} -200 q${sd * 7} 20 ${sd * -1} 34" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${sd * 26} -200 q${sd * 7} 20 ${sd * -1} 34" stroke="${cols[0]}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="${sd * 25}" cy="-165" r="3.2" fill="${cols[2] || '#1E88E5'}" stroke="${INK}" stroke-width="1.2"/>`).join('');
  const hair = kind === 'elder' ? '#d8d2c6' : HAIR;
  const band = !male && kind !== 'elder' ? `<path d="M-24 -214 Q0 -225 24 -214" stroke="${INK}" stroke-width="7" fill="none"/><path d="M-24 -214 Q0 -225 24 -214" stroke="${cols[2] || '#1E88E5'}" stroke-width="4" fill="none"/>${[-14, -5, 5, 14].map(bx => `<circle cx="${bx}" cy="${-218 + Math.abs(bx) * .18}" r="2" fill="#fff"/>`).join('')}` : '';
  const head = `<g transform="${child ? 'translate(0 -205) scale(1.25) translate(0 205)' : ''}">
    ${[-1, 1].map(sd => `<circle cx="${sd * 25}" cy="-204" r="6" fill="${SKIN}" stroke="${INK}" stroke-width="2.5"/>`).join('')}
    ${earrings}
    <circle cx="0" cy="-205" r="25" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
    <path d="M-24 -211 A25 25 0 0 1 24 -211 Q0 -219 -24 -211Z" fill="${hair}" stroke="${INK}" stroke-width="2.5"/>${band}
    <g class="eyes"><ellipse cx="-9" cy="-203" rx="3" ry="3.8" fill="${INK}"/><ellipse cx="9" cy="-203" rx="3" ry="3.8" fill="${INK}"/><circle cx="-8" cy="-204.5" r="1" fill="#fff"/><circle cx="10" cy="-204.5" r="1" fill="#fff"/></g>
    <path d="M-14 -210 q5 -3 9 0 M5 -210 q5 -3 9 0" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M-2 -197 q2 3 5 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M-8 -190 q8 7 16 0" stroke="${INK}" stroke-width="2.2" fill="#fff" stroke-linecap="round"/>
    <circle cx="-15" cy="-193" r="3.5" fill="#e57373" opacity=".35"/><circle cx="15" cy="-193" r="3.5" fill="#e57373" opacity=".35"/>
  </g>`;
  const staff = kind === 'elder' || o.staff ? limb('M-40 -96 L-46 0', '#8d6e63', 4) : '';
  return `<g transform="translate(${x} ${y}) scale(${s * (child ? .68 : 1)})"><g class="${o.cls || 'bob'}">
    <ellipse cx="0" cy="0" rx="34" ry="7" fill="rgba(0,0,0,.14)"/>
    ${staff}
    ${limb('M-12 -64 V-6', SKIN, 9)}${limb('M12 -64 V-6', SKIN, 9)}
    <ellipse cx="-14" cy="-3" rx="11" ry="5" fill="#6d4c41" stroke="${INK}" stroke-width="2"/><ellipse cx="14" cy="-3" rx="11" ry="5" fill="#6d4c41" stroke="${INK}" stroke-width="2"/>
    ${limb('M-28 -160 Q-40 -128 -40 -98', SKIN, 8)}<circle cx="-40" cy="-94" r="6" fill="${SKIN}" stroke="${INK}" stroke-width="2.5"/>
    <defs><clipPath id="${clip}"><path d="${robe}"/></clipPath></defs>
    <path d="${robe}" fill="${wrap}"/><g clip-path="url(#${clip})">${checks}<path d="M-34 -168 Q6 -120 44 ${hem + 4}" stroke="rgba(0,0,0,.2)" stroke-width="16" fill="none"/></g>
    <path d="${robe}" fill="none" stroke="${INK}" stroke-width="3"/>
    ${male ? `<circle cx="24" cy="-162" r="8" fill="${wrap}" stroke="${INK}" stroke-width="2.5"/>` : ''}
    ${limb(rArm, SKIN, 8)}<circle cx="${rHand[0]}" cy="${rHand[1]}" r="6" fill="${SKIN}" stroke="${INK}" stroke-width="2.5"/>
    ${o.holding ? `<g transform="translate(${rHand[0]} ${rHand[1]})">${o.holding}</g>` : ''}
    ${limb('M0 -170 V-186', SKIN, 11)}
    ${rings}${beads}
    ${head}
  </g></g>`;
}

// ---------- Animals ----------
// East African zebu: hump, dewlap, curved horns. patch = colour of patches (optional).
function cow(x, y, s = 1, col = '#8d5524', flip = false, cls = '', patch) {
  const clip = uid('cw'), pc = patch || (col === '#f2efe6' ? '#8d5524' : null);
  const body = 'M-80 -88 Q-80 -122 -40 -124 L40 -122 Q72 -118 74 -88 Q74 -56 40 -54 L-40 -54 Q-80 -56 -80 -88Z';
  return `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="0" rx="82" ry="8" fill="rgba(0,0,0,.14)"/>
    ${limb('M-72 -96 Q-90 -70 -80 -36', col, 5)}<ellipse cx="-80" cy="-32" rx="6" ry="10" fill="${INK}"/>
    ${limb('M-50 -60 V-6', col, 11)}${limb('M-28 -60 V-6', col, 11)}${limb('M34 -60 V-6', col, 11)}${limb('M56 -60 V-6', col, 11)}
    ${[-50, -28, 34, 56].map(lx => `<rect x="${lx - 8}" y="-8" width="16" height="8" rx="2" fill="${INK}"/>`).join('')}
    <defs><clipPath id="${clip}"><path d="${body}"/></clipPath></defs>
    <path d="${body}" fill="${col}"/>
    ${pc ? `<g clip-path="url(#${clip})"><path d="M-60 -126 q30 10 20 40 q-20 20 -50 0z" fill="${pc}"/><path d="M10 -60 q14 -30 44 -20 q10 30 -10 40z" fill="${pc}"/></g>` : ''}
    <path d="${body}" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M18 -118 Q32 -156 58 -118Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M62 -80 Q70 -50 86 -78" fill="${col}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M56 -118 Q84 -132 104 -112 L120 -82 Q122 -68 108 -66 L96 -68 Q76 -80 62 -84Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="112" cy="-72" rx="11" ry="8" fill="#e0b49a" stroke="${INK}" stroke-width="2.5"/><circle cx="115" cy="-74" r="1.6" fill="${INK}"/>
    <circle cx="96" cy="-104" r="3.2" fill="${INK}"/><circle cx="97" cy="-105" r="1" fill="#fff"/>
    <path d="M80 -118 q-20 -8 -30 4 q16 8 30 -4z" fill="${col}" stroke="${INK}" stroke-width="2.5"/>
    ${limb('M88 -122 Q80 -150 96 -168', '#f3ead3', 5)}${limb('M98 -122 Q104 -148 122 -160', '#f3ead3', 5)}
  </g></g>`;
}
// Kerri the Maasai sheep, the mascot (woolly cloud body, bead collar).
function lambSVG(cls = '') {
  const puffs = [[40, 52, 16], [58, 44, 17], [76, 50, 16], [34, 66, 14], [82, 66, 14], [50, 70, 16], [68, 70, 16]];
  return `<svg viewBox="0 0 120 110" class="lamb ${cls}" role="img" aria-label="Kerri the Maasai sheep">
    <ellipse cx="60" cy="104" rx="38" ry="5" fill="rgba(0,0,0,.14)"/>
    ${[44, 56, 68, 80].map(lx => limb(`M${lx} 76 V100`, '#5d3a24', 6)).join('')}
    ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 2.5}" fill="${INK}"/>`).join('')}
    ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6e7cf"/>`).join('')}
    <path d="M86 40 q-14 4 -14 16 q14 6 22 -2z" fill="#8d4a26" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="98" cy="50" rx="17" ry="15" fill="#a0522d" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="106" cy="57" rx="9" ry="7" fill="#d9a27a" stroke="${INK}" stroke-width="2"/>
    <g class="eyes"><circle cx="94" cy="46" r="3.6" fill="#fff" stroke="${INK}" stroke-width="1.5"/><circle cx="104" cy="45" r="3.6" fill="#fff" stroke="${INK}" stroke-width="1.5"/><circle cx="95" cy="46.5" r="1.8" fill="${INK}"/><circle cx="105" cy="45.5" r="1.8" fill="${INK}"/></g>
    <path d="M102 60 q4 3 8 0" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M84 62 Q90 72 100 68" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M84 62 Q90 72 100 68" stroke="#E53935" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="88" cy="67" r="2" fill="#FDD835"/><circle cx="94" cy="69.5" r="2" fill="#1E88E5"/>
    <circle cx="61" cy="36" r="9" fill="${INK}"/><circle cx="61" cy="36" r="6.5" fill="#f6e7cf"/>
  </svg>`;
}

// ---------- Scene kit (800 x 450) ----------
// Golden-hour Mara: soft blue sky melting into gold at the horizon (no purple anywhere).
const SKY = { day: ['#8cc4e0', '#f8dca2'], golden: ['#7fb6d6', '#fbd08a'], sunset: ['#f7934a', '#ffd79a'], night: ['#16224d', '#3b4a86'], dawn: ['#f9b38f', '#fff0d6'] };
const SUN = { day: [660, 80, 38, '#ffd54f'], golden: [630, 196, 44, '#ffb74d'] };
function sky(t = 'day') {
  const [a, b] = SKY[t], id = uid('sk'), night = t === 'night', [sx0, sy0, sr, sc] = SUN[t] || [400, 230, 66, '#ff7043'];
  const sun = night ? `<circle cx="660" cy="80" r="30" fill="#fff6c9" stroke="${INK}" stroke-width="3"/>${[[120, 60], [300, 40], [480, 90], [560, 30], [220, 110]].map(([sx, sy]) => sparkle(sx, sy, .7, '#fff8d0')).join('')}`
    : `<g class="spin-slow" style="transform-origin:${sx0}px ${sy0}px">${Array.from({ length: 12 }, (_, i) => { const ang = i * Math.PI / 6, r = sr + 10; return `<path d="M${sx0 + Math.cos(ang) * r} ${sy0 + Math.sin(ang) * r} L${sx0 + Math.cos(ang) * (r + 14)} ${sy0 + Math.sin(ang) * (r + 14)}" stroke="#f9a825" stroke-width="5" stroke-linecap="round"/>`; }).join('')}</g>
      <circle cx="${sx0}" cy="${sy0}" r="${sr}" fill="${sc}" stroke="${INK}" stroke-width="3"/>`;
  const cloud = (cx, cy, k) => night ? '' : `<g class="drift" transform="translate(${cx} ${cy}) scale(${k})"><path d="M-40 10 q-10 -24 14 -26 q8 -22 34 -12 q24 -8 30 16 q18 4 10 22z" fill="#fff" stroke="${INK}" stroke-width="2.5"/></g>`;
  const far = night ? '#2f3a2c' : '#d6a95c', near = night ? '#26301f' : '#e7c27c';
  // Distant blue-grey hills of the Mara escarpment behind the plain.
  const hills = night ? '' : `<path d="M0 262 L90 226 L170 246 L300 188 L400 236 L470 214 L560 244 L660 200 L800 240 V300 H0Z" fill="#9fb0bf" stroke="${INK}" stroke-width="2"/><path d="M0 262 L90 226 L170 246 L300 188 L400 236 L470 214 L560 244 L660 200 L800 240" fill="none" stroke="#c7d3dc" stroke-width="5" stroke-linejoin="round" opacity=".7"/>`;
  const tufts = night ? '' : Array.from({ length: 14 }, (_, i) => { const gx = 30 + i * 56, gy = 330 + (i % 3) * 30; return `<path d="M${gx} ${gy} l-5 -12 M${gx} ${gy} l0 -15 M${gx} ${gy} l6 -12" stroke="#9c8a3f" stroke-width="2.5" stroke-linecap="round"/>`; }).join('');
  const farTrees = [[90, 262, .45], [700, 258, .5], [520, 266, .35]].map(([fx, fy, fs]) => acacia(fx, fy, fs, true)).join('');
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="800" height="450" fill="url(#${id})"/>${sun}${cloud(170, 70, 1)}${cloud(470, 50, .8)}${hills}
    <path d="M0 268 q140 -34 280 -8 t300 -14 t220 8 V450 H0Z" fill="${far}" stroke="${INK}" stroke-width="2.5"/>${farTrees}
    <path d="M0 312 q200 -26 400 0 t400 -8 V450 H0Z" fill="${near}" stroke="${INK}" stroke-width="2.5"/>${tufts}`;
}
function acacia(x, y, s = 1, far = false) {
  const canopy = 'M-96 -100 Q-82 -132 -42 -126 Q-10 -146 22 -130 Q62 -140 92 -118 Q104 -100 82 -97 Q0 -90 -80 -95 Q-104 -95 -96 -100Z';
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="${far ? '' : 'sway'}">
    ${limb('M0 0 Q-4 -50 0 -84', '#6d4c41', 9)}${limb('M0 -66 Q-26 -86 -52 -104', '#6d4c41', 5)}${limb('M0 -72 Q24 -92 48 -108', '#6d4c41', 5)}
    <path d="${canopy}" fill="${far ? '#8aa83a' : '#7cb342'}" stroke="${INK}" stroke-width="3"/>
    <path d="M-80 -96 Q0 -90 82 -97 Q60 -104 0 -104 Q-60 -104 -80 -96Z" fill="#558b2f"/>
  </g></g>`;
}
const hut = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="0" rx="80" ry="8" fill="rgba(0,0,0,.16)"/>
  <path d="M-58 0 V-52 Q0 -60 58 -52 V0 Q0 6 -58 0Z" fill="#b9814f" stroke="${INK}" stroke-width="3"/>
  <path d="M-46 -14 q20 -4 34 0 M14 -32 q16 -3 30 0" stroke="#9a6438" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M-80 -46 Q-40 -96 0 -128 Q40 -96 80 -46 Q0 -34 -80 -46Z" fill="#cfa45a" stroke="${INK}" stroke-width="3"/>
  <path d="M0 -124 L-56 -48 M0 -124 L-28 -42 M0 -124 L0 -40 M0 -124 L28 -42 M0 -124 L56 -48" stroke="#a87d3a" stroke-width="2.5" fill="none"/>
  <path d="M-80 -46 Q0 -34 80 -46" stroke="#8d6530" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M-14 0 V-34 H14 V0Z" fill="#3e2723" stroke="${INK}" stroke-width="2.5"/></g>`;
function boma(x, y, w) { let s = ''; for (let i = 0; i <= w; i += 16) s += limb(`M${x + i} ${y} l${((i / 16) % 2 ? 4 : -4)} -42`, '#8d6e63', 4); return s; }
const sparkle = (x, y, k = 1, col = '#FDD835') => `<g transform="translate(${x} ${y}) scale(${k})"><path class="twinkle" d="M0 -12 Q2 -2 12 0 Q2 2 0 12 Q-2 2 -12 0 Q-2 -2 0 -12Z" fill="${col}" stroke="${INK}" stroke-width="1.8"/></g>`;
// Thick yellow explainer arrow from (x1,y1) to (x2,y2), drawn on.
function arrow(x1, y1, x2, y2) {
  const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - Math.cos(a) * 22, hy = y2 - Math.sin(a) * 22, px = Math.sin(a) * 14, py = -Math.cos(a) * 14;
  return `<g class="arrow"><path class="draw" d="M${x1} ${y1} L${hx} ${hy}" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path class="draw" d="M${x1} ${y1} L${hx} ${hy}" stroke="#FDD835" stroke-width="10" stroke-linecap="round"/>
    <path d="M${x2} ${y2} L${hx + px} ${hy + py} L${hx - px} ${hy - py}Z" fill="#FDD835" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`;
}
const label = (text, x = 400, y = 52, size = 36) => `<text class="hand" x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${INK}" stroke="#fff" stroke-width="6" paint-order="stroke" letter-spacing="1">${text}</text>`;
const mark = (ok, x, y) => ok ? `<g transform="translate(${x} ${y})"><circle r="24" fill="#43A047" stroke="${INK}" stroke-width="3"/><path d="M-11 0 l7 8 l14 -16" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`
  : `<g transform="translate(${x} ${y})"><circle r="24" fill="#E53935" stroke="${INK}" stroke-width="3"/><path d="M-9 -9 l18 18 M9 -9 l-18 18" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>`;
const fire = (x, y) => `<g transform="translate(${x} ${y})">${limb('M-26 0 L24 -10', '#6d4c41', 6)}${limb('M-22 -10 L26 0', '#6d4c41', 6)}
  <path class="flicker" d="M-18 -6 Q-22 -40 0 -66 Q4 -40 18 -50 Q24 -24 16 -6Z" fill="#FB8C00" stroke="${INK}" stroke-width="3"/><path class="flicker" d="M-8 -8 Q-8 -30 2 -40 Q6 -24 10 -8Z" fill="#FDD835"/></g>`;
const river = () => `<path d="M0 392 q200 -26 400 0 t400 -4 V450 H0Z" fill="#4fc3f7" stroke="${INK}" stroke-width="3"/>${[120, 330, 560, 720].map(wx => `<path class="drift" d="M${wx} 420 q12 -8 24 0 q12 8 24 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}`;
const maize = (x, y, h = 1, cob = true) => `<g transform="translate(${x} ${y}) scale(${h})"><g class="sway">${limb('M0 0 V-170', '#43A047', 6)}
  ${[[-1, -50], [1, -80], [-1, -110], [1, -140]].map(([sd, ly]) => `<path d="M0 ${ly} q${sd * 40} -6 ${sd * 64} 18 q${sd * -30} -2 ${sd * -64} -10z" fill="#66bb6a" stroke="${INK}" stroke-width="2.5"/>`).join('')}
  ${cob ? `<ellipse cx="12" cy="-104" rx="10" ry="26" fill="#FDD835" stroke="${INK}" stroke-width="2.5"/><path d="M6 -84 q6 10 14 0" stroke="#66bb6a" stroke-width="5" fill="none"/>` : ''}</g></g>`;
const miniBricks = cols => cols.map((c, i) => brickSVG(c, -20 + (i % 2) * 6, -i * 13, 10)).join('');
// A scene: sky and ground first, then every part pops in one after another, under a slow camera push.
const scene = (t, ...parts) => `<svg viewBox="0 0 800 450" class="scene" role="img"><g class="kb">${sky(t)}${parts.map((p, i) => `<g class="pop-in" style="animation-delay:${(.2 + i * .35).toFixed(2)}s">${p}</g>`).join('')}</g></svg>`;

// ---------- Cast ----------
const MAMA = { kind: 'woman', wrap: '#c62828', collar: ['#E53935', '#ffffff', '#1E88E5', '#FDD835'] };
const NASERIAN = { kind: 'girl', wrap: '#1E88E5', collar: ['#FDD835', '#ffffff', '#E53935'] };
const LEMAYIAN = { kind: 'boy', wrap: '#E53935', collar: ['#1E88E5', '#ffffff'] };
const KOKO = { kind: 'elder', wrap: '#0277BD', collar: ['#ffffff', '#E53935', '#43A047', '#FDD835'] };
const CAST = {
  girl: NASERIAN, boy: LEMAYIAN, mama: MAMA, koko: KOKO,
  ruth: { kind: 'woman', wrap: '#E53935', collar: ['#1E88E5', '#ffffff', '#FDD835'] },
  man: { kind: 'man', wrap: '#1565C0', collar: ['#E53935', '#ffffff'] },
  soil: { kind: 'man', wrap: '#6d4c41', collar: ['#E53935', '#ffffff'] },
  it: { kind: 'man', wrap: '#1E88E5', collar: ['#FDD835', '#ffffff'] },
  health: { kind: 'woman', wrap: '#00897B', collar: ['#E53935', '#ffffff', '#43A047'] },
  schol: { kind: 'woman', wrap: '#0277BD', collar: ['#FB8C00', '#ffffff', '#E53935'] },
  agri: { kind: 'man', wrap: '#43A047', collar: ['#E53935', '#FDD835'] },
};
// Head-and-shoulders portrait cut from the full figure.
function avatarSVG(o = {}) {
  const kind = kindOf(o), child = kind === 'girl' || kind === 'boy', s = child ? 1.08 : .92, y = 46 + (child ? 205 * .68 * 1.08 : 205 * .92);
  return `<svg viewBox="0 0 100 100" class="avatar" role="img" aria-label="${o.label || 'Maasai ' + kind}"><rect width="100" height="100" fill="${o.bg || '#fff3e0'}"/>${person(50, y, s, { ...o, cls: 'still' })}</svg>`;
}
const AV = (key, label, bg = '#fff3e0') => avatarSVG({ ...(CAST[key] || MAMA), label, bg });
const cowImg = (col, alt = '') => `<svg class="cow-svg" viewBox="-96 -176 228 186" role="img" aria-label="${alt || 'cow'}">${cow(0, 0, 1, col)}</svg>`;
const nums = (list, y) => list.map(([nx, t]) => `<g transform="translate(${nx} ${y})"><circle r="20" fill="#fff" stroke="${INK}" stroke-width="3"/><text class="hand" y="9" text-anchor="middle" font-size="26" fill="${INK}">${t}</text></g>`).join('');

// ---------- Stories ----------
const STORIES = [
  { id: 'six-bricks', t: "Naserian's Six Bricks", age: 'little', act: 'count-herd', cover: '#B71C1C',
    pages: [
      { s: () => scene('dawn', hut(610, 340, 1.2), acacia(150, 330, 1.2), label('MAASAI MARA'), person(390, 405, 1.3, { ...NASERIAN, wave: true }), sparkle(470, 170, 1.2), sparkle(320, 200)), en: 'In the Maasai Mara, the sun wakes up early. So does Naserian.', sw: 'Huko Maasai Mara, jua huamka mapema. Naserian pia.' },
      { s: () => scene('day', hut(660, 340), label('SIX BRICKS!'), person(300, 410, 1.35, MAMA), person(440, 410, 1.3, { ...NASERIAN, holding: miniBricks(['r', 'o', 'g', 'b', 'p', 'y']) }),
          `<g transform="translate(480 120)">${['r', 'o', 'g', 'b', 'p', 'y'].map((c, i) => brickSVG(c, i * 44 - 40, Math.abs(i - 2.5) * 10, 9)).join('')}</g>`, arrow(470, 260, 520, 170), sparkle(700, 110), sparkle(430, 100)),
        en: 'Mama gives her a small beaded pouch. Inside are six bright bricks!', sw: 'Mama anampa mfuko mdogo wa shanga. Ndani kuna matofali sita!' },
      { s: () => scene('day', label('SIX COLOURS'), person(110, 410, 1.2, { ...NASERIAN, point: true }),
          ...['r', 'o', 'g', 'b', 'p', 'y'].map((c, i) => `<g>${brickSVG(c, 200 + i * 96, 300, 19)}<text class="hand" x="${238 + i * 96}" y="370" text-anchor="middle" font-size="20" fill="${INK}">${BRICK[c].name.toUpperCase()}</text></g>`)),
        en: 'Red, orange, green, blue, sky blue and yellow. Six colours, like the beads on Mama\'s collar.', sw: 'Nyekundu, rangi ya chungwa, kijani, bluu, samawati na njano.' },
      { s: () => scene('day', label('BRICK COWS'), boma(440, 395, 300), person(150, 410, 1.3, KOKO), person(300, 410, 1.25, { ...NASERIAN, point: true }),
          `<g transform="translate(500 330)">${['r', 'o', 'g'].map((c, i) => brickSVG(c, i * 76, 0, 15)).join('')}</g>`, arrow(370, 250, 480, 310)),
        en: '"These are my cows," says Naserian. Koko laughs. "Then count them into the boma!"', sw: '"Hawa ni ng\'ombe wangu," anasema Naserian. Koko anacheka.' },
      { s: () => scene('sunset', label('NABO · ARE · UNI'), boma(80, 400, 200), person(120, 410, 1.2, { ...NASERIAN, point: true }),
          cow(380, 400, .9, '#8d5524', false, 'walk-in'), cow(560, 404, .85, '#f2efe6', false, 'walk-in'), cow(720, 408, .8, '#2b1d16', false, 'walk-in'), nums([[390, '1'], [570, '2'], [728, '3']], 220)),
        en: 'Nabo, are, uni! One, two, three! Moja, mbili, tatu! All the cows are home.', sw: 'Moja, mbili, tatu! Ng\'ombe wote wamefika nyumbani.' },
      { s: () => scene('night', label('TEACHING AT HOME'), hut(600, 340, 1.2), fire(400, 400), person(260, 410, 1.3, MAMA), person(520, 410, 1.15, NASERIAN), person(600, 415, .8, LEMAYIAN),
          `<g transform="translate(410 300)">${['r', 'b', 'y'].map((c, i) => brickSVG(c, i * 30 - 45, 0, 7)).join('')}</g>`),
        en: 'Tonight, Naserian will teach her baby brother. Can you count your bricks too?', sw: 'Leo usiku, Naserian atamfundisha mdogo wake. Wewe pia unaweza kuhesabu?' },
    ] },
  { id: 'lost-calf', t: 'The Lost Calf of the Maasai Mara', age: 'both', act: 'where-calf', cover: '#B34700',
    pages: [
      { s: () => scene('day', label('ONE CALF IS MISSING!'), boma(60, 400, 330), cow(230, 400, 1, '#8d5524'), person(580, 410, 1.35, LEMAYIAN), `<text class="hand" x="660" y="200" font-size="90" fill="#E53935" stroke="${INK}" stroke-width="3">?</text>`),
        en: 'Lemayian counts the cattle. One calf is missing!', sw: 'Lemayian anahesabu ng\'ombe. Ndama mmoja amepotea!' },
      { s: () => scene('day', label('UNDER THE TREE?'), acacia(450, 360, 1.6), person(200, 410, 1.3, { ...LEMAYIAN, point: true }), mark(false, 450, 330)),
        en: 'Is the calf UNDER the acacia tree? No!', sw: 'Je, ndama yuko CHINI ya mti? Hapana!' },
      { s: () => scene('day', label('BEHIND THE ENKAJI?'), hut(460, 350, 1.5), person(200, 410, 1.3, { ...LEMAYIAN, point: true }), mark(false, 560, 220)),
        en: 'Is the calf BEHIND the enkaji? No!', sw: 'Je, ndama yuko NYUMA ya nyumba? Hapana!' },
      { s: () => scene('day', label('BESIDE THE RIVER!'), river(), cow(560, 385, .7, '#f2efe6', true), person(220, 410, 1.3, { ...LEMAYIAN, wave: true }), mark(true, 600, 200), arrow(330, 250, 470, 300), sparkle(680, 150), sparkle(520, 120)),
        en: 'Is the calf BESIDE the river? Yes! There it is!', sw: 'Je, ndama yuko KANDO ya mto? Ndiyo! Yuko pale!' },
      { s: () => scene('sunset', label('HOME, BESIDE MAMA'), boma(60, 400, 330), cow(230, 400, 1, '#8d5524'), cow(330, 404, .6, '#f2efe6', false), person(600, 410, 1.35, { ...LEMAYIAN, wave: true }), sparkle(300, 220, 1.3, '#E53935')),
        en: 'The calf is home, BESIDE its mother. Now build a cow and a calf with your bricks!', sw: 'Ndama yuko nyumbani, KANDO ya mama yake.' },
    ] },
  { id: 'mama-beads', t: "Mama's Beautiful Beads", age: 'both', act: 'bead-pattern', cover: '#01579B',
    pages: [
      { s: () => scene('day', label("MAMA'S BEADWORK"), acacia(600, 360, 1.4), person(320, 410, 1.4, { ...MAMA, holding: `<ellipse cx="14" cy="6" rx="22" ry="10" fill="#8d6e63" stroke="${INK}" stroke-width="2.5"/>${['#E53935', '#fff', '#1E88E5', '#FDD835'].map((c, i) => `<circle cx="${4 + i * 7}" cy="0" r="4" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`).join('')}` }), sparkle(420, 200)),
        en: 'Under the acacia tree, Mama makes a collar of beads.', sw: 'Chini ya mti, Mama anatengeneza mkufu wa shanga.' },
      { s: () => scene('day', label('A PATTERN'), ...['#E53935', '#fff', '#E53935', '#fff', '#E53935', '#fff'].map((c, i) => { const a = Math.PI * (i + .5) / 6; return `<circle cx="${400 - Math.cos(a) * 230}" cy="${170 + Math.sin(a) * 120}" r="30" fill="${c}" stroke="${INK}" stroke-width="3"/><circle cx="${392 - Math.cos(a) * 230}" cy="${162 + Math.sin(a) * 120}" r="8" fill="rgba(255,255,255,.6)"/>`; }),
          `<text class="hand" x="400" y="215" text-anchor="middle" font-size="30" fill="${INK}">ROUND AND ROUND</text>`),
        en: 'Red, white, red, white, red, white. A pattern goes round and round.', sw: 'Nyekundu, nyeupe, nyekundu, nyeupe. Mpangilio unaendelea.' },
      { s: () => scene('day', label('COPY THE PATTERN'), person(200, 410, 1.35, MAMA), person(340, 410, 1.25, { ...NASERIAN, point: true }), ...['r', 'b', 'r', 'b'].map((c, i) => brickSVG(c, 430 + i * 80, 340, 16))),
        en: 'Naserian copies the pattern with her bricks: red, blue, red, blue...', sw: 'Naserian anaiga mpangilio kwa matofali yake.' },
      { s: () => scene('sunset', label('WHAT COMES NEXT?'), person(170, 410, 1.3, { ...MAMA, wave: true }), person(300, 410, 1.2, { ...NASERIAN, wave: true }), `<g>${['r', 'b', 'r', 'b'].map((c, i) => brickSVG(c, 380 + i * 76, 340, 15)).join('')}</g>`,
          `<text class="hand" x="700" y="320" font-size="60" fill="#E53935" stroke="${INK}" stroke-width="2.5">?</text>`, brickSVG('r', 684, 340, 15), sparkle(720, 300, 1.2)),
        en: '"What comes next?" asks Mama. What do you think? Red!', sw: '"Nini kinafuata?" Mama anauliza. Nyekundu!' },
    ] },
  { id: 'little-seed', t: 'The Little Maize Seed', age: 'both', act: 'seed-maize', cover: '#1B5E20',
    pages: [
      { s: () => scene('day', label('A TINY SEED'), person(300, 410, 1.35, { ...KOKO, point: true }), person(470, 410, 1.25, LEMAYIAN),
          `<g transform="translate(400 250)"><ellipse rx="12" ry="9" fill="#FDD835" stroke="${INK}" stroke-width="3"/></g>`, sparkle(430, 225), arrow(360, 190, 390, 236)),
        en: 'Koko gives Lemayian a tiny yellow seed. "Plant it in good soil," she says.', sw: 'Koko anampa Lemayian mbegu ndogo ya njano.' },
      { s: () => scene('day', label('GOOD SOIL'), `<g><rect x="240" y="300" width="380" height="44" fill="#4e342e" stroke="${INK}" stroke-width="3"/><rect x="240" y="344" width="380" height="44" fill="#a1887f" stroke="${INK}" stroke-width="3"/><rect x="240" y="388" width="380" height="50" fill="#9e9e9e" stroke="${INK}" stroke-width="3"/></g>`,
          `<g><text class="hand" x="640" y="330" font-size="22" fill="${INK}">TOPSOIL</text><text class="hand" x="640" y="374" font-size="22" fill="${INK}">SUBSOIL</text><text class="hand" x="640" y="420" font-size="22" fill="${INK}">ROCK</text></g>`,
          `<ellipse cx="420" cy="318" rx="10" ry="7" fill="#FDD835" stroke="${INK}" stroke-width="2.5"/>`, `<path class="drift" d="M300 330 q10 -8 20 0 q10 8 20 0" stroke="#e57373" stroke-width="7" fill="none" stroke-linecap="round"/>`, person(140, 410, 1.2, { ...LEMAYIAN, point: true })),
        en: 'Dark topsoil on top, full of life. That is where seeds love to grow.', sw: 'Udongo wa juu una rutuba. Hapo ndipo mbegu hupenda kuota.' },
      { s: () => scene('day', label('RAIN!'), `<g class="rain">${Array.from({ length: 34 }, (_, i) => `<path d="M${(i * 37) % 800} ${(i * 53) % 220 + 60} q-4 10 0 14 q4 -4 0 -14z" fill="#4fc3f7" stroke="${INK}" stroke-width="1.5"/>`).join('')}</g>`, maize(400, 400, .55, false), person(600, 410, 1.2, { ...LEMAYIAN, wave: true })),
        en: 'The rain comes. A green shoot pushes up!', sw: 'Mvua inanyesha. Chipukizi kijani kinatokea!' },
      { s: () => scene('sunset', label('MAIZE!'), maize(340, 400, 1.2), maize(420, 404, 1.05), maize(500, 400, 1.15), person(170, 410, 1.25, { ...LEMAYIAN, wave: true }), person(650, 410, 1.35, KOKO), sparkle(420, 150, 1.3), sparkle(520, 190)),
        en: 'Now it is tall maize with a big cob! Seed, shoot, rain, maize. Build it with your bricks!', sw: 'Sasa ni mahindi marefu! Mbegu, chipukizi, mvua, mahindi.' },
    ] },
];

// Inside of an <svg> string, to nest drawings in another svg.
const svgInner = svg => svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));

// Game tile art.
const TILE_ART = {
  copy: () => `<svg viewBox="0 0 120 90">${brickSVG('r', 20, 60, 12)}${brickSVG('y', 32, 44, 12)}${brickSVG('b', 20, 28, 12)}<text x="92" y="58" font-size="36" fill="#fff" font-weight="900" stroke="${INK}" stroke-width="2" paint-order="stroke">?</text></svg>`,
  cattle: () => `<svg viewBox="0 0 260 150">${cow(80, 140, .62, '#8d5524')}${cow(190, 144, .55, '#f2efe6')}<text x="8" y="34" font-size="30" fill="#fff" font-weight="900" stroke="${INK}" stroke-width="3" paint-order="stroke">1 2 3</text></svg>`,
  beads: () => `<svg viewBox="0 0 120 90">${['#E53935', '#fff', '#1E88E5', '#E53935', '#fff'].map((c, i) => `<circle cx="${14 + i * 20}" cy="46" r="9" fill="${c}" stroke="${INK}" stroke-width="2"/>`).join('')}<text x="102" y="54" font-size="24" fill="#fff" font-weight="900" stroke="${INK}" stroke-width="2" paint-order="stroke">?</text></svg>`,
  colour: () => `<svg viewBox="0 0 120 90">${['r', 'g', 'b', 'p'].map((c, i) => brickSVG(c, 6 + (i % 2) * 58, 30 + Math.floor(i / 2) * 32, 12)).join('')}</svg>`,
  code: () => `<svg viewBox="0 0 120 90">${[0, 1, 2].map(i => `<rect x="${14 + i * 32}" y="56" width="26" height="26" rx="6" fill="#fff" stroke="${INK}" stroke-width="2"/><text x="${20 + i * 32}" y="75" font-size="16">${['⬆️', '➡️', '➡️'][i]}</text>`).join('')}${cow(46, 50, .3, '#8d5524')}<text x="94" y="40" font-size="22">💧</text></svg>`,
  harvest: () => `<svg viewBox="0 0 120 90"><g transform="translate(30 54)">${HARVEST.bean.svg.replace('<svg', '<svg x="-20" y="-14" width="40" height="28"')}</g><g transform="translate(62 48)">${HARVEST.maize.svg.replace('<svg', '<svg x="-14" y="-24" width="28" height="48"')}</g><g transform="translate(94 56)">${HARVEST.stone.svg.replace('<svg', '<svg x="-18" y="-13" width="36" height="26"')}</g></svg>`,
  milk: () => `<svg viewBox="0 0 120 90">${[0, 1, 2].map(i => `<g transform="translate(${22 + i * 38} 30)"><path d="M-12 0 L-10 40 L10 40 L12 0Z" fill="#fff" stroke="${INK}" stroke-width="3"/>${i < 2 ? `<path d="M-11 10 L-10 40 L10 40 L11 10Z" fill="#fffdf5"/><path d="M-11 10 H11" stroke="#bdbdbd" stroke-width="2"/>` : ''}</g>`).join('')}<text x="8" y="22" font-size="18" font-weight="900" fill="#fff" stroke="${INK}" stroke-width="2.5" paint-order="stroke">1 2 3</text></svg>`,
  drum: () => `<svg viewBox="0 0 120 90"><g transform="translate(38 50) scale(.5)">${svgInner(drumSVG('L'))}</g><g transform="translate(86 56) scale(.38)">${svgInner(drumSVG('H'))}</g></svg>`,
  silabi: () => `<svg viewBox="0 0 120 90">${['ma', 'ji'].map((s, i) => `<g transform="translate(${18 + i * 46} 28)"><rect width="40" height="34" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/><text x="20" y="24" text-anchor="middle" font-size="18" font-weight="900" fill="${INK}">${s}</text></g>`).join('')}<text x="104" y="52" font-size="20">💧</text></svg>`,
  letters: () => `<svg viewBox="0 0 120 90"><text x="16" y="66" font-size="56" font-weight="900" fill="#fff" stroke="${INK}" stroke-width="3" paint-order="stroke">c</text><g transform="translate(80 76) scale(.32)">${cow(0, 0, 1, '#8d5524')}</g></svg>`,
  herd: () => `<svg viewBox="0 0 120 90"><text x="8" y="30" font-size="20" font-weight="900" fill="#fff" stroke="${INK}" stroke-width="2.5" paint-order="stroke">3 + 2</text><g transform="translate(36 82) scale(.3)">${cow(0, 0, 1, '#f2efe6')}</g><g transform="translate(88 84) scale(.3)">${cow(0, 0, 1, '#2b1d16')}</g></svg>`,
  firewood: () => `<svg viewBox="0 0 120 90"><g transform="translate(14 8) scale(.8)">${svgInner(BUNDLE)}</g><g transform="translate(80 8) scale(.8)">${svgInner(STICK)}</g><g transform="translate(94 8) scale(.8)">${svgInner(STICK)}</g></svg>`,
  market: () => `<svg viewBox="0 0 120 90"><circle cx="40" cy="48" r="20" fill="#fdd835" stroke="${INK}" stroke-width="3"/><text x="33" y="56" font-size="20" font-weight="900" fill="#8a6500">5</text><circle cx="80" cy="52" r="16" fill="#cfd8dc" stroke="${INK}" stroke-width="3"/><text x="70" y="59" font-size="16" font-weight="900" fill="#455a64">10</text></svg>`,
};
