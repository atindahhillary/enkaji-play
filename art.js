// Hand-drawn SVG art: bricks, Maasai avatars, the lamb mascot, cattle and story scenes.

const SKIN = '#6b3f26', SKIN2 = '#4e2c1a', HAIR = '#1b1110';

// One DUPLO-style 2x4 brick seen from the side. u = stud width in px.
function brickSVG(c, x, y, u = 20) {
  const hex = BRICK[c].hex, w = u * 4, h = u * 1.2;
  let s = `<g class="brk"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${hex}" stroke="rgba(0,0,0,.18)"/>` +
    `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h * 0.25}" rx="2" fill="rgba(255,255,255,.28)"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${x + i * u + u * 0.2}" y="${y - u * 0.3}" width="${u * 0.6}" height="${u * 0.32}" rx="2" fill="${hex}" stroke="rgba(0,0,0,.18)"/>`;
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
  const H = cols.length * u * 1.2 + 20, W = u * 4 + 20;
  return `<svg viewBox="0 0 ${W} ${Math.max(H, 60)}" class="tower">${cols.map((c, i) => brickSVG(c, 10, Math.max(H, 60) - 6 - (i + 1) * u * 1.2, u)).join('')}</svg>`;
}

// Bead collar arcs, drawn as rings of dots.
function collar(cx, cy, r, cols, scale = 1) {
  let s = '';
  cols.forEach((c, ri) => {
    const rr = r + ri * 5 * scale;
    for (let a = 200; a <= 340; a += 9) {
      const t = a * Math.PI / 180;
      s += `<circle cx="${(cx + Math.cos(t) * rr * 1.25).toFixed(1)}" cy="${(cy - Math.sin(t) * rr * 0.75).toFixed(1)}" r="${2.6 * scale}" fill="${c}"/>`;
    }
  });
  return s;
}

// Round avatar (portrait). kind: mother | girl | boy | elder | man
function avatarSVG(o = {}) {
  const kind = o.kind || 'mother', wrap = o.wrap || '#E53935', bg = o.bg || '#fde7c8';
  const cols = o.collar || ['#E53935', '#ffffff', '#1E88E5', '#FDD835'];
  const child = kind === 'girl' || kind === 'boy';
  const headR = child ? 24 : 22, hy = child ? 46 : 44;
  const ear = kind === 'boy' || kind === 'man' ? '' :
    `<path d="M${50 - headR - 2} ${hy} q-4 18 2 26" stroke="${cols[0]}" stroke-width="3" fill="none"/><path d="M${50 + headR + 2} ${hy} q4 18 -2 26" stroke="${cols[0]}" stroke-width="3" fill="none"/>`;
  const hair = kind === 'elder' ? `<path d="M${50 - headR} ${hy - 4} a${headR} ${headR} 0 0 1 ${headR * 2} 0" fill="#d9d4cc"/>` :
    `<path d="M${50 - headR} ${hy - 2} a${headR} ${headR} 0 0 1 ${headR * 2} 0 q-${headR} -8 -${headR * 2} 0z" fill="${HAIR}"/>`;
  const band = kind === 'girl' ? `<rect x="${50 - headR}" y="${hy - 14}" width="${headR * 2}" height="5" fill="${cols[2]}"/><circle cx="50" cy="${hy - 12}" r="3" fill="${cols[3] || '#fff'}"/>` : '';
  return `<svg viewBox="0 0 100 100" class="avatar" role="img" aria-label="${o.label || 'Maasai ' + kind}">
    <circle cx="50" cy="50" r="50" fill="${bg}"/>
    <path d="M12 100 q4 -30 38 -32 q34 2 38 32z" fill="${wrap}"/>
    <path d="M12 100 q4 -30 38 -32" stroke="rgba(0,0,0,.25)" stroke-width="2" fill="none" stroke-dasharray="5 4"/>
    <rect x="44" y="${hy + 16}" width="12" height="12" fill="${SKIN2}"/>
    ${kind === 'boy' || kind === 'man' ? collar(50, hy + 30, 10, cols.slice(0, 2)) : collar(50, hy + 30, 11, cols)}
    ${ear}
    <circle cx="50" cy="${hy}" r="${headR}" fill="${SKIN}"/>
    ${hair}${band}
    <circle cx="${50 - 8}" cy="${hy + 1}" r="2.6" fill="#140b07"/><circle cx="${50 + 8}" cy="${hy + 1}" r="2.6" fill="#140b07"/>
    <circle cx="${50 - 7}" cy="${hy}" r=".9" fill="#fff"/><circle cx="${50 + 9}" cy="${hy}" r=".9" fill="#fff"/>
    <path d="M${50 - 7} ${hy + 9} q7 6 14 0" stroke="#140b07" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="${50 - 13}" cy="${hy + 7}" r="3" fill="#e57373" opacity=".35"/><circle cx="${50 + 13}" cy="${hy + 7}" r="3" fill="#e57373" opacity=".35"/>
  </svg>`;
}

