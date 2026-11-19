// Six animated games set in Sekenani life. Each mount(el, api) draws into el.
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
        REC.play('maa-' + p.maa).then(a => { if (a) { a.onended = done; a.onerror = done; } else speak(m.say, 'sw', done); });
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
    win(n) { const s = q('[data-stars]'); if (s) { s.textContent = '⭐'.repeat(Math.min(n, 10)); restart(s, 'pop'); } },
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
    let level = 1, target = [], mine = [], busy = true, wins = 0;
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
    let wins = 0, rounds = 0, busy = false;
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
    let wins = 0, busy = false, mode = 'pattern';
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
    const ALL = [...BRICKS.map(b => ({ ...b, maa: b.k === 'r' ? 'red' : null })), ...EXTRA];
    let lang = 'en', found = 0, busy = false, last;
    function round() {
      busy = false; st.kerri('think');
      const pool = lang === 'maa' ? ALL.filter(c => c.maa) : ALL.slice(0, 6);
      const n = lang === 'maa' ? 3 : found < 4 ? 3 : found < 8 ? 4 : 6;
      const target = pickNew(pool, last); last = target;
      const show = shuffle([target, ...shuffle(ALL.filter(c => c !== target)).slice(0, n - 1)]);
      const word = lang === 'en' ? target.name : lang === 'sw' ? target.sw : MAA[target.maa].w;
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
        await st.say(`<b>${target.name}</b> · ${target.sw}${target.maa ? ' · ' + MAA[target.maa].w : ''}. Asante!`, [{ sw: 'Asante sana!' }]);
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
    let wins = 0, busy = false, last;
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
    let level = 1, wins = 0, busy = false, prog = [], map;
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
    let level = 1, wins = 0, busy = true;
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
        level = Math.min(3, 1 + Math.floor(wins / 2));
        await st.say(`<b>Sidai oleng!</b> ${said}. Now count them again with Mama!`, [{ maa: 'good' }, { en: said + '. Now count them again with Mama!' }]);
        if (st.live()) { el.querySelector('[data-zone]').innerHTML = '<button class="btn big pop" data-more>More harvest →</button>'; el.querySelector('[data-more]').onclick = round; }
      }
    }
    round();
  },

  // ---------- 8. Milking Time: fill exactly the cups Mama asks for, then STOP ----------
  milk(el, api) {
    const st = stage(el, 'mama', 's-home', 'Yeyo (Mama)');
    let wins = 0, busy = false, rounds = 0;
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
    let len = 2, wins = 0, busy = true, seq = [], input = [];
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

