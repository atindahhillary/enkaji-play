// Six animated games set in the Maasai Mara life. Each mount(el, api) draws into el.
// Shared motion language (Playful): pop / drop-squash / hop / wiggle / flyTo / burst, ease-out-back.
// Every timer checks el.isConnected, so nothing keeps talking after the child leaves the page.

const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const wait = ms => new Promise(r => setTimeout(r, ms));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const restart = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
const pickNew = (arr, last) => { let x; do x = arr[rnd(0, arr.length - 1)]; while (arr.length > 1 && x === last); return x; };

// ---------- motion primitives ----------
function burst(x, y, n = 12) {
  if (REDUCED) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'), a = (i / n) * Math.PI * 2, d = 50 + Math.random() * 60;
    p.className = 'spark'; p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = BRICKS[i % 6].hex;
    document.body.appendChild(p);
    p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity: 0 }],
      { duration: 600, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
  }
}
const burstAt = el => { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); };

// Flies a copy of `node` to `target` along an arc. Transform-only, so it is cheap on old phones.
function flyTo(node, target, { dur = 520, lift = 90, endScale = .7 } = {}) {
  const a = node.getBoundingClientRect(), b = target.getBoundingClientRect();
  if (REDUCED) return Promise.resolve();
  const g = node.cloneNode(true);
  Object.assign(g.style, { position: 'fixed', left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', margin: 0, zIndex: 60, pointerEvents: 'none' });
  document.body.appendChild(g);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = g.animate([
    { transform: 'translate(0,0) scale(1)' },
    { transform: `translate(${dx / 2}px, ${dy / 2 - lift}px) scale(1.1)`, offset: .45 },
    { transform: `translate(${dx}px, ${dy}px) scale(${endScale})` },
  ], { duration: dur, easing: 'cubic-bezier(.4,0,.2,1)' });
  return anim.finished.then(() => g.remove(), () => g.remove());
}

// Talk in sequence: [{maa:'look'}, {en:'...'}, {sw:'...'}]. Maa plays Mama's recording if one exists.
async function talk(parts) {
  const id = talk.id = (talk.id || 0) + 1;
  for (const p of parts) {
    if (talk.id !== id) return;
    await new Promise(res => {
      const t = setTimeout(res, 7000); // some speech engines never fire onend
      const done = () => { clearTimeout(t); res(); };
      if (p.maa) {
        const m = MAA[p.maa];
        REC.play('maa-' + p.maa).then(a => a || playSanau(p.maa)).then(a => { if (a) { a.onended = done; a.onerror = done; } else speak(m.say, 'sw', done); });
      } else speak(p.sw || p.en, p.sw ? 'sw' : 'en', done);
    });
  }
}

// ---------- the stage every game shares ----------
const HOSTS = {
  koko: () => AV('koko', 'Koko', '#e1f5fe'),
  mama: () => AV('mama', 'Mama', '#ffe0cc'),
  ruth: () => AV('ruth', 'Ruth', '#e3f2fd'),
  naserian: () => AV('girl', 'Naserian', '#e8f5e9'),
};
function stage(el, host, scene, name) {
  el.innerHTML = `<div class="stage ${scene}">
    <div class="sky-life" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="hud"><span class="lvl" data-lvl></span><span data-stars class="pips"></span></div>
    <div class="host"><div class="host-av">${HOSTS[host]()}</div><div class="bubble" data-bubble aria-live="polite"><b>${name}</b><span></span></div></div>
    <div class="arena" data-arena></div>
    <div class="kerri" data-kerri title="Kerri">${lambSVG()}</div>
  </div>`;
  const q = s => el.querySelector(s);
  const st = {
    arena: q('[data-arena]'),
    live: () => el.isConnected,
    // Show text in the bubble, then speak the parts.
    say(text, parts) {
      const b = q('[data-bubble] span'); if (!b) return Promise.resolve();
      b.innerHTML = text; restart(q('[data-bubble]'), 'pop'); restart(q('.host-av'), 'nod');
      return parts ? talk(parts) : Promise.resolve();
    },
    kerri(mood) { const k = q('[data-kerri]'); if (!k) return; k.className = 'kerri'; void k.offsetWidth; k.classList.add(mood); },
    hud(level, label = 'Level') { const l = q('[data-lvl]'); if (l) l.textContent = `${label} ${level}`; },
    win() { const s = q('[data-stars]'); if (s) { s.textContent = '⭐'.repeat(Math.min(++st.k, 10)); restart(s, 'pop'); } },
    k: 0,
  };
  return st;
}
const brickEl = (k, cls = '') => `<div class="db ${cls}" style="--c:${BRICK[k].hex}" data-k="${k}"></div>`;
const cowSVG = col => cowImg(col);
const COATS = [
  { c: '#8d5524', en: 'brown', sw: 'kahawia' }, { c: '#f2efe6', en: 'white', sw: 'mweupe', maa: 'white' },
  { c: '#2b1d16', en: 'black', sw: 'mweusi', maa: 'black' }, { c: '#c1592c', en: 'red', sw: 'mwekundu', maa: 'red' },
  { c: '#9e9e9e', en: 'grey', sw: 'kijivu' },
];

const GAME_MOUNT = {
  // ---------- 1. Copy Koko's Tower: look, remember, rebuild ----------
  copy(el, api) {
    const st = stage(el, 'koko', 's-home', 'Koko');
    let level = [1, 3, 5][(api.tier || 1) - 1], target = [], mine = [], busy = true, wins = 0;
    async function show(fresh = true) {
      busy = true; mine = [];
      if (fresh) target = shuffle(BRICKS.map(b => b.k)).slice(0, Math.min(level + 1, 6));
      st.hud(level); st.kerri('think');
      st.arena.innerHTML = `<div class="towers">
          <div class="tw"><div class="dtower" data-t></div><div class="cloth-cover" data-cover></div><small>Koko's tower</small></div>
          <div class="tw"><div class="dtower" data-m></div><small>Your tower</small></div></div>
        <div class="timer"><i data-timer></i></div>
        <div class="palette" data-pal>${BRICKS.map(b => `<button class="db-btn" data-k="${b.k}" aria-label="${b.name} brick" disabled>${brickEl(b.k)}</button>`).join('')}</div>
        <div class="row center"><button class="btn alt" data-undo>↩ Undo</button></div>`;
      st.say('<b>Tadua!</b> Look at my tower. Remember the colours!', [{ maa: 'look' }, { en: 'Look at my tower. Remember the colours!' }]);
      const T = el.querySelector('[data-t]');
      for (const k of target) { if (!st.live()) return; T.insertAdjacentHTML('beforeend', brickEl(k, 'drop-in')); SND.play('brick'); await wait(260); }
      const secs = Math.max(3, 6 - Math.floor(level / 2)), bar = el.querySelector('[data-timer]');
      bar.style.transition = `transform ${secs}s linear`; requestAnimationFrame(() => bar.style.transform = 'scaleX(0)');
      await wait(secs * 1000); if (!st.live()) return;
      el.querySelector('[data-cover]').classList.add('down'); SND.play('whoosh');
      st.say('Now you build it! Bottom brick first.', [{ en: 'Now you build it! Bottom brick first.' }]);
      st.kerri('cheer');
      el.querySelectorAll('[data-pal] button').forEach((b, i) => { b.disabled = false; b.style.animationDelay = i * 40 + 'ms'; restart(b, 'pop'); });
      busy = false;
      el.querySelectorAll('[data-pal] button').forEach(b => b.onclick = () => add(b.dataset.k));
      el.querySelector('[data-undo]').onclick = () => { if (busy || !mine.length) return; mine.pop(); el.querySelector('[data-m]').lastElementChild?.remove(); SND.play('tap'); };
    }
    function add(k) {
      if (busy || mine.length >= target.length) return;
      mine.push(k); SND.play('brick');
      el.querySelector('[data-m]').insertAdjacentHTML('beforeend', brickEl(k, 'drop-in'));
      speak(BRICK[k].sw, 'sw');
      if (mine.length === target.length) check();
    }
    async function check() {
      busy = true; await wait(450); if (!st.live()) return;
      el.querySelector('[data-cover]').classList.remove('down'); SND.play('whoosh'); await wait(500);
      const ok = mine.join() === target.join(), M = [...el.querySelectorAll('[data-m] .db')];
      if (ok) {
        [...el.querySelectorAll('.dtower .db')].forEach((b, i) => { b.style.animationDelay = (i % 6) * 50 + 'ms'; restart(b, 'hop'); });
        burstAt(el.querySelector('[data-m]')); SND.play('cheer'); st.kerri('happy');
        api.star(); api.played(); st.win(++wins); level++; if (level >= 4) api.badge('memory');
        st.say('Eeh! <b>Sidai oleng!</b> A perfect copy. Hongera!', [{ maa: 'good' }, { en: 'Eeh! A perfect copy. Hongera!' }]);
        nextBtn('Next tower →', () => show(true));
      } else {
        M.forEach((b, i) => { if (mine[i] !== target[i]) restart(b, 'wiggle'), b.classList.add('wrong'); });
        SND.play('no'); st.kerri('think');
        st.say('Pole! Nearly there. Look at the shaking bricks. <b>Jaribu tena</b>, unaweza!', [{ en: 'Pole! Nearly there.' }, { sw: 'Jaribu tena, unaweza!' }]);
        nextBtn('Try the same tower', () => show(false));
      }
    }
    function nextBtn(label, fn) { el.querySelector('[data-pal]').innerHTML = `<button class="btn big pop">${label}</button>`; el.querySelector('[data-pal] .btn').onclick = fn; }
    show();
  },

  // ---------- 2. Count the Cattle home at dusk: one-to-one counting in Maa ----------
  cattle(el, api) {
    const st = stage(el, 'mama', 's-dusk', 'Yeyo (Mama)');
    let wins = [0, 3, 6][(api.tier || 1) - 1], rounds = 0, busy = false;
    const max = () => wins < 3 ? 3 : wins < 6 ? 5 : 10;
    const field = () => `<div class="field"><div class="boma-fence"></div><div class="herd" data-h></div></div><div class="choices" data-c></div>`;
    async function walkIn(H, coat, i, label) {
      H.insertAdjacentHTML('beforeend', `<button class="cowb" style="--d:${i}" aria-label="${label}">${cowSVG(coat.c)}<span class="num"></span></button>`);
      const c = H.lastElementChild;
      if (!REDUCED) c.animate([{ transform: 'translateX(140vw)' }, { transform: 'translateX(0)' }], { duration: 900, easing: 'cubic-bezier(.2,.7,.3,1)' });
      c.classList.add('walking'); setTimeout(() => c.classList.remove('walking'), 900);
      if (i % 2 === 0) SND.play('bell');
      return c;
    }
    async function round() {
      rounds++; busy = true; st.hud(max() === 3 ? 1 : max() === 5 ? 2 : 3);
      if (rounds % 4 === 0 && wins >= 2) return missing();
      const n = rnd(1, max()); st.arena.innerHTML = field(); st.kerri('think');
      st.say('The <b>inkishu</b> are coming home! Watch them come in.', [{ en: 'The cows are coming home. Watch!' }]);
      const H = el.querySelector('[data-h]');
      for (let i = 0; i < n; i++) { if (!st.live()) return; await walkIn(H, COATS[i % COATS.length], i, 'cow'); await wait(380); }
      await wait(500); if (!st.live()) return;
      st.say('Touch each cow and count with me: <b>Nabo, Are, Uni...</b>', [{ en: 'Touch each cow and count with me.' }]);
      let c = 0; busy = false;
      H.querySelectorAll('.cowb').forEach(b => b.onclick = () => {
        if (busy || b.classList.contains('counted')) return;
        c++; b.classList.add('counted'); b.querySelector('.num').textContent = c; restart(b, 'nod'); SND.play('pop');
        const w = NUMBERS[c - 1]; st.say(`<b>${w.maa}</b> · ${w.sw} · ${w.en}`, [{ maa: 'n' + c }]);
        if (c === n) setTimeout(() => ask(n), 900);
      });
    }
    function ask(n) {
      if (!st.live()) return;
      const C = el.querySelector('[data-c]'), opts = shuffle([n, ...shuffle([n - 2, n - 1, n + 1, n + 2].filter(v => v >= 1 && v <= 10)).slice(0, 2)]);
      C.innerHTML = opts.map((o, i) => `<button class="pop" style="animation-delay:${i * 60}ms" data-n="${o}">${o}</button>`).join('');
      st.say('Sasa, how many cows have come home?', [{ en: 'Sasa, how many cows have come home?' }]);
      C.querySelectorAll('button').forEach(b => b.onclick = async () => {
        if (busy) return;
        if (+b.dataset.n !== n) { restart(b, 'wiggle'); SND.play('no'); st.say('Count again, touch each cow.', [{ sw: 'Hesabu tena.' }]); return; }
        busy = true; const w = NUMBERS[n - 1];
        el.querySelectorAll('.cowb').forEach((x, i) => { x.style.animationDelay = i * 50 + 'ms'; restart(x, 'hop'); });
        SND.play('moo'); burstAt(b); st.kerri('happy'); st.win(++wins);
        api.star(1, `⭐ ${w.maa}! ${w.sw}! ${w.en}!`); api.played(); api.bump('cattle', 5, 'cattle');
        await st.say(`<b>${w.maa}!</b> ${w.sw}! ${w.en} cows are home. <b>Sidai oleng!</b>`, [{ maa: 'n' + n }, { sw: w.sw + '!' }, { maa: 'good' }]);
        if (st.live()) round();
      });
    }
    // Herders check for missing cows by their coat colour.
    async function missing() {
      const k = Math.min(3 + Math.floor(wins / 4), 5), herd = shuffle(COATS).slice(0, k), lost = herd[rnd(0, k - 1)];
      st.arena.innerHTML = `<p class="small mute center">This morning the herd went out:</p><div class="herd mini">${herd.map(h => `<span>${cowSVG(h.c)}</span>`).join('')}</div>${field()}`;
      st.kerri('think');
      st.say('Look at this morning\'s herd. Now they come home...', [{ en: 'Look at the herd this morning. Now they come home.' }]);
      await wait(2200); if (!st.live()) return;
      const H = el.querySelector('[data-h]');
      for (const [i, h] of herd.filter(h => h !== lost).entries()) { if (!st.live()) return; await walkIn(H, h, i, h.en + ' cow'); await wait(400); }
      await wait(400); if (!st.live()) return;
      st.say('Oh no! Which cow did <b>not</b> come home?', [{ en: 'Oh no! Which cow did not come home?' }]);
      const C = el.querySelector('[data-c]');
      C.innerHTML = herd.map(h => `<button class="cow-pick pop" data-c="${h.c}" aria-label="${h.en} cow">${cowSVG(h.c)}</button>`).join('');
      busy = false;
      C.querySelectorAll('button').forEach(b => b.onclick = async () => {
        if (busy) return;
        if (b.dataset.c !== lost.c) { restart(b, 'wiggle'); SND.play('no'); st.say('That one is home. Look again!', [{ en: 'That one is home. Look again!' }]); return; }
        busy = true; C.innerHTML = '';
        await walkIn(H, lost, 9, 'found cow'); SND.play('moo'); st.kerri('happy'); st.win(++wins);
        api.star(2, `⭐⭐ You found the ${lost.en} cow!`); api.played();
        await st.say(`You found the <b>${lost.en}</b> cow! ${lost.maa ? MAA[lost.maa].w + ' · ' : ''}${lost.sw}.`, [{ en: `You found the ${lost.en} cow!` }, { maa: 'good' }]);
        if (st.live()) round();
      });
    }
    round();
  },

  // ---------- 3. Mama's Collar: finish the bead pattern, or make your own ----------
  beads(el, api) {
    const st = stage(el, 'mama', 's-shade', 'Yeyo (Mama)');
    const C = ['#E53935', '#ffffff', '#1E88E5', '#FDD835', '#43A047', '#FB8C00'];
    const NAME = { '#E53935': 'red', '#ffffff': 'white', '#1E88E5': 'blue', '#FDD835': 'yellow', '#43A047': 'green', '#FB8C00': 'orange' };
    const KINDS = ['AB', 'AB', 'AAB', 'ABB', 'ABC', 'ABC'];
    let wins = [0, 4, 8][(api.tier || 1) - 1], busy = false, mode = 'pattern';
    const pos = (i, n) => { const t = Math.PI * (i + .5) / n; return `left:${50 - 44 * Math.cos(t)}%;top:${8 + 72 * Math.sin(t)}%`; };
    const head = () => `<div class="chips center"><button class="chip ${mode === 'pattern' ? 'on' : ''}" data-m="pattern">📿 Finish Mama's pattern</button><button class="chip ${mode === 'free' ? 'on' : ''}" data-m="free">🎨 Make my own collar</button></div>`;
    const bindHead = () => el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; mode === 'free' ? free() : round(); });
    function round() {
      busy = false; st.kerri('think');
      const lvl = Math.min(Math.floor(wins / 2), KINDS.length - 1), kind = KINDS[lvl], cols = shuffle(C).slice(0, 3);
      st.hud(lvl + 1);
      const unit = kind.split('').map(ch => cols[ch.charCodeAt(0) - 65]), n = Math.max(9, unit.length * 3 + 1);
      const seq = Array.from({ length: n }, (_, i) => unit[i % unit.length]);
      const gap = wins >= 8 ? rnd(2, n - 3) : n - 1, ans = seq[gap];
      const opts = shuffle([...new Set([ans, ...shuffle(C)])].slice(0, 3)); if (!opts.includes(ans)) opts[0] = ans;
      st.arena.innerHTML = head() + `<div class="collar"><svg viewBox="0 0 100 100" preserveAspectRatio="none" class="string"><path d="M6 8 Q50 150 94 8" fill="none" stroke="#6d4c41" stroke-width=".8"/></svg>
        ${seq.map((c, i) => `<span class="cbead ${i === gap ? 'q' : 'drop-in'}" style="${pos(i, n)};${i === gap ? '' : `background:${c};animation-delay:${i * 45}ms`}" data-i="${i}">${i === gap ? '?' : ''}</span>`).join('')}</div>
        <p class="center small mute">Mama's bowl of <b>isaen</b> (beads):</p><div class="bowl">${opts.map(c => `<button class="bbead" style="background:${c}" data-c="${c}" aria-label="${NAME[c]} bead"></button>`).join('')}</div>`;
      bindHead();
      seq.forEach((_, i) => i < 6 && setTimeout(() => st.live() && SND.play('clink'), i * 90));
      st.say('I am making a collar for the ceremony. Which bead comes next?', [{ en: 'Which bead comes next?' }]);
      const slot = el.querySelector('.cbead.q');
      el.querySelectorAll('.bbead').forEach(b => b.onclick = async () => {
        if (busy) return; busy = true;
        await flyTo(b, slot, { endScale: .9 }); if (!st.live()) return;
        if (b.dataset.c === ans) {
          slot.classList.remove('q'); slot.textContent = ''; slot.style.background = ans; restart(slot, 'snap'); SND.play('clink');
          el.querySelectorAll('.cbead').forEach((x, i) => { x.style.animationDelay = i * 40 + 'ms'; restart(x, 'hop'); });
          burstAt(slot); SND.play('cheer'); st.kerri('happy'); st.win(++wins);
          api.star(1, '⭐ Beautiful beadwork!'); api.played(); api.bump('beads', 5, 'beads');
          await st.say('<b>Sidai oleng!</b> Hongera! The pattern goes round and round.', [{ maa: 'good' }, { sw: 'Hongera!' }]);
          if (st.live() && mode === 'pattern') round();
        } else {
          restart(b, 'wiggle'); SND.play('no'); st.kerri('think'); busy = false;
          st.say('That bead does not fit. Say the pattern out loud with me.', [{ en: 'Say the pattern out loud with me.' }]);
        }
      });
    }
    function free() {
      const beads = []; st.hud('Free', ''); st.kerri('happy');
      st.arena.innerHTML = head() + `<div class="collar" data-col><svg viewBox="0 0 100 100" preserveAspectRatio="none" class="string"><path d="M6 8 Q50 150 94 8" fill="none" stroke="#6d4c41" stroke-width=".8"/></svg></div>
        <div class="bowl">${C.map(c => `<button class="bbead" style="background:${c}" data-c="${c}" aria-label="${NAME[c]} bead"></button>`).join('')}</div>`;
      bindHead();
      st.say('Make your own collar. Every collar is beautiful!', [{ en: 'Make your own collar. Every collar is beautiful!' }]);
      const N = 13, col = el.querySelector('[data-col]');
      el.querySelectorAll('.bbead').forEach(b => b.onclick = () => {
        if (beads.length >= N) return;
        beads.push(b.dataset.c); col.insertAdjacentHTML('beforeend', `<span class="cbead drop-in" style="${pos(beads.length - 1, N)};background:${b.dataset.c}"></span>`); SND.play('clink');
        if (beads.length === N) {
          SND.play('cheer'); burstAt(col); st.kerri('happy');
          api.star(1, '⭐ What a collar!'); api.played();
          st.say('<b>Sidai oleng!</b> Show your collar to Mama!', [{ maa: 'good' }, { en: 'Show your collar to Mama!' }]);
          col.insertAdjacentHTML('afterend', '<div class="center"><button class="btn pop" data-again>Make another</button></div>');
          el.querySelector('[data-again]').onclick = free;
        }
      });
    }
    round();
  },

  // ---------- 4. Talek Market Colour Hunt: find the shuka Mama asks for ----------
  colour(el, api) {
    const st = stage(el, 'mama', 's-market', 'Yeyo (Mama)');
    const EXTRA = [{ k: 'w', name: 'White', sw: 'Nyeupe', hex: '#f5f5f5', maa: 'white' }, { k: 'k', name: 'Black', sw: 'Nyeusi', hex: '#222', maa: 'black' }];
    const ALL = [...BRICKS.map(b => ({ ...b, maa: BRICK_MAA[b.k] })), ...EXTRA];
    let lang = 'en', found = [0, 4, 8][(api.tier || 1) - 1], busy = false, last;
    function round() {
      busy = false; st.kerri('think');
      const pool = lang === 'maa' ? ALL.filter(c => c.maa) : ALL.slice(0, 6);
      const n = lang === 'maa' ? 3 : found < 4 ? 3 : found < 8 ? 4 : 6;
      const target = pickNew(pool, last); last = target;
      const show = shuffle([target, ...shuffle(ALL.filter(c => c !== target)).slice(0, n - 1)]);
      const word = lang === 'en' ? target.name : lang === 'sw' ? target.sw : (MAA[target.maa].w || '🔊');
      st.hud(found < 4 ? 1 : found < 8 ? 2 : 3);
      st.arena.innerHTML = `<div class="chips center">${[['en', 'English'], ['sw', 'Kiswahili'], ['maa', 'Maa']].map(([k, t]) => `<button class="chip ${lang === k ? 'on' : ''}" data-l="${k}">${t}</button>`).join('')}</div>
        <div class="line"><div class="rope"></div>${show.map((c, i) => `<button class="cloth" style="--cc:${c.hex};animation-delay:${-i * .7}s" data-k="${c.k}" aria-label="${c.name} shuka">${c.k === 'k' || c.k === 'w' ? '' : ''}</button>`).join('')}</div>
        <div class="basket" data-basket aria-hidden="true">🧺</div>`;
      el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { lang = b.dataset.l; round(); });
      const ask = lang === 'en' ? [{ en: 'Please find the ' + word + ' shuka' }] : lang === 'sw' ? [{ sw: 'Tafadhali tafuta shuka ' + word.toLowerCase() }] : [{ maa: target.maa }];
      st.say(`Go to Talek market and find the <b class="word">${word}</b> shuka! <button class="listen" data-again>🔊</button>`, ask);
      el.querySelector('[data-again]').onclick = () => talk(ask);
      el.querySelectorAll('.cloth').forEach(b => b.onclick = async () => {
        if (busy) return;
        const c = ALL.find(x => x.k === b.dataset.k);
        if (c !== target) {
          restart(b, 'wiggle'); SND.play('no'); el.querySelector('.word')?.classList.add('hint');
          talk(lang === 'en' ? [{ en: 'That is ' + c.name }] : lang === 'sw' || !c.maa ? [{ sw: 'Hiyo ni ' + c.sw.toLowerCase() }] : [{ maa: c.maa }]);
          return;
        }
        busy = true; SND.play('pop');
        await flyTo(b, el.querySelector('[data-basket]')); if (!st.live()) return;
        b.style.visibility = 'hidden'; restart(el.querySelector('[data-basket]'), 'squash'); SND.play('cheer'); st.kerri('happy'); st.win(++found);
        api.star(1, `⭐ ${target.name} · ${target.sw}`); api.played(); api.bump('colour', 6, 'colour');
        await st.say(`<b>${target.name}</b> · ${target.sw}${target.maa && MAA[target.maa].w ? ' · ' + MAA[target.maa].w : ''}. Asante!`, [{ sw: 'Asante sana!' }]);
        if (st.live()) round();
      });
    }
    round();
  },

  // ---------- 5. Ruth's Market Stall: pay the exact price with Kenyan coins ----------
  market(el, api) {
    const st = stage(el, 'ruth', 's-stall', 'Ruth');
    const L1 = [['🍬', 'Sweet (pipi)', 2], ['🧅', 'Onion', 5], ['🍅', 'Tomato', 10], ['🍩', 'Mandazi', 10], ['🍌', 'Banana', 5], ['🧂', 'Salt', 10]];
    const L2 = [['🥚', 'Egg', 15], ['🍵', 'Tea leaves', 20], ['🌽', 'Roast maize', 20], ['🥛', 'Cup of milk', 30], ['🍚', 'Cup of sugar', 25]];
    let wins = [0, 2, 3][(api.tier || 1) - 1], busy = false, last;
    function round() {
      busy = false; st.kerri('think');
      const big = wins >= 3, coins = big ? [1, 5, 10, 20] : [1, 5];
      const item = pickNew(big ? [...L1, ...L2] : L1, last); last = item;
      const [icon, name, price] = item; let paid = [];
      st.hud(big ? 2 : 1);
      st.arena.innerHTML = `<div class="stall"><div class="awning"></div><div class="goods"><span class="item float">${icon}</span><span class="price-tag">KSh ${price}</span></div><div class="tray" data-tray></div></div>
        <h3 class="center">You gave: <span data-sum>0</span> / ${price} shillings</h3>
        <div class="coins">${coins.map(c => `<button class="coin ${c >= 10 ? 's' : ''}" data-c="${c}" aria-label="${c} shillings">${c}<small>KSh</small></button>`).join('')}</div>
        <div class="row center"><button class="btn alt" data-back>Take back coins</button><button class="btn" data-pay>Pay Ruth</button></div><div class="basket small-basket" data-basket aria-hidden="true">🧺</div>`;
      st.say(`Karibu! <b>${name}</b> is ${price} shillings. Pay me the exact money, please.`, [{ en: `Karibu! ${name} is ${price} shillings.` }]);
      const tray = el.querySelector('[data-tray]'), sumEl = el.querySelector('[data-sum]');
      const sum = () => paid.reduce((a, b) => a + b, 0);
      const update = () => {
        const s = sum(); sumEl.textContent = s; restart(sumEl, 'pop');
        sumEl.style.color = s > price ? 'var(--r)' : s === price ? 'var(--g)' : 'var(--brand)';
        st.kerri(s === price ? 'happy' : 'think');
      };
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = async () => {
        if (busy) return; const v = +b.dataset.c;
        SND.play('coin'); paid.push(v); update();
        flyTo(b, tray, { endScale: .5, dur: 450 }).then(() => { if (!st.live()) return; tray.insertAdjacentHTML('beforeend', `<span class="mini-coin ${v >= 10 ? 's' : ''} pop">${v}</span>`); });
        if (sum() > price) {
          busy = true; await wait(650); if (!st.live()) return;
          st.say(`Aii, that is too much! That is ${sum()}. Ruth gives your coin back.`, [{ en: 'Aii, that is too much! Here is your coin back.' }]);
          const back = tray.lastElementChild; paid.pop();
          if (back) { await flyTo(back, b, { endScale: 1 }); back.remove(); }
          SND.play('no'); update(); busy = false;
        } else if (sum() === price) st.say('Sawa sawa! Exactly right. Now press <b>Pay Ruth</b>.', [{ en: 'Sawa sawa! Exactly right. Now press Pay Ruth.' }]);
      });
      el.querySelector('[data-back]').onclick = () => { if (busy) return; paid = []; tray.innerHTML = ''; update(); SND.play('whoosh'); };
      el.querySelector('[data-pay]').onclick = async () => {
        if (busy) return; const s = sum();
        if (s !== price) { restart(el.querySelector('[data-pay]'), 'wiggle'); SND.play('no'); st.say(s < price ? `Not enough. You need <b>${price - s}</b> more.` : 'Too much!', [{ en: s < price ? `Not enough. You need ${price - s} more.` : 'Too much!' }]); return; }
        busy = true; SND.play('coin');
        await flyTo(el.querySelector('.item'), el.querySelector('[data-basket]'), { lift: 120 }); if (!st.live()) return;
        restart(el.querySelector('[data-basket]'), 'squash'); burstAt(el.querySelector('[data-basket]')); SND.play('cheer'); st.kerri('happy'); st.win(++wins);
        api.star(1, '⭐ Asante! Exact money!'); api.played(); api.bump('market', 4, 'market');
        await st.say('<b>Asante sana!</b> Karibu tena!', [{ sw: 'Asante sana! Karibu tena!' }]);
        if (st.live()) round();
      };
    }
    round();
  },

  // ---------- 6. Code the Cow: unplugged-style coding with arrow cards ----------
  code(el, api) {
    const st = stage(el, 'naserian', 's-grass', 'Naserian');
    const DIR = { up: [0, -1, '⬆️'], down: [0, 1, '⬇️'], left: [-1, 0, '⬅️'], right: [1, 0, '➡️'] };
    let level = [1, 3, 5][(api.tier || 1) - 1], wins = 0, busy = false, prog = [], map;
    const key = (x, y) => x + ',' + y;
    function makeMap() {
      const n = level < 3 ? 4 : 5;
      for (;;) {
        const start = [0, n - 1], goal = [rnd(Math.ceil(n / 2), n - 1), rnd(0, Math.floor(n / 2))], trees = new Set();
        while (trees.size < Math.min(level - 1, 5)) { const t = [rnd(0, n - 1), rnd(0, n - 1)]; if (key(...t) !== key(...start) && key(...t) !== key(...goal)) trees.add(key(...t)); }
        // Breadth-first search: only keep maps the cow can actually solve.
        const seen = new Set([key(...start)]), q = [start];
        while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of Object.values(DIR)) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (nx >= 0 && ny >= 0 && nx < n && ny < n && !trees.has(k) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); } } }
        if (seen.has(key(...goal))) return { n, start, goal, trees };
      }
    }
    function round(fresh = true) {
      busy = false; prog = []; if (fresh) map = makeMap(); st.hud(level); st.kerri('think');
      const { n, start, goal, trees } = map;
      let cells = '';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) cells += `<div class="cell">${trees.has(key(x, y)) ? '<span class="tree sway2">🌳</span>' : key(x, y) === key(...goal) ? '<span class="trough">💧</span>' : ''}</div>`;
      st.arena.innerHTML = `<div class="grid-wrap"><div class="cgrid" style="--n:${n}">${cells}<div class="cow-tok" data-cow>${cowSVG('#8d5524')}</div></div></div>
        <div class="program" data-prog aria-label="Your code"><span class="mute small">Your code: tap the arrows</span></div>
        <div class="cards">${Object.entries(DIR).map(([k, d]) => `<button class="card-btn" data-d="${k}" aria-label="${k}">${d[2]}</button>`).join('')}</div>
        <div class="row center"><button class="btn alt" data-undo>↩ Undo</button><button class="btn alt" data-clear>Clear</button><button class="btn" data-run>▶ Run code</button></div>`;
      place(...start, false);
      st.say('The cow is thirsty! Give her steps to reach the <b>enkare</b> (water). Watch out for trees!', [{ en: 'The cow is thirsty! Give her steps to reach the water.' }, { maa: 'water' }]);
      const P = el.querySelector('[data-prog]');
      const draw = () => { P.innerHTML = prog.length ? prog.map((d, i) => `<span class="pcard pop" data-i="${i}">${DIR[d][2]}</span>`).join('') : '<span class="mute small">Your code: tap the arrows</span>'; };
      el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (busy || prog.length >= 14) return; prog.push(b.dataset.d); SND.play('tap'); draw(); });
      el.querySelector('[data-undo]').onclick = () => { if (busy) return; prog.pop(); draw(); };
      el.querySelector('[data-clear]').onclick = () => { if (busy) return; prog = []; draw(); place(...start); };
      el.querySelector('[data-run]').onclick = run;
    }
    function place(x, y, anim = true) {
      const c = el.querySelector('[data-cow]'); if (!c) return;
      c.style.transition = anim ? 'transform .38s cubic-bezier(.2,.8,.3,1.2)' : 'none';
      c.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
    }
    async function run() {
      if (busy || !prog.length) return; busy = true;
      const { n, start, goal, trees } = map; let [x, y] = start; place(x, y, false); await wait(150);
      const cards = el.querySelectorAll('.pcard'), cowEl = el.querySelector('[data-cow]');
      for (let i = 0; i < prog.length; i++) {
        if (!st.live()) return;
        cards.forEach(c => c.classList.remove('now')); cards[i].classList.add('now');
        const [dx, dy] = DIR[prog[i]], nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n || trees.has(key(nx, ny))) {
          cards[i].classList.add('bug'); restart(cowEl, 'wiggle'); SND.play('no'); st.kerri('think');
          st.say(`Pole! A <b>bug</b> at step ${i + 1}! ${trees.has(key(nx, ny)) ? 'A tree is in the way.' : 'That is outside the field.'} Fix the code and run again.`, [{ en: 'Pole! A bug. Fix the code and run again.' }]);
          busy = false; return;
        }
        x = nx; y = ny; place(x, y); SND.play('tap'); await wait(450);
      }
      if (key(x, y) === key(...goal)) {
        restart(cowEl, 'hop'); SND.play('moo'); burstAt(cowEl); st.kerri('happy'); st.win(++wins); level++;
        api.star(1, '⭐ You coded the cow to the water!'); api.played(); api.bump('code', 3, 'coder');
        await st.say(`<b>Sidai oleng!</b> Your code worked in ${prog.length} steps. That is what programmers do!`, [{ maa: 'good' }, { en: 'Your code worked! That is what programmers do!' }]);
        if (st.live()) el.querySelector('.cards').innerHTML = '<button class="btn big pop" data-next>Next field →</button>', el.querySelector('[data-next]').onclick = () => round(true);
      } else {
        st.kerri('think'); SND.play('no');
        st.say('The cow is still thirsty. Add more steps to reach the water.', [{ en: 'The cow is still thirsty. Add more steps.' }]);
        busy = false;
      }
    }
    round();
  },
  // ===== Mama and child games (voice first, no reading needed) =====

  // ---------- 7. Sort the Harvest: tap the right basket for each thing on Mama's tray ----------
  harvest(el, api) {
    const st = stage(el, 'mama', 's-shade', 'Yeyo (Mama)');
    let level = [1, 2, 3][(api.tier || 1) - 1], wins = 0, busy = true;
    function round() {
      busy = true;
      const kinds = level < 2 ? ['bean', 'maize'] : ['bean', 'maize', 'stone'];
      const items = shuffle(Array.from({ length: 4 + level * 2 }, (_, i) => kinds[i % kinds.length]));
      const counts = Object.fromEntries(kinds.map(k => [k, 0]));
      st.hud(level); st.kerri('think');
      st.arena.innerHTML = `<div class="tray-row"><div class="mama-tray"></div><div class="drop-zone" data-zone></div></div>
        <div class="baskets">${kinds.map(k => `<button class="basket-b" data-k="${k}" aria-label="${HARVEST[k].t} basket">${basketSVG(k)}<span class="bcount">0</span></button>`).join('')}</div>
        <p class="small mute center">Left on the tray: <b data-left>${items.length}</b></p>`;
      st.say('Help Mama sort the harvest! Put each one in its own basket.', [{ en: 'Help Mama sort the harvest! Put each one in its own basket.' }]);
      const zone = el.querySelector('[data-zone]');
      let idx = 0;
      const next = () => {
        if (!st.live()) return;
        if (idx >= items.length) return done();
        zone.innerHTML = `<div class="falling" data-k="${items[idx]}">${HARVEST[items[idx]].svg}</div>`;
        SND.play('whoosh'); busy = false;
      };
      el.querySelectorAll('.basket-b').forEach(b => b.onclick = async () => {
        const item = zone.firstElementChild; if (busy || !item) return;
        const k = item.dataset.k;
        if (b.dataset.k !== k) { restart(b, 'wiggle'); SND.play('no'); talk([{ en: `That is ${HARVEST[k].t}. Find the ${HARVEST[k].t} basket.` }]); return; }
        busy = true; await flyTo(item, b, { endScale: .35 }); if (!st.live()) return;
        item.remove(); counts[k]++; b.querySelector('.bcount').textContent = counts[k];
        restart(b, 'squash'); SND.play('pop'); talk([{ maa: 'n' + counts[k] }]);
        el.querySelector('[data-left]').textContent = items.length - ++idx;
        setTimeout(next, 450);
      });
      setTimeout(next, 900);
      async function done() {
        busy = true; st.kerri('happy'); SND.play('cheer'); burstAt(el.querySelector('.baskets')); st.win(++wins);
        el.querySelectorAll('.basket-b').forEach((b, i) => { b.style.animationDelay = i * 80 + 'ms'; restart(b, 'hop'); });
        api.star(1, '⭐ The harvest is sorted!'); api.played(); api.bump('together', 5, 'together');
        const said = kinds.map(k => `${counts[k]} ${HARVEST[k].t}`).join(', ');
        level = Math.max(level, Math.min(3, 1 + Math.floor(wins / 2)));
        await st.say(`<b>Sidai oleng!</b> ${said}. Now count them again with Mama!`, [{ maa: 'good' }, { en: said + '. Now count them again with Mama!' }]);
        if (st.live()) { el.querySelector('[data-zone]').innerHTML = '<button class="btn big pop" data-more>More harvest →</button>'; el.querySelector('[data-more]').onclick = round; }
      }
    }
    round();
  },

  // ---------- 8. Milking Time: fill exactly the cups Mama asks for, then STOP ----------
  milk(el, api) {
    const st = stage(el, 'mama', 's-home', 'Yeyo (Mama)');
    let wins = [0, 3, 6][(api.tier || 1) - 1], busy = false, rounds = 0;
    const cupsHTML = (n, fills = []) => Array.from({ length: n }, (_, i) => `<button class="cup" data-i="${i}" aria-label="cup ${i + 1}"><i style="height:${fills[i] || 0}%"></i></button>`).join('');
    function round() {
      rounds++; busy = false; st.kerri('think');
      if (wins >= 2 && rounds % 3 === 0) return compare();
      const max = wins < 3 ? 5 : 10, n = rnd(1, max), total = max;
      st.hud(max === 5 ? 1 : 2);
      st.arena.innerHTML = `<div class="milk-scene"><button class="cow-btn" data-cow aria-label="Milk the cow">${cowImg('#f2efe6', 'cow')}</button><div class="cups">${cupsHTML(total)}</div></div>
        <div class="row center"><button class="btn big" data-done>✋ Stop! Done</button></div>`;
      st.say(`Mama needs <b>${n}</b> ${n === 1 ? 'cup' : 'cups'} of <b>kule</b> (milk). Tap the cow to fill each cup, then press <b>Stop</b>.`, [{ en: `Mama needs ${n} ${n === 1 ? 'cup' : 'cups'} of milk. Tap the cow to fill each cup. Then press stop.` }, { maa: 'milk' }]);
      let filled = 0;
      const cups = [...el.querySelectorAll('.cup')], cowB = el.querySelector('[data-cow]');
      cowB.onclick = async () => {
        if (busy || filled >= total) return;
        restart(cowB, 'nod'); SND.play('pop');
        const drop = document.createElement('span'); drop.className = 'milk-drop'; cowB.appendChild(drop);
        await flyTo(drop, cups[filled], { dur: 380, lift: 30, endScale: .6 }); drop.remove(); if (!st.live()) return;
        cups[filled].classList.add('full'); filled++;
        const w = NUMBERS[filled - 1]; st.say(`<b>${w.maa}</b> · ${w.sw} · ${w.en}`, [{ maa: 'n' + filled }]);
      };
      // Tap the last full cup to pour it back.
      cups.forEach((c, i) => c.onclick = () => { if (busy || i !== filled - 1) return; c.classList.remove('full'); filled--; SND.play('whoosh'); });
      el.querySelector('[data-done]').onclick = async () => {
        if (busy) return;
        if (filled === n) {
          busy = true; cups.slice(0, n).forEach((c, i) => { c.style.animationDelay = i * 60 + 'ms'; restart(c, 'hop'); });
          SND.play('moo'); st.kerri('happy'); burstAt(el.querySelector('.cups')); st.win(++wins);
          api.star(1, `⭐ ${n} cups, exactly!`); api.played(); api.bump('together', 5, 'together');
          await st.say(`<b>Sidai oleng!</b> ${n} ${n === 1 ? 'cup' : 'cups'}, exactly what Mama needed. You stopped at the right time!`, [{ maa: 'good' }, { en: `${n}, exactly! You stopped at the right time!` }]);
          if (st.live()) round();
        } else if (filled < n) { restart(el.querySelector('[data-done]'), 'wiggle'); SND.play('no'); st.say(`Not yet! Mama needs <b>${n}</b>. We have ${filled}. Fill ${n - filled} more.`, [{ en: `Not yet. We need ${n - filled} more.` }]); }
        else { cups.slice(n, filled).forEach(c => restart(c, 'wiggle')); SND.play('no'); st.say(`Too many! Mama asked for <b>${n}</b>. Tap the last cup to pour milk back.`, [{ en: `Too many! Mama asked for ${n}. Pour some back.` }]); }
      };
    }
    // Comparing: which cup has more (or less) milk?
    function compare() {
      st.hud('More/Less', '');
      const a = rnd(20, 90); let b = rnd(20, 90); while (Math.abs(a - b) < 25) b = rnd(15, 95);
      const ask = wins >= 5 && Math.random() < .5 ? 'LESS' : 'MORE', want = ask === 'MORE' ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
      st.arena.innerHTML = `<div class="cups big-cups">${cupsHTML(2, [a, b])}</div>`;
      st.say(`Which cup has <b>${ask.toLowerCase()}</b> milk?`, [{ en: `Which cup has ${ask.toLowerCase()} milk?` }]);
      el.querySelectorAll('.cup').forEach(c => { c.classList.add('full-auto'); c.onclick = async () => {
        if (busy) return;
        if (+c.dataset.i !== want) { restart(c, 'wiggle'); SND.play('no'); talk([{ en: 'Look again. Compare the milk.' }]); return; }
        busy = true; restart(c, 'hop'); SND.play('cheer'); st.kerri('happy'); burstAt(c); st.win(++wins);
        api.star(1, `⭐ That cup has ${ask.toLowerCase()}!`); api.played(); api.bump('together', 5, 'together');
        await st.say(`Yes! That cup has <b>${ask.toLowerCase()}</b> milk.`, [{ en: `Yes! That cup has ${ask.toLowerCase()} milk.` }]);
        if (st.live()) round();
      }; });
    }
    round();
  },

  // ---------- 9. Drum Echo: listen to Mama's drum, play it back (no reading at all) ----------
  drum(el, api) {
    const st = stage(el, 'mama', 's-dusk', 'Yeyo (Mama)');
    let len = [2, 4, 6][(api.tier || 1) - 1], wins = 0, busy = true, seq = [], input = [];
    const hit = k => { const d = el.querySelector(`[data-d="${k}"]`); if (!d) return; restart(d, 'squash'); SND.play(k === 'L' ? 'drum' : 'drumHi'); };
    async function playSeq() {
      busy = true; st.kerri('think');
      st.say('Listen to Mama’s drum...', [{ en: 'Listen to Mama’s drum.' }]);
      await wait(1500);
      for (const k of seq) { if (!st.live()) return; hit(k); await wait(650); }
      if (!st.live()) return;
      input = []; busy = false;
      st.say('Your turn! Play it back. <b>Big drum</b> or <b>small drum</b>?', [{ en: 'Your turn! Play it back.' }]);
    }
    function round() {
      st.hud(len - 1);
      seq = Array.from({ length: len }, () => Math.random() < .5 ? 'L' : 'H');
      st.arena.innerHTML = `<div class="drums">${['L', 'H'].map(k => `<button class="drum-b ${k === 'L' ? 'big' : 'small'}" data-d="${k}" aria-label="${k === 'L' ? 'Big drum' : 'Small drum'}">${drumSVG(k)}</button>`).join('')}</div>
        <div class="row center"><button class="btn alt" data-again>🔁 Hear it again</button></div><div class="beats" data-beats>${seq.map(() => '<i></i>').join('')}</div>`;
      el.querySelector('[data-again]').onclick = () => { if (!busy) playSeq(); };
      el.querySelectorAll('.drum-b').forEach(d => d.onclick = async () => {
        if (busy) { hit(d.dataset.d); return; } // free play while Mama is playing is fine, it just does not count
        hit(d.dataset.d); input.push(d.dataset.d);
        const dots = el.querySelectorAll('[data-beats] i'); dots[input.length - 1]?.classList.add('on');
        if (input[input.length - 1] !== seq[input.length - 1]) {
          busy = true; SND.play('no'); st.kerri('think');
          await st.say('Almost! Listen again carefully.', [{ en: 'Almost! Listen again carefully.' }]);
          dots.forEach(x => x.classList.remove('on'));
          if (st.live()) playSeq(); return;
        }
        if (input.length === seq.length) {
          busy = true; SND.play('cheer'); st.kerri('happy'); burstAt(el.querySelector('.drums')); st.win(++wins);
          api.star(1, '⭐ Perfect echo!'); api.played(); api.bump('together', 5, 'together');
          len = Math.min(6, len + 1);
          await st.say('<b>Sidai oleng!</b> You played it just like Mama!', [{ maa: 'good' }, { en: 'You played it just like Mama!' }]);
          if (st.live()) round();
        }
      });
      playSeq();
    }
    round();
  },
  // ===== CBE literacy and numeracy games (PP1 to Grade 3) =====

  // ---------- 10. Silabi za Nyumbani: build Kiswahili words from syllables ----------
  // CBE: Kiswahili Language Activities, Grade 1-2, kusoma silabi na maneno.
  silabi(el, api) {
    const st = stage(el, 'mama', 's-home', 'Yeyo (Mama)');
    let wins = [0, 4, 7][(api.tier || 1) - 1], busy = false, last;
    function round() {
      busy = false; st.kerri('think');
      const pool = WORDS_SW.filter(w => wins < 4 ? w.s.length === 2 : true);
      const w = pickNew(pool, last); last = w;
      const extras = shuffle(['ka', 'pi', 'lo', 'ne', 'ru', 'se', 'wa', 'bo'].filter(x => !w.s.includes(x))).slice(0, Math.min(3, 1 + Math.floor(wins / 3)));
      const tiles = shuffle([...w.s, ...extras]);
      let built = [];
      st.hud(w.s.length === 2 ? 1 : 2);
      st.arena.innerHTML = `<div class="word-pic">${pic(w.pic)}</div>
        <div class="slots">${w.s.map((_, i) => `<span class="slot" data-i="${i}"></span>`).join('')}</div>
        <div class="syl-tiles">${tiles.map((s, i) => `<button class="syl" data-s="${s}" data-t="${i}">${s}</button>`).join('')}</div>
        <div class="row center"><button class="btn alt" data-undo>↩ Rudi</button><button class="listen" data-hear>🔊 Sikiliza tena</button></div>`;
      const ask = () => talk([{ sw: `Jenga neno: ${w.w}. ${w.s.join(', ')}.` }]);
      st.say(`Jenga neno! <b>Build the word</b> for this picture. Tap the syllables in order.`, [{ sw: 'Jenga neno.' }, { sw: w.w }]);
      el.querySelector('[data-hear]').onclick = ask;
      el.querySelector('[data-undo]').onclick = () => {
        if (busy || !built.length) return; const b = built.pop(); b.btn.disabled = false; b.btn.classList.remove('used');
        el.querySelectorAll('.slot')[built.length].textContent = ''; SND.play('tap');
      };
      el.querySelectorAll('.syl').forEach(b => b.onclick = async () => {
        if (busy || b.disabled) return;
        const slot = el.querySelectorAll('.slot')[built.length]; if (!slot) return;
        speak(b.dataset.s, 'sw'); SND.play('pop');
        await flyTo(b, slot, { dur: 320, lift: 40, endScale: 1 }); if (!st.live()) return;
        slot.textContent = b.dataset.s; restart(slot, 'snap'); b.disabled = true; b.classList.add('used');
        built.push({ s: b.dataset.s, btn: b });
        if (built.length === w.s.length) check();
      });
      async function check() {
        busy = true;
        if (built.map(x => x.s).join('') === w.s.join('')) {
          el.querySelectorAll('.slot').forEach((s, i) => { s.style.animationDelay = i * 80 + 'ms'; restart(s, 'hop'); });
          SND.play('cheer'); st.kerri('happy'); burstAt(el.querySelector('.slots')); st.win(++wins);
          api.star(1, `⭐ ${w.w}!`); api.played(); api.bump('readers', 8, 'reader');
          await st.say(`<b>Hongera!</b> ${w.s.join(' + ')} = <b>${w.w}</b> (${w.en}).`, [{ sw: `Hongera! ${w.w}.` }]);
          if (st.live()) round();
        } else {
          SND.play('no'); st.kerri('think'); el.querySelectorAll('.slot').forEach(s => restart(s, 'wiggle'));
          await st.say('Karibu! Sikiliza tena, then try again.', [{ sw: 'Karibu! Sikiliza tena.' }, { sw: w.s.join(', ') }]);
          built.forEach(x => { x.btn.disabled = false; x.btn.classList.remove('used'); }); built = [];
          el.querySelectorAll('.slot').forEach(s => s.textContent = ''); busy = false;
        }
      }
    }
    round();
  },

  // ---------- 11. Letter Sounds at the Boma: which picture starts with this letter? ----------
  // CBE: English Language Activities, PP2 to Grade 1, letter-sound recognition.
  letters(el, api) {
    const st = stage(el, 'naserian', 's-grass', 'Naserian');
    let wins = [0, 4, 6][(api.tier || 1) - 1], busy = false, last;
    function round() {
      busy = false; st.kerri('think');
      const target = pickNew(WORDS_EN, last); last = target;
      const opts = shuffle([target, ...shuffle(WORDS_EN.filter(w => w.w[0] !== target.w[0])).slice(0, wins < 4 ? 1 : 2)]);
      st.hud(wins < 4 ? 1 : 2);
      st.arena.innerHTML = `<div class="big-letter">${target.w[0]}<small>${target.w[0].toUpperCase()}</small></div>
        <div class="pics">${opts.map(o => `<button class="pic-b" data-w="${o.w}" aria-label="${o.w}">${pic(o.pic)}<span>${o.w}</span></button>`).join('')}</div>
        <div class="row center"><button class="listen" data-hear>🔊 Hear again</button></div>`;
      const ask = () => talk([{ en: `Find the picture that starts with the letter ${target.w[0].toUpperCase()}.` }]);
      st.say(`Which picture starts with <b>${target.w[0]}</b>?`, [{ en: `Which picture starts with the letter ${target.w[0].toUpperCase()}?` }]);
      el.querySelector('[data-hear]').onclick = ask;
      el.querySelectorAll('.pic-b').forEach(b => b.onclick = async () => {
        if (busy) return;
        if (b.dataset.w !== target.w) { restart(b, 'wiggle'); SND.play('no'); talk([{ en: `That is ${b.dataset.w}. ${b.dataset.w} starts with ${b.dataset.w[0].toUpperCase()}.` }]); return; }
        busy = true; b.classList.add('right'); restart(b, 'hop'); SND.play('cheer'); st.kerri('happy'); burstAt(b); st.win(++wins);
        api.star(1, `⭐ ${target.w[0]} for ${target.w}!`); api.played(); api.bump('readers', 8, 'reader');
        await st.say(`Yes! <b>${target.w[0]}</b> is for <b>${target.w}</b>.`, [{ en: `Yes! ${target.w[0].toUpperCase()} is for ${target.w}.` }]);
        if (st.live()) round();
      });
    }
    round();
  },

  // ---------- 12. Mama's Firewood: make numbers with bundles of ten and single sticks ----------
  // CBE: Mathematical Activities, Grade 2-3, place value (tens and ones).
  firewood(el, api) {
    const st = stage(el, 'mama', 's-home', 'Yeyo (Mama)');
    let wins = [0, 3, 6][(api.tier || 1) - 1], busy = false;
    function round() {
      busy = false; st.kerri('think');
      const max = wins < 3 ? 29 : wins < 6 ? 59 : 99, n = rnd(11, max), T = Math.floor(n / 10), O = n % 10;
      let tens = 0, ones = 0;
      st.hud(max === 29 ? 1 : max === 59 ? 2 : 3);
      st.arena.innerHTML = `<div class="target-num">${n}</div>
        <div class="wood"><div class="wood-col"><b>Tens · Makumi</b><div class="bundles" data-tens></div></div><div class="wood-col"><b>Ones · Mamoja</b><div class="sticks" data-ones></div></div></div>
        <div class="row center"><button class="btn alt" data-add10>➕ Bundle of 10</button><button class="btn alt" data-add1>➕ 1 stick</button><button class="btn alt" data-clear>↩ Start again</button></div>
        <h3 class="center">You have: <span data-have>0</span></h3>
        <div class="row center"><button class="btn big" data-done>✅ Give Mama the firewood</button></div>`;
      st.say(`Mama needs <b>${n}</b> sticks for the fire. Use bundles of ten and single sticks.`, [{ en: `Mama needs ${n} sticks for the fire.` }, { sw: `Vijiti ${swNum(n)}.` }]);
      const B = el.querySelector('[data-tens]'), Os = el.querySelector('[data-ones]');
      const upd = () => { el.querySelector('[data-have]').textContent = `${tens} tens + ${ones} ones = ${tens * 10 + ones}`; };
      el.querySelector('[data-add10]').onclick = () => { if (busy || tens >= 9) return; tens++; B.insertAdjacentHTML('beforeend', `<span class="bundle drop-in">${BUNDLE}</span>`); SND.play('brick'); upd(); };
      el.querySelector('[data-add1]').onclick = () => { if (busy || ones >= 9) return; ones++; Os.insertAdjacentHTML('beforeend', `<span class="stick drop-in">${STICK}</span>`); SND.play('tap'); upd(); };
      el.querySelector('[data-clear]').onclick = () => { if (busy) return; tens = ones = 0; B.innerHTML = Os.innerHTML = ''; upd(); SND.play('whoosh'); };
      el.querySelector('[data-done]').onclick = async () => {
        if (busy) return;
        if (tens === T && ones === O) {
          busy = true; SND.play('cheer'); st.kerri('happy'); burstAt(el.querySelector('.wood')); st.win(++wins);
          el.querySelectorAll('.bundle, .stick').forEach((x, i) => { x.style.animationDelay = i * 40 + 'ms'; restart(x, 'hop'); });
          api.star(1, `⭐ ${T} tens and ${O} ones make ${n}!`); api.played(); api.bump('counters', 8, 'counter');
          await st.say(`<b>Sidai oleng!</b> ${T} tens and ${O} ones make <b>${n}</b>. ${swNum(n)}!`, [{ maa: 'good' }, { en: `${T} tens and ${O} ones make ${n}.` }, { sw: swNum(n) }]);
          if (st.live()) round();
        } else {
          SND.play('no'); restart(el.querySelector('[data-done]'), 'wiggle');
          const have = tens * 10 + ones;
          st.say(have < n ? `Not enough yet. ${n} is <b>${T}</b> tens and <b>${O}</b> ones.` : `Too many sticks! ${n} is <b>${T}</b> tens and <b>${O}</b> ones.`, [{ en: `${n} is ${T} tens and ${O} ones.` }]);
        }
      };
      upd();
    }
    round();
  },

  // ---------- 13. The Herd Comes and Goes: add and take away ----------
  // CBE: Mathematical Activities, Grade 1-2, addition and subtraction within 10, then 20.
  herd(el, api) {
    const st = stage(el, 'naserian', 's-dusk', 'Naserian');
    let wins = [0, 3, 5][(api.tier || 1) - 1], busy = false;
    const COWS = ['#8d5524', '#f2efe6', '#2b1d16', '#c1592c', '#9e9e9e'];
    async function round() {
      busy = true; st.kerri('think');
      const max = wins < 5 ? 10 : 20, add = Math.random() < .5;
      const a = add ? rnd(1, max - 2) : rnd(3, max), b = add ? rnd(1, Math.min(9, max - a)) : rnd(1, Math.min(9, a - 1)), ans = add ? a + b : a - b;
      st.hud(max === 10 ? 1 : 2);
      st.arena.innerHTML = `<div class="field"><div class="boma-fence"></div><div class="herd small-herd" data-h></div></div>
        <div class="sum-line" data-sum></div><div class="choices" data-c></div>`;
      const H = el.querySelector('[data-h]');
      const addCow = i => { H.insertAdjacentHTML('beforeend', `<span class="hc drop-in">${cowImg(COWS[i % COWS.length])}</span>`); };
      for (let i = 0; i < a; i++) addCow(i);
      st.say(`There are <b>${a}</b> cows in the boma.`, [{ en: `There are ${a} cows in the boma.` }, ...(a <= 10 ? [{ maa: 'n' + a }] : [])]);
      await wait(2200); if (!st.live()) return;
      if (add) {
        st.say(`<b>${b}</b> more cows come home!`, [{ en: `${b} more cows come home!` }]);
        for (let i = 0; i < b; i++) { if (!st.live()) return; H.insertAdjacentHTML('beforeend', `<span class="hc walk-in-h">${cowImg(COWS[(a + i) % COWS.length])}</span>`); SND.play('bell'); await wait(350); }
      } else {
        st.say(`<b>${b}</b> cows go to the river to drink.`, [{ en: `${b} cows go to the river to drink.` }]);
        const all = [...H.children];
        for (let i = 0; i < b; i++) { if (!st.live()) return; const c = all[all.length - 1 - i]; c.classList.add('walk-out-h'); SND.play('moo'); await wait(380); }
        await wait(500); all.slice(-b).forEach(c => c.remove());
      }
      if (!st.live()) return;
      el.querySelector('[data-sum]').innerHTML = `${a} ${add ? '+' : '−'} ${b} = <b>?</b>`;
      st.say('How many cows are in the boma now?', [{ en: 'How many cows are in the boma now?' }]);
      const opts = shuffle([ans, ...shuffle([ans - 2, ans - 1, ans + 1, ans + 2].filter(v => v >= 0 && v <= 20)).slice(0, 2)]);
      const C = el.querySelector('[data-c]');
      C.innerHTML = opts.map(o => `<button class="pop" data-n="${o}">${o}</button>`).join('');
      busy = false;
      C.querySelectorAll('button').forEach(btn => btn.onclick = async () => {
        if (busy) return;
        if (+btn.dataset.n !== ans) { restart(btn, 'wiggle'); SND.play('no'); talk([{ en: 'Count the cows again.' }]); return; }
        busy = true; el.querySelector('[data-sum]').innerHTML = `${a} ${add ? '+' : '−'} ${b} = <b>${ans}</b>`;
        SND.play('cheer'); st.kerri('happy'); burstAt(btn); st.win(++wins);
        api.star(1, `⭐ ${a} ${add ? '+' : '-'} ${b} = ${ans}`); api.played(); api.bump('counters', 8, 'counter');
        await st.say(`<b>Sidai oleng!</b> ${a} ${add ? 'plus' : 'take away'} ${b} is <b>${ans}</b>.`, [{ maa: 'good' }, { en: `${a} ${add ? 'plus' : 'take away'} ${b} is ${ans}.` }]);
        if (st.live()) round();
      });
    }
    round();
  },
};