// Kerri the lamb, the mascot, wearing a Maasai bead collar.
function lambSVG(cls = '') {
  const wool = [[30, 32], [50, 24], [70, 32], [24, 50], [76, 50], [36, 20], [64, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="#f3e2c7"/>`).join('');
  return `<svg viewBox="0 0 100 100" class="lamb ${cls}" role="img" aria-label="Kerri the Maasai sheep">
    <ellipse cx="18" cy="52" rx="12" ry="7" fill="#a85a2c" transform="rotate(-25 18 52)"/><ellipse cx="82" cy="52" rx="12" ry="7" fill="#a85a2c" transform="rotate(25 82 52)"/>
    ${wool}
    <ellipse cx="50" cy="58" rx="26" ry="24" fill="#c9733f"/><ellipse cx="50" cy="66" rx="14" ry="11" fill="#e2a274"/>
    <circle cx="40" cy="55" r="4.5" fill="#2b1a12"/><circle cx="60" cy="55" r="4.5" fill="#2b1a12"/>
    <circle cx="41.5" cy="53.5" r="1.5" fill="#fff"/><circle cx="61.5" cy="53.5" r="1.5" fill="#fff"/>
    <ellipse cx="50" cy="66" rx="5" ry="3.5" fill="#e98a8a"/>
    <path d="M44 71 q6 5 12 0" stroke="#2b1a12" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="33" cy="64" r="4" fill="#f4a3a3" opacity=".6"/><circle cx="67" cy="64" r="4" fill="#f4a3a3" opacity=".6"/>
    ${collar(50, 88, 9, ['#E53935', '#1E88E5', '#FDD835'], .9)}
  </svg>`;
}

// ---------- Scene parts (800 x 450 canvas) ----------
const SKY = { day: ['#9fd8ff', '#e6f6ff'], sunset: ['#ff9e5e', '#ffd9a0'], night: ['#1d2a5a', '#3b4a86'], dawn: ['#ffc4a8', '#fff0d6'] };
let _gid = 0;
function sky(t = 'day') {
  const [a, b] = SKY[t], id = 'sk' + (++_gid);
  const sun = t === 'night' ? '<circle cx="660" cy="80" r="34" fill="#fff6c9"/><circle cx="120" cy="60" r="2" fill="#fff"/><circle cx="300" cy="40" r="2" fill="#fff"/><circle cx="480" cy="90" r="2" fill="#fff"/>'
    : `<circle cx="${t === 'day' ? 660 : 400}" cy="${t === 'day' ? 80 : 250}" r="${t === 'day' ? 40 : 70}" fill="${t === 'day' ? '#ffd54f' : '#ff7043'}" class="glow"/>`;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="450" fill="url(#${id})"/>${sun}` +
    `<path d="M0 260 q120 -40 250 -10 t300 -20 t250 10 v220 h-800z" fill="${t === 'night' ? '#3d4a3a' : '#c9b56a'}"/>` +
    `<path d="M0 300 q200 -30 400 0 t400 -10 v160 h-800z" fill="${t === 'night' ? '#2f3a2c' : '#d9c37a'}"/>`;
}
const acacia = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="sway"><path d="M0 0 l-4 -70 M-2 -50 l-30 -30 M-3 -55 l26 -28" stroke="#5d4037" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-88" rx="80" ry="16" fill="#558b2f"/><ellipse cx="-20" cy="-96" rx="50" ry="10" fill="#689f38"/></g></g>`;
const hut = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 0 q0 -60 60 -62 q60 2 60 62z" fill="#8d6e63"/><path d="M-60 0 q0 -60 60 -62" stroke="#6d4c41" stroke-width="4" fill="none"/><path d="M-50 -20 h100 M-42 -38 h84" stroke="#a1887f" stroke-width="3"/><rect x="-12" y="-30" width="24" height="30" rx="10" fill="#3e2723"/></g>`;
const boma = (x, y, w) => { let s = ''; for (let i = 0; i <= w; i += 14) s += `<path d="M${x + i} ${y} l${(i % 28) - 7} -34" stroke="#795548" stroke-width="4" stroke-linecap="round"/>`; return s; };
function cow(x, y, s = 1, col = '#8d5524', flip = false, cls = '') {
  return `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <rect x="-34" y="-46" width="60" height="30" rx="14" fill="${col}"/><path d="M-20 -46 q8 -14 16 0" fill="${col}"/>
    <rect x="-28" y="-20" width="7" height="22" fill="${col}"/><rect x="-14" y="-20" width="7" height="22" fill="${col}"/><rect x="6" y="-20" width="7" height="22" fill="${col}"/><rect x="18" y="-20" width="7" height="22" fill="${col}"/>
    <ellipse cx="34" cy="-46" rx="12" ry="14" fill="${col}"/><path d="M26 -58 q-6 -14 -14 -12 M42 -58 q6 -14 14 -12" stroke="#f5f0e1" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="38" cy="-48" r="2" fill="#111"/><ellipse cx="38" cy="-36" rx="7" ry="4" fill="#d7a98c"/><path d="M-34 -36 q-12 6 -8 22" stroke="${col}" stroke-width="3" fill="none"/>
  </g></g>`;
}
// Full-body person for scenes.
function person(x, y, s = 1, o = {}) {
  const wrap = o.wrap || '#E53935', cols = o.collar || ['#E53935', '#fff', '#1E88E5'], child = o.child;
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="${o.cls || 'bob'}">
    <rect x="-12" y="-40" width="8" height="40" fill="${SKIN2}"/><rect x="4" y="-40" width="8" height="40" fill="${SKIN2}"/>
    <path d="M-26 -38 l8 -72 h36 l8 72z" fill="${wrap}"/><path d="M-22 -60 h44 M-20 -80 h40" stroke="rgba(0,0,0,.2)" stroke-width="3"/>
    <path d="M-18 -104 l-16 50 M18 -104 l16 50" stroke="${SKIN}" stroke-width="8" stroke-linecap="round"/>
    ${o.holding ? `<g transform="translate(26 -54)">${o.holding}</g>` : ''}
    ${collar(0, -104, 8, cols)}
    <circle cx="0" cy="-130" r="${child ? 20 : 18}" fill="${SKIN}"/><path d="M-${child ? 20 : 18} -134 a${child ? 20 : 18} ${child ? 20 : 18} 0 0 1 ${child ? 40 : 36} 0z" fill="${o.elder ? '#d9d4cc' : HAIR}"/>
    <circle cx="-6" cy="-129" r="2" fill="#111"/><circle cx="6" cy="-129" r="2" fill="#111"/><path d="M-5 -121 q5 4 10 0" stroke="#111" stroke-width="2" fill="none"/>
  </g></g>`;
}
const miniBricks = cols => cols.map((c, i) => brickSVG(c, -20 + (i % 2) * 6, -i * 13, 10)).join('');
const scene = (t, ...parts) => `<svg viewBox="0 0 800 450" class="scene" role="img">${sky(t)}${parts.join('')}</svg>`;

// ---------- Stories ----------
const MAMA = { wrap: '#c62828', collar: ['#E53935', '#fff', '#1E88E5', '#FDD835'] };
const NASERIAN = { wrap: '#1E88E5', collar: ['#FDD835', '#fff', '#E53935'], child: true };
const LEMAYIAN = { wrap: '#E53935', collar: ['#1E88E5', '#fff'], child: true };
const KOKO = { wrap: '#0277BD', collar: ['#fff', '#E53935', '#43A047', '#FDD835'], elder: true };

const STORIES = [
  { id: 'six-bricks', t: "Naserian's Six Bricks", age: 'little', act: 'count-herd', cover: '#E53935',
    pages: [
      { s: () => scene('dawn', hut(620, 330, 1.1), acacia(150, 320, 1.2), person(380, 400, 1.2, NASERIAN)), en: 'In Sekenani, the sun wakes up early. So does Naserian.', sw: 'Huko Sekenani, jua huamka mapema. Naserian pia.' },
      { s: () => scene('day', hut(640, 330), person(300, 400, 1.3, MAMA), person(430, 400, 1.1, { ...NASERIAN, holding: miniBricks(['r', 'o', 'g', 'b', 'p', 'y']) })), en: 'Mama gives her a small beaded pouch. Inside are six bright bricks!', sw: 'Mama anampa mfuko mdogo wa shanga. Ndani kuna matofali sita!' },
      { s: () => scene('day', `<g transform="translate(300 260)">${['r', 'o', 'g', 'b', 'p', 'y'].map((c, i) => brickSVG(c, i * 34, 60, 8)).join('')}</g>`, person(220, 400, 1.1, NASERIAN)), en: 'Red, orange, green, blue, sky blue and yellow. Six colours, like the beads on Mama\'s collar.', sw: 'Nyekundu, rangi ya chungwa, kijani, bluu, samawati na njano.' },
      { s: () => scene('day', boma(460, 380, 260), `<g transform="translate(500 300)">${['r', 'o', 'y'].map((c, i) => brickSVG(c, i * 70, 40, 14)).join('')}</g>`, person(300, 400, 1.1, NASERIAN), person(170, 400, 1.2, KOKO)), en: '"These are my cows," says Naserian. Koko laughs. "Then count them into the boma!"', sw: '"Hawa ni ng\'ombe wangu," anasema Naserian. Koko anacheka.' },
      { s: () => scene('sunset', cow(480, 380, 1, '#8d5524'), cow(600, 390, .9, '#eee', false, 'walk'), cow(360, 395, .8, '#3e2723'), person(180, 400, 1.1, NASERIAN)), en: 'Nabo, aare, uni! One, two, three! Moja, mbili, tatu! All the cows are home.', sw: 'Moja, mbili, tatu! Ng\'ombe wote wamefika nyumbani.' },
      { s: () => scene('night', hut(560, 330, 1.1), person(300, 400, 1.2, MAMA), person(400, 400, 1, NASERIAN)), en: 'Tonight, Naserian will teach her baby brother. Can you count your bricks too?', sw: 'Leo usiku, Naserian atamfundisha mdogo wake. Wewe pia unaweza kuhesabu?' },
    ] },
  { id: 'lost-calf', t: 'The Lost Calf of Sekenani', age: 'both', act: 'where-calf', cover: '#FB8C00',
    pages: [
      { s: () => scene('day', boma(80, 390, 300), cow(250, 380, 1, '#8d5524'), person(560, 400, 1.2, LEMAYIAN)), en: 'Lemayian counts the cattle. One calf is missing!', sw: 'Lemayian anahesabu ng\'ombe. Ndama mmoja amepotea!' },
      { s: () => scene('day', acacia(400, 330, 1.4), person(200, 400, 1.1, LEMAYIAN)), en: 'Is the calf UNDER the acacia tree? No!', sw: 'Je, ndama yuko CHINI ya mti? Hapana!' },
      { s: () => scene('day', hut(420, 340, 1.3), person(200, 400, 1.1, LEMAYIAN)), en: 'Is the calf BEHIND the enkaji? No!', sw: 'Je, ndama yuko NYUMA ya nyumba? Hapana!' },
      { s: () => scene('day', `<path d="M0 400 q200 -30 400 0 t400 0 v50 h-800z" fill="#4fc3f7"/>`, cow(520, 380, .7, '#eee', true, 'walk'), person(220, 400, 1.1, LEMAYIAN)), en: 'Is the calf BESIDE the river? Yes! There it is!', sw: 'Je, ndama yuko KANDO ya mto? Ndiyo! Yuko pale!' },
      { s: () => scene('sunset', boma(80, 390, 300), cow(250, 380, 1, '#8d5524'), cow(330, 390, .6, '#eee', true), person(560, 400, 1.2, LEMAYIAN)), en: 'The calf is home, BESIDE its mother. Now build a cow and a calf with your bricks!', sw: 'Ndama yuko nyumbani, KANDO ya mama yake.' },
    ] },
  { id: 'mama-beads', t: "Mama's Beautiful Beads", age: 'both', act: 'bead-pattern', cover: '#29B6F6',
    pages: [
      { s: () => scene('day', acacia(620, 330, 1.2), person(300, 400, 1.3, MAMA)), en: 'Under the acacia tree, Mama makes a collar of beads.', sw: 'Chini ya mti, Mama anatengeneza mkufu wa shanga.' },
      { s: () => scene('day', `<g transform="translate(220 220)">${['#E53935', '#fff', '#E53935', '#fff', '#E53935', '#fff'].map((c, i) => `<circle cx="${i * 60}" cy="0" r="22" fill="${c}" stroke="#333" stroke-width="2"/>`).join('')}</g>`), en: 'Red, white, red, white, red, white. A pattern goes round and round.', sw: 'Nyekundu, nyeupe, nyekundu, nyeupe. Mpangilio unaendelea.' },
      { s: () => scene('day', person(250, 400, 1.2, MAMA), person(420, 400, 1.1, NASERIAN), `<g transform="translate(470 330)">${['r', 'b', 'r', 'b'].map((c, i) => brickSVG(c, i * 44, 0, 10)).join('')}</g>`), en: 'Naserian copies the pattern with her bricks: red, blue, red, blue...', sw: 'Naserian anaiga mpangilio kwa matofali yake.' },
      { s: () => scene('sunset', person(300, 400, 1.2, MAMA), person(430, 400, 1.1, NASERIAN)), en: '"What comes next?" asks Mama. What do you think? Red!', sw: '"Nini kinafuata?" Mama anauliza. Nyekundu!' },
    ] },
  { id: 'little-seed', t: 'The Little Maize Seed', age: 'both', act: 'seed-maize', cover: '#43A047',
    pages: [
      { s: () => scene('day', person(300, 400, 1.2, KOKO), person(420, 400, 1, LEMAYIAN), `<circle cx="470" cy="330" r="6" fill="#fdd835"/>`), en: 'Koko gives Lemayian a tiny yellow seed. "Plant it in good soil," she says.', sw: 'Koko anampa Lemayian mbegu ndogo ya njano.' },
      { s: () => scene('day', `<rect x="250" y="360" width="300" height="20" fill="#5d4037"/><rect x="250" y="380" width="300" height="20" fill="#a1887f"/><rect x="250" y="400" width="300" height="50" fill="#9e9e9e" opacity=".7"/>`, person(160, 400, 1, LEMAYIAN)), en: 'Dark topsoil on top, full of life. That is where seeds love to grow.', sw: 'Udongo wa juu una rutuba. Hapo ndipo mbegu hupenda kuota.' },
      { s: () => scene('day', `<g class="rain">${Array.from({ length: 30 }, (_, i) => `<path d="M${(i * 37) % 800} ${(i * 53) % 200} l-6 18" stroke="#4fc3f7" stroke-width="3"/>`).join('')}</g>`, `<path d="M400 380 v-40 q-20 -10 -30 -30 M400 350 q20 -10 30 -30" stroke="#43A047" stroke-width="6" fill="none"/>`), en: 'The rain comes. A green shoot pushes up!', sw: 'Mvua inanyesha. Chipukizi kijani kinatokea!' },
      { s: () => scene('sunset', `<g transform="translate(400 400)"><path d="M0 0 v-150" stroke="#2e7d32" stroke-width="8"/><path d="M0 -60 q-50 -20 -70 -60 M0 -90 q50 -20 70 -60" stroke="#43A047" stroke-width="8" fill="none"/><ellipse cx="14" cy="-110" rx="12" ry="30" fill="#fb8c00"/></g>`, person(220, 400, 1, LEMAYIAN), person(600, 400, 1.2, KOKO)), en: 'Now it is tall maize with a big cob! Seed, shoot, rain, maize. Build it with your bricks!', sw: 'Sasa ni mahindi marefu! Mbegu, chipukizi, mvua, mahindi.' },
    ] },
];

// Game tile art.
const TILE_ART = {
  copy: () => `<svg viewBox="0 0 120 90">${brickSVG('r', 20, 60, 12)}${brickSVG('y', 32, 44, 12)}${brickSVG('b', 20, 28, 12)}<text x="92" y="58" font-size="36" fill="#fff" font-weight="900">?</text></svg>`,
  cattle: () => `<svg viewBox="0 0 120 90">${cow(40, 80, .55, '#8d5524')}${cow(85, 84, .45, '#fff')}<text x="8" y="28" font-size="22" fill="#fff" font-weight="900">1 2 3</text></svg>`,
  beads: () => `<svg viewBox="0 0 120 90">${['#E53935', '#fff', '#1E88E5', '#E53935', '#fff'].map((c, i) => `<circle cx="${14 + i * 20}" cy="46" r="9" fill="${c}" stroke="#333"/>`).join('')}<text x="102" y="54" font-size="24" fill="#fff" font-weight="900">?</text></svg>`,
  colour: () => `<svg viewBox="0 0 120 90">${['r', 'g', 'b', 'p'].map((c, i) => brickSVG(c, 6 + (i % 2) * 58, 30 + Math.floor(i / 2) * 32, 12)).join('')}</svg>`,
  code: () => `<svg viewBox="0 0 120 90">${[0,1,2].map(i=>`<rect x="${14+i*32}" y="52" width="26" height="26" rx="6" fill="#fff" opacity=".9"/><text x="${20+i*32}" y="71" font-size="16">${['⬆️','➡️','➡️'][i]}</text>`).join('')}${cow(40,44,.42,'#8d5524')}<text x="94" y="40" font-size="22">💧</text></svg>`,
  market: () => `<svg viewBox="0 0 120 90"><circle cx="40" cy="48" r="20" fill="#fdd835" stroke="#c49000" stroke-width="3"/><text x="33" y="56" font-size="20" font-weight="900" fill="#8a6500">5</text><circle cx="80" cy="52" r="16" fill="#cfd8dc" stroke="#78909c" stroke-width="3"/><text x="70" y="59" font-size="16" font-weight="900" fill="#455a64">10</text></svg>`,
};