// ---------- Art for the Mama games (same outlined explainer style) ----------
const HARVEST = {
  bean: { t: 'beans', svg: `<svg viewBox="-24 -16 48 32"><ellipse rx="18" ry="11" fill="#8d3b2a" stroke="${INK}" stroke-width="3"/><path d="M-7 -4 q7 5 14 0" stroke="#d08b72" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>` },
  maize: { t: 'maize', svg: `<svg viewBox="-20 -32 40 64"><path d="M2 26 q-22 -6 -16 -40" fill="#66bb6a" stroke="${INK}" stroke-width="2.5"/><ellipse rx="11" ry="25" fill="#FDD835" stroke="${INK}" stroke-width="3"/>${[-14, -6, 2, 10].map(y => `<path d="M-7 ${y} h14" stroke="#e0a800" stroke-width="2"/>`).join('')}</svg>` },
  stone: { t: 'stones', svg: `<svg viewBox="-22 -16 44 32"><path d="M-18 5 Q-19 -11 -2 -12 Q17 -13 18 2 Q17 12 0 12 Q-17 12 -18 5Z" fill="#9e9e9e" stroke="${INK}" stroke-width="3"/><path d="M-6 -4 l6 2" stroke="#bdbdbd" stroke-width="3" stroke-linecap="round"/></svg>` },
};
const basketSVG = k => `<svg viewBox="-55 -50 110 90" aria-hidden="true"><path d="M-48 -18 L48 -18 L37 32 L-37 32Z" fill="#c8a165" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  ${[-6, 6, 18].map(y => `<path d="M${-46 + (y + 18) * .2} ${y} H${46 - (y + 18) * .2}" stroke="#9c7a45" stroke-width="3"/>`).join('')}
  <ellipse cx="0" cy="-18" rx="48" ry="8" fill="#a8844f" stroke="${INK}" stroke-width="3"/><g transform="translate(0 6) scale(.9)">${HARVEST[k].svg.replace('<svg', '<svg x="-22" y="-18" width="44" height="36"')}</g></svg>`;
const drumSVG = k => `<svg viewBox="-60 -70 120 140" aria-hidden="true"><path d="M-44 -40 L-34 56 L34 56 L44 -40Z" fill="${k === 'L' ? '#8d4a26' : '#c62828'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M-40 -30 L-26 50 M-20 -30 L-10 50 M0 -30 L6 50 M20 -30 L20 50 M40 -30 L32 50" stroke="#f3e2c7" stroke-width="2.5" opacity=".8"/>
  <ellipse cx="0" cy="-40" rx="44" ry="12" fill="#f3e2c7" stroke="${INK}" stroke-width="3"/><ellipse cx="0" cy="56" rx="34" ry="8" fill="rgba(0,0,0,.18)"/></svg>`;


// ---------- Words and pictures for the CBE games (things a child in the Maasai Mara sees every day) ----------
// Kiswahili words split into syllables (silabi), as taught in Grade 1 Kiswahili.
const WORDS_SW = [
  { w: 'mama', s: ['ma', 'ma'], en: 'mother', pic: 'mama' }, { w: 'baba', s: ['ba', 'ba'], en: 'father', pic: 'baba' },
  { w: 'maji', s: ['ma', 'ji'], en: 'water', pic: 'water' }, { w: 'jua', s: ['ju', 'a'], en: 'sun', pic: 'sun' },
  { w: 'moto', s: ['mo', 'to'], en: 'fire', pic: 'fire' }, { w: 'shuka', s: ['shu', 'ka'], en: 'shuka cloth', pic: 'shuka' },
  { w: 'ngoma', s: ['ngo', 'ma'], en: 'drum', pic: 'drum' }, { w: 'mbuzi', s: ['mbu', 'zi'], en: 'goat', pic: 'goat' },
  { w: 'tofali', s: ['to', 'fa', 'li'], en: 'brick', pic: 'brick' }, { w: 'mahindi', s: ['ma', 'hi', 'ndi'], en: 'maize', pic: 'maize' },
  { w: 'shanga', s: ['sha', 'nga'], en: 'beads', pic: 'beads' }, { w: 'kikombe', s: ['ki', 'ko', 'mbe'], en: 'cup', pic: 'cup' },
];
// English words for letter sounds.
const WORDS_EN = [
  { w: 'cow', pic: 'cow' }, { w: 'goat', pic: 'goat' }, { w: 'hut', pic: 'hut' }, { w: 'tree', pic: 'tree' },
  { w: 'drum', pic: 'drum' }, { w: 'maize', pic: 'maize' }, { w: 'beads', pic: 'beads' }, { w: 'sun', pic: 'sun' },
  { w: 'water', pic: 'water' }, { w: 'fire', pic: 'fire' }, { w: 'cup', pic: 'cup' }, { w: 'lamb', pic: 'lamb' },
];
// Swahili number words up to 99, for read-aloud.
function swNum(n) {
  const one = ['', 'moja', 'mbili', 'tatu', 'nne', 'tano', 'sita', 'saba', 'nane', 'tisa'];
  const ten = ['', 'kumi', 'ishirini', 'thelathini', 'arobaini', 'hamsini', 'sitini', 'sabini', 'themanini', 'tisini'];
  const t = Math.floor(n / 10), o = n % 10;
  return t ? ten[t] + (o ? ' na ' + one[o] : '') : one[o];
}
const box = (vb, inner) => `<svg viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
function pic(name) {
  switch (name) {
    case 'cow': return cowImg('#8d5524');
    case 'goat': return box('-60 -70 130 80', `<ellipse cx="0" cy="0" rx="44" ry="6" fill="rgba(0,0,0,.14)"/>${[-26, -14, 14, 26].map(x => limb(`M${x} -24 V-4`, '#f2efe6', 6)).join('')}
      <ellipse cx="0" cy="-34" rx="36" ry="18" fill="#f2efe6" stroke="${INK}" stroke-width="3"/><ellipse cx="-8" cy="-38" rx="12" ry="8" fill="#5d4037"/>
      <path d="M28 -44 Q46 -58 54 -40 Q58 -28 46 -26 Q36 -30 28 -36Z" fill="#f2efe6" stroke="${INK}" stroke-width="3"/><path d="M50 -28 q2 10 -4 14" stroke="${INK}" stroke-width="3" fill="none"/>
      ${limb('M40 -52 Q34 -64 24 -64', '#bdb3a4', 3)}<circle cx="44" cy="-42" r="2.5" fill="${INK}"/><path d="M-36 -40 q-8 -8 -4 -16" stroke="${INK}" stroke-width="3" fill="none"/>`);
    case 'hut': return box('-80 -75 160 85', hut(0, 0, 1));
    case 'tree': return box('-105 -150 210 158', acacia(0, 0, 1));
    case 'drum': return drumSVG('L');
    case 'maize': return HARVEST.maize.svg;
    case 'beads': return box('-50 -30 100 60', `<path d="M-40 -18 Q0 40 40 -18" stroke="#6d4c41" stroke-width="2" fill="none"/>${Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (i + .5) / 7; return `<circle cx="${(-Math.cos(a) * 36).toFixed(1)}" cy="${(-14 + Math.sin(a) * 30).toFixed(1)}" r="7" fill="${['#E53935', '#fff', '#1E88E5', '#FDD835'][i % 4]}" stroke="${INK}" stroke-width="2"/>`; }).join('')}`);
    case 'sun': return box('-60 -60 120 120', `${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${Math.cos(a) * 34} ${Math.sin(a) * 34} L${Math.cos(a) * 50} ${Math.sin(a) * 50}" stroke="#f9a825" stroke-width="6" stroke-linecap="round"/>`; }).join('')}<circle r="28" fill="#ffd54f" stroke="${INK}" stroke-width="3"/><circle cx="-9" cy="-4" r="3" fill="${INK}"/><circle cx="9" cy="-4" r="3" fill="${INK}"/><path d="M-9 8 q9 7 18 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
    case 'water': return box('-40 -50 80 90', `<path d="M0 -44 Q30 -6 30 14 A30 30 0 0 1 -30 14 Q-30 -6 0 -44Z" fill="#4fc3f7" stroke="${INK}" stroke-width="3"/><path d="M-14 10 q0 12 10 16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`);
    case 'fire': return box('-40 -75 80 82', fire(0, 0));
    case 'cup': return box('-40 -45 80 80', `<path d="M-24 -30 L-20 26 L20 26 L24 -30Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-23 -16 L-21 24 L21 24 L23 -16Z" fill="#fffdf2"/><path d="M24 -18 q18 2 14 18 q-4 10 -16 8" stroke="${INK}" stroke-width="3" fill="none"/>`);
    case 'shuka': return box('-50 -40 100 80', `<rect x="-40" y="-32" width="80" height="64" rx="6" fill="#c62828" stroke="${INK}" stroke-width="3"/>${[-20, 0, 20].map(v => `<path d="M${v} -32 V32" stroke="rgba(0,0,0,.3)" stroke-width="6"/><path d="M-40 ${v} H40" stroke="rgba(0,0,0,.3)" stroke-width="6"/>`).join('')}`);
    case 'brick': return box('0 -8 92 40', brickSVG('r', 6, 6, 20));
    case 'lamb': return lambSVG();
    case 'mama': return AV('mama', 'mama', '#ffe9d6');
    case 'baba': return AV('man', 'baba', '#e3f2fd');
  }
  return '';
}
const STICK = `<svg viewBox="0 0 14 90" aria-hidden="true"><rect x="3" y="2" width="8" height="86" rx="4" fill="#8d6e63" stroke="${INK}" stroke-width="2"/></svg>`;
const BUNDLE = `<svg viewBox="0 0 70 90" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<rect x="${4 + i * 6}" y="${2 + (i % 3) * 2}" width="8" height="84" rx="4" fill="#8d6e63" stroke="${INK}" stroke-width="2"/>`).join('')}<rect x="0" y="40" width="70" height="10" rx="3" fill="#E53935" stroke="${INK}" stroke-width="2"/></svg>`;
