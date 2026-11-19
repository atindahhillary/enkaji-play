// Enkaji Play: router, progress and views. No build step; open index.html or deploy as static files.

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);

// ---------- Progress (stays in this browser only) ----------
const DEF = { name: 'Naserian', stars: 0, badges: [], days: [], played: {}, done: {}, count: {} };
let S;
try { S = { ...DEF, ...JSON.parse(localStorage.getItem('enkaji') || '{}') }; } catch { S = { ...DEF }; }
const save = () => { try { localStorage.setItem('enkaji', JSON.stringify(S)); } catch {} };

function streak() {
  let n = 0, d = new Date();
  while (S.days.includes(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function markDay() { if (!S.days.includes(today())) S.days.push(today()); if (streak() >= 3) badge('streak3'); }
function star(n = 1, msg) {
  S.stars += n; markDay(); badge('first'); save();
  toast(msg || `+${n} ⭐ Well done!`); confetti(); updateLamb(); SND.play('yes');
}
function badge(id) {
  if (S.badges.includes(id)) return;
  S.badges.push(id); save();
  const b = BADGES.find(x => x.id === id);
  setTimeout(() => toast(`🏅 New badge: ${b.t}!`), 1400);
}
function playedGame(id) { const d = today(); S.played[d] = [...new Set([...(S.played[d] || []), id])]; save(); }
function bump(key, need, badgeId) { S.count[key] = (S.count[key] || 0) + 1; if (S.count[key] >= need) badge(badgeId); save(); return S.count[key]; }

let tt;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2200); }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 24; i++) {
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = BRICKS[i % 6].hex; c.style.animationDelay = Math.random() * .4 + 's';
    document.body.appendChild(c); setTimeout(() => c.remove(), 2200);
  }
}

// ---------- Voice: reads text aloud so mothers of any literacy level can follow ----------
// How Maa words and names sound when an English voice reads them. Taken from the audio of
// Ole Koin's "Learn Maasai: greetings" (he says Maasai short, "Supa" like "super", "Iko" like "eh-ko").
// Spellings on screen stay correct; only the spoken text changes.
const PRON = [
  [/\bMaasai\b/g, 'Masai'], [/\bMaa\b/g, 'Mah'], [/\bSupa\b/g, 'Soopa'], [/\bEntasupai\b/g, 'Entasoopai'],
  [/\bTakwenya\b/g, 'Ta-kwenya'], [/\bIko\b/g, 'Eh-ko'], [/\bIpa\b/g, 'Ee-pa'], [/\bSidai oleng\b/gi, 'Sidai oh-leng'],
  [/\bNabo, are, uni\b/gi, 'Naabo, aareh, oonee'], [/\bAshe oleng\b/gi, 'Asheh oh-leng'], [/\bTadua\b/g, 'Tadoo-a'],
  [/\bNaserian\b/g, 'Nasseri-an'], [/\bLemayian\b/g, 'Lemai-yan'], [/\bSekenani\b/g, 'Seh-keh-nani'], [/\bTalek\b/g, 'Tah-lek'],
  [/\benkaji\b/gi, 'en-kahji'], [/\benkang\b/gi, 'en-kang'], [/\bshuka\b/gi, 'shooka'], [/\bboma\b/gi, 'bohma'], [/\bKerri\b/g, 'Kerry'],
  [/\bisaen\b/gi, 'ee-saen'], [/\benkare\b/gi, 'en-kahreh'], [/\binkishu\b/gi, 'in-keeshoo'],
];
function speak(text, lang = 'en', onend) {
  if (!('speechSynthesis' in window) || !SND.on) { onend && onend(); return; }
  window.speechSynthesis.cancel();
  if (lang === 'en') text = PRON.reduce((t, [re, say]) => t.replace(re, say), text);
  const u = new SpeechSynthesisUtterance(text);
  u.voice = VOICE.pick(lang); // Kenyan voice first (en-KE / sw-KE), then the nearest available
  u.lang = u.voice ? u.voice.lang : (lang === 'sw' ? 'sw-KE' : 'en-KE');
  u.rate = .88; u.pitch = 1.05;
  if (onend) { u.onend = onend; u.onerror = onend; }
  speechSynthesis.speak(u);
}
// Speak a Maa word: Mama's own recording if there is one, otherwise the Swahili voice.
function sayMaa(k) { REC.play('maa-' + k).then(a => { if (!a && MAA[k]) speak(MAA[k].say, 'sw'); }); }
document.addEventListener('click', e => { const b = e.target.closest('[data-maa]'); if (b) sayMaa(b.dataset.maa); });
const listenBtn = (text, lang = 'en', label = '🔊 Listen') => `<button class="listen" data-say="${esc(text)}" data-lang="${lang}">${label}</button>`;
document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) speak(b.dataset.say, b.dataset.lang); });

// ---------- Shared bits ----------
// Each game wears one brick colour. c = button colour dark enough for white text (AA).
const GAMES = [
  { id: 'copy', t: 'Copy the Model', k: 'sky', c: '#01579B', d: 'Look, remember, build' },
  { id: 'cattle', t: 'Count the Cattle', k: 'o', c: '#B34700', d: 'Count in Maa, Swahili, English' },
  { id: 'beads', t: 'Bead Patterns', k: 'r', c: '#B71C1C', d: 'What comes next?' },
  { id: 'colour', t: 'Colour Hunt', k: 'y', c: '#6B5200', d: 'Find the colour' },
  { id: 'market', t: "Ruth's Market", k: 'b', c: '#0D47A1', d: 'Pay with shillings' },
  { id: 'code', t: 'Code the Cow', k: 'g', c: '#1B5E20', d: 'Arrow cards, find the water' },
  // Mama and child games, shown on the Mama page
  { id: 'harvest', t: 'Sort the Harvest', k: 'g', c: '#1B5E20', d: 'Beans, maize, stones', mama: true },
  { id: 'milk', t: 'Milking Time', k: 'sky', c: '#01579B', d: 'Fill the cups, then stop', mama: true },
  { id: 'drum', t: 'Drum Echo', k: 'r', c: '#B71C1C', d: 'Listen and play it back', mama: true },
];
const tile = g => `<a class="tile" href="#/game/${g.id}"><div class="art" style="background:var(--${g.k})">${TILE_ART[g.id]()}</div><div class="tb"><h3>${g.t}</h3><span class="play" style="background:${g.c}">Play</span></div></a>`;
const dot = k => `<span class="dot" style="--c:var(--${k})" aria-hidden="true"></span>`;
const pill = (c, text) => `<span class="pill tint" style="--pc:${c};background:${c}26">${text}</span>`;
const actCard = a => `<a class="card act" href="#/activity/${a.id}">${S.done[a.id] ? '<span class="done" title="Done">✅</span>' : ''}${buildSVG(a.demo, { u: 14 })}
  <div class="row">${pill(DOMAINS[a.dom].c, DOMAINS[a.dom].icon + ' ' + DOMAINS[a.dom].t)}<span class="pill">${a.mins} min</span></div>
  <h3>${a.t}</h3><p class="small mute" style="margin:0">${AGES[a.age]}</p></a>`;
const storyCover = s => `<img src="assets/cover-${s.id}.webp" alt="" decoding="async">`;
function updateLamb() { $('#sideLamb').innerHTML = lambSVG('bounce'); }

// ---------- Views ----------
const V = {};

V.home = () => {
  const d = today(), pick = ACTIVITIES[new Date().getDate() % ACTIVITIES.length];
  // Goal: one screen game AND one real brick activity a day (screens are a treat, bricks are the teacher).
  const g1 = (S.played[d] || []).length > 0, g2 = (S.doneOn || {})[d] > 0, gn = g1 + g2;
  const role = (r, href, av, t, say) => `<a class="card role ${S.role === r ? 'on' : ''}" href="${href}" data-role="${r}">${av}<b>${t}</b>${listenBtn(say, 'en', '🔊')}</a>`;
  return `
  <section class="who"><h2>Who is using the phone?</h2>
    <div class="roles">
      ${role('child', '#/games', AV('girl', 'A child', '#e1f5fe'), 'A child', 'A child wants to play. Go to the games.')}
      ${role('mama', '#/mothers', AV('mama', 'Mama', '#ffe9d6'), 'Mama', 'Mama. Picture and voice guides for teaching at home.')}
      ${role('leader', '#/training', AV('man', 'Facilitator', '#e3f2fd'), 'Facilitator', 'Facilitator training sessions.')}
    </div></section>
  <section class="hello"><div style="flex:1"><div class="tag">Supa! Takwenya!</div>
    <div class="name">Let's play and learn</div>
    <div style="font-weight:600">Six bricks. Endless ideas. Learning at home in Sekenani.</div></div>
    ${AV('girl', 'Naserian', '#fff3e0')}<div class="hero-band"></div></section>
  <div class="stats">
    <a class="card stat" href="#/progress" style="--c:var(--y)"><span class="ic">⭐</span><div><span>Stars</span><b>${S.stars}</b></div></a>
    <a class="card stat" href="#/progress" style="--c:var(--o)"><span class="ic">🔥</span><div><span>Day Streak</span><b>${streak()}</b></div></a>
    <a class="card stat" href="#/progress" style="--c:var(--r)"><span class="ic">🛡️</span><div><span>Badges</span><b>${S.badges.length}</b></div></a>
  </div>
  <div class="sec"><h2>${dot('o')}Games</h2><a href="#/games">View all →</a></div>
  <div class="grid g5">${GAMES.filter(g => !g.mama).map(tile).join('')}</div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card goal"><h3>Today's Goal</h3><div class="row" style="justify-content:space-between"><span>${g1 ? '✅' : '⬜'} 1 game &nbsp; ${g2 ? '✅' : '⬜'} 1 brick challenge</span><b style="color:var(--brand)">${gn} / 2</b></div><div class="bar"><i style="width:${gn * 50}%"></i></div></div>
    <div class="card keep">${lambSVG()}<div><h3>Keep Going!</h3><p style="margin:0">${gn >= 2 ? 'Goal done! Kerri the Maasai sheep is proud of you!' : 'Play one game, then play with real bricks. Kerri is cheering!'}</p></div></div>
  </div>
  <div class="sec"><h2>${dot('g')}Today's Brick Challenge</h2></div>
  <a class="card act" href="#/activity/${pick.id}" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:16px;align-items:center">${buildSVG(pick.demo, { u: 16, anim: true })}<div><span class="pill">${DOMAINS[pick.dom].icon} ${DOMAINS[pick.dom].t}</span><h2 style="margin-top:8px">${pick.t}</h2><p class="mute">${pick.steps[0]}</p><span class="btn">Let's play →</span></div></a>
  <div class="sec"><h2>${dot('b')}More to explore</h2></div>
  <div class="grid g2">
    <a class="card entry" href="#/stories"><span class="em">📖</span><div><h3>Mara Stories</h3><p class="mute small" style="margin:0">Animated, read-aloud stories with a brick challenge.</p></div></a>
    <a class="card entry" href="#/activities"><span class="em">🧱</span><div><h3>Brick Play</h3><p class="mute small" style="margin:0">${ACTIVITIES.length} activities for home and school.</p></div></a>
    <a class="card entry" href="#/bricks"><span class="em">🌈</span><div><h3>What is Six Bricks?</h3><p class="mute small" style="margin:0">The six colours, the rules and the Home Play Circle.</p></div></a>
    <a class="card entry" href="#/team"><span class="em">🤝</span><div><h3>Meet the Team</h3><p class="mute small" style="margin:0">Our six facilitators and their strands.</p></div></a>
  </div>`;
};
V.home.after = () => document.querySelectorAll('[data-role]').forEach(a => a.addEventListener('click', e => { if (e.target.closest('[data-say]')) { e.preventDefault(); return; } S.role = a.dataset.role; save(); }));

V.bricks = () => `
  <h1>What is Six Bricks?</h1>
  <p class="mute" style="max-width:720px">Six Bricks is a set of six different coloured DUPLO bricks, a LEGO Foundation tool developed by Hands on Technologies and spread across Africa by <a href="https://www.carefored.co.za/" target="_blank" rel="noopener">Care for Education</a>. Their big idea: children learn through <b>construction, not instruction</b>. A few minutes a day builds memory, movement, language, numbers and self-control.</p>
  <div class="sec"><h2>The six colours</h2><span class="mute small">Tap to hear</span></div>
  <div class="bricks6">${BRICKS.map(b => `<button class="bk ${b.k}" style="background:${b.hex}" data-say="${b.name}. ${b.sw}" data-lang="en">${b.name}<small>${b.sw}</small><small>${b.idea}</small></button>`).join('')}</div>
  <div class="sec"><h2>The Home Play Circle</h2></div>
  <div class="grid g3">
    <div class="card"><h3>1. Greet 👋 <span class="mute small">1 min</span></h3><p>Say "Takwenya!" or "Supa!". Hold the six bricks. Name the colours together.</p></div>
    <div class="card"><h3>2. Play 🧱 <span class="mute small">5 min</span></h3><p>One brick challenge. Let the child lead. Mistakes are part of play.</p></div>
    <div class="card"><h3>3. Talk 💬 <span class="mute small">2 min</span></h3><p>Ask "Tell me what you built". Praise the trying, not only the answer.</p></div>
  </div>
  <div class="sec"><h2>Five qualities of playful learning</h2></div>
  <div class="grid g5">${[['😄', 'Joyful'], ['🌍', 'Meaningful'], ['✋', 'Hands-on'], ['🔁', 'Try again'], ['🤝', 'Together']].map(([i, t]) => `<div class="card badge"><div class="i">${i}</div><b>${t}</b></div>`).join('')}</div>
  <div class="sec"><h2>No bricks? Use the home</h2></div>
  <div class="card"><div class="grid g3">${[['🪨', 'Stones', 'Paint or sort by size'], ['🍾', 'Bottle tops', 'Counting and money'], ['📿', 'Beads', 'Patterns and colours'], ['🌽', 'Maize & beans', 'Sorting and adding'], ['🪵', 'Sticks', 'Letters, bomas, measuring'], ['🏖️', 'Sand tray', 'Writing letters and numbers']].map(([i, t, d]) => `<div class="row"><span style="font-size:2rem">${i}</span><div><b>${t}</b><div class="small mute">${d}</div></div></div>`).join('')}</div></div>
  <div class="sec"><h2>Look after the bricks</h2></div>
  <div class="card"><p>Each child keeps their own six bricks in a small beaded pouch or kiondo. Counting the bricks back into the pouch at the end is already a numbers lesson. Wash the bricks in soapy water once a week.</p></div>`;

V.activities = () => {
  const f = V.activities.f;
  const list = ACTIVITIES.filter(a => (f.age === 'all' || a.age === f.age || a.age === 'both') && (f.dom === 'all' || a.dom === f.dom));
  const chip = (k, v, label) => `<button class="chip ${f[k] === v ? 'on' : ''}" data-f="${k}" data-v="${v}">${label}</button>`;
  return `<h1>Brick Play</h1><p class="mute">${ACTIVITIES.length} activities for home and school. Each one has a picture demo and can be read aloud.</p>
  <div class="chips">${chip('age', 'all', 'All ages')}${chip('age', 'little', '👶🏾 Little Ones 3-5')}${chip('age', 'starter', '🎒 School Starters 6-8')}</div>
  <div class="chips">${chip('dom', 'all', 'All skills')}${Object.entries(DOMAINS).map(([k, d]) => chip('dom', k, d.icon + ' ' + d.t)).join('')}</div>
  <div class="grid g3">${list.map(actCard).join('') || `<div class="card center empty">${lambSVG()}<h3>Nothing here yet</h3><p class="mute">Try another age or skill.</p></div>`}</div>`;
};
V.activities.f = { age: 'all', dom: 'all' };
V.activities.after = () => document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { V.activities.f[b.dataset.f] = b.dataset.v; render(); });

V.activity = id => {
  const a = ACT[id]; if (!a) return V.notfound();
  const d = DOMAINS[a.dom], all = [a.t, ...a.steps.map((s, i) => `Step ${i + 1}. ${s}`)].join(' ');
  const team = a.by && TEAM.find(t => t.k === a.by);
  return `<a href="#/activities" class="mute no-print">← All brick play</a>
  <div class="row" style="justify-content:space-between;margin:10px 0"><h1 style="margin:0">${a.t}</h1>${listenBtn(all, 'en', '🔊 Listen to all steps')}</div>
  <div class="row" style="margin-bottom:14px">${pill(d.c, d.icon + ' ' + d.t)}<span class="pill">${AGES[a.age]}</span><span class="pill">⏱ ${a.mins} min</span>${team ? `<span class="pill">Led by: ${team.name || team.role}</span>` : ''}</div>
  <div class="grid g2">
    <div class="card demo"><h3>Watch the demo</h3><div id="demo">${buildSVG(a.demo, { u: 22, anim: true })}</div><button class="btn alt" id="replay">▶ Play again</button></div>
    <div class="card"><h3>You need</h3><p>🧱 ${a.mat}</p><h3>No bricks?</h3><p>🏡 ${a.local}</p>${a.maa ? `<h3>Tip</h3><p>💡 ${a.maa}</p>` : ''}</div>
  </div>
  <div class="sec"><h2>Steps</h2></div>
  <ol class="steps">${a.steps.map((s, i) => `<li style="--sc:${BRICKS[i % 6].hex}"><span>${s}</span>${listenBtn(s)}</li>`).join('')}</ol>
  <div class="sec"><h2>Talk together</h2></div>
  <div class="card">${a.ask.map(q => `<div class="phrase"><b>💬 ${q}</b>${listenBtn(q)}</div>`).join('')}</div>
  <div class="row center no-print" style="margin:24px 0"><button class="btn alt" onclick="print()">🖨️ Print this card</button><button class="btn big" id="didIt">${S.done[id] ? '✅ Done! Play it again for a star' : '🎉 We did it!'}</button></div>`;
};
V.activity.after = id => {
  $('#replay').onclick = () => { $('#demo').innerHTML = buildSVG(ACT[id].demo, { u: 22, anim: true }); };
  $('#didIt').onclick = () => { S.done[id] = (S.done[id] || 0) + 1; S.doneOn = S.doneOn || {}; S.doneOn[today()] = (S.doneOn[today()] || 0) + 1; save(); star(1, '⭐ Great playing together!'); if (Object.keys(S.done).length >= 5) badge('mama'); render(); };
};

V.games = () => `<h1>Games</h1><p class="mute">Short games for children 3-8. Every win earns a star. Sound on for voices!</p><div class="grid g5">${GAMES.filter(g => !g.mama).map(tile).join('')}</div>
  <div class="sec"><h2>🤱🏾 Play with Mama</h2></div><div class="grid g5">${GAMES.filter(g => g.mama).map(tile).join('')}</div>
  <div class="card" style="margin-top:18px"><h3>For grown-ups</h3><p class="mute" style="margin:0">Screens are a treat, not the teacher. After each game, play the same idea with real bricks, stones or beads.</p></div>`;
V.game = id => {
  const g = GAMES.find(x => x.id === id); if (!g) return V.notfound();
  return `<a href="#/games" class="mute">← All games</a><h1 style="margin-top:10px">${g.t}</h1><div class="card gamebox" id="game"></div>`;
};
V.game.after = id => GAME_MOUNT[id]($('#game'), { star, badge, bump, speak, played: () => playedGame(id) });

V.stories = () => `<h1>Mara Stories</h1><p class="mute">Animated stories that read themselves aloud in English, with Swahili lines. Each ends with a brick challenge.</p>
  <div class="grid g3">${STORIES.map(s => `<a class="tile" href="#/story/${s.id}"><div class="cover" aria-hidden="true">${storyCover(s)}</div><div class="tb"><h3>${s.t}</h3><span class="play" style="background:${s.cover}">▶ Watch</span></div></a>`).join('')}</div>`;
// Explainer-style story player: the scene builds up piece by piece, the narrator reads,
// a subtitle bar shows the words (like the reference video), soft music plays underneath.
V.story = id => {
  const s = STORIES.find(x => x.id === id); if (!s) return V.notfound();
  return `<a href="#/stories" class="mute">← All stories</a><h1 style="margin-top:10px">${s.t}</h1>
  <div class="story-stage" id="stage"><div class="sbox" id="sbox"></div><div class="subs" id="subs" aria-hidden="true"></div><div class="cap" id="cap" aria-live="polite"></div></div>
  <div class="ctl"><button class="btn alt" id="prev" aria-label="Previous page">◀</button><button class="btn" id="playS">▶ Play story</button><button class="btn alt" id="next" aria-label="Next page">▶</button><button class="listen" id="sayW">🔊 Swahili</button><button class="listen" id="musicB" aria-pressed="true">🎵 Music</button></div>
  <div class="ctl"><div class="dots" id="dots"></div></div>`;
};
V.story.after = id => {
  const s = STORIES.find(x => x.id === id); let i = 0, auto = false, music = true;
  const show = () => {
    const p = s.pages[i], box = $('#sbox'), cap = $('#cap'), subs = $('#subs'); if (!box) return;
    box.style.display = subs.style.display = i === s.pages.length ? 'none' : '';
    if (i === s.pages.length) {
      cap.innerHTML = `<div style="text-align:center"><div style="font-size:3rem">🧱</div><h2>Brick challenge!</h2><p>Now build the story with your bricks.</p><a class="btn" href="#/activity/${s.act}">${ACT[s.act].t} →</a></div>`;
      if (!S.count['story-' + id]) { S.count['story-' + id] = 1; badge('story'); star(2, '⭐⭐ You finished the story!'); }
      auto = false; $('#playS').textContent = '↺ Again'; SND.music(false);
    } else {
      box.innerHTML = p.s(); box.setAttribute('role', 'img'); box.setAttribute('aria-label', p.en);
      subs.textContent = p.en; subs.classList.remove('on'); void subs.offsetWidth; subs.classList.add('on');
      cap.innerHTML = `<p class="sw">${p.sw}</p>`;
    }
    $('#dots').innerHTML = s.pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
  };
  const go = d => { i = Math.max(0, Math.min(s.pages.length, i + d)); show(); };
  // Let the scene draw itself in, then narrate, hold a beat, turn the page.
  const step = () => { if (!auto || i >= s.pages.length) return; const page = i; setTimeout(() => { if (!auto || page !== i) return; speak(s.pages[i].en, 'en', () => setTimeout(() => { if (auto && page === i) { go(1); step(); } }, 1200)); }, 1300); };
  const stop = () => { auto = false; window.speechSynthesis?.cancel(); SND.music(false); $('#playS').textContent = '▶ Play story'; };
  $('#prev').onclick = () => { stop(); go(-1); };
  $('#next').onclick = () => { stop(); go(1); };
  $('#musicB').onclick = e => { music = !music; e.currentTarget.setAttribute('aria-pressed', music); e.currentTarget.textContent = music ? '🎵 Music' : '🔇 Music'; SND.music(music && auto); };
  $('#playS').onclick = () => { if (auto) return stop(); if (i >= s.pages.length) i = 0; auto = true; $('#playS').textContent = '⏸ Pause'; SND.music(music); show(); step(); };
  $('#sayW').onclick = () => { const p = s.pages[i]; if (p) speak(p.sw, 'sw'); };
  show();
};

V.mothers = () => {
  const t = V.mothers.track, list = ACTIVITIES.filter(a => a.age === t || a.age === 'both').slice(0, 9);
  return `<section class="mama-hero">${AV('mama', 'Mama', '#ffd8b0')}
    <div><div style="font-weight:800;letter-spacing:.06em">TAKWENYA, MAMA! · IKO!</div><h1>Mothers Who Teach</h1>
    <p style="font-size:1.1rem;max-width:560px">You are your child's first and best teacher. You already teach beadwork, songs, cooking and respect. Six bricks add a little play to the day you already have.</p>
    ${listenBtn('Takwenya Mama! You are your child\'s first and best teacher. You do not need to read to teach. Look at the pictures, press the listen button, and play together for five minutes every day.', 'en', '🔊 Listen, Mama')} ${listenBtn('Habari Mama! Wewe ni mwalimu wa kwanza wa mtoto wako. Huhitaji kusoma ili kufundisha. Angalia picha, bonyeza kitufe cha kusikiliza, na mcheze pamoja dakika tano kila siku.', 'sw', '🔊 Sikiliza kwa Kiswahili')}</div></section>
  <div class="sec"><h2>How to use this</h2></div>
  <div class="how4"><div><span>👀</span>Look at the picture</div><div><span>🔊</span>Press Listen</div><div><span>🧱</span>Play 5 minutes</div><div><span>🤗</span>Praise the trying</div></div>
  <div class="sec"><h2>🤱🏾 Play together on the phone</h2>${listenBtn('Play together on the phone. Sit with your child. Sort the harvest, milk the cow, and play the drum. Then play the same game with real beans, cups and a tin drum.', 'en', '🔊')}</div>
  <p class="mute" style="margin-top:-6px">Sit with your child. Every game speaks, so no reading is needed. Then play the same game with real beans, cups and a tin drum.</p>
  <div class="grid g5">${GAMES.filter(g => g.mama).map(tile).join('')}</div>
  <div class="sec"><h2>Play while you work</h2></div>
  <div class="grid g3">${MOMENTS.map(m => `<div class="card"><div class="row" style="justify-content:space-between"><span style="font-size:2.2rem">${m.icon}</span>${listenBtn(m.t + '. ' + m.p)}</div><h3>${m.t}</h3><p class="mute" style="margin:0">${m.p}</p></div>`).join('')}</div>
  <div class="sec"><h2>Choose your child</h2>${listenBtn('Choose your child. Little One is three to five years. School Starter is six to eight years.', 'en', '🔊')}</div>
  <div class="chips"><button class="chip big-chip ${t === 'little' ? 'on' : ''}" data-t="little">👶🏾 Little One, 3-5 years (PP1-PP2)</button><button class="chip big-chip ${t === 'starter' ? 'on' : ''}" data-t="starter">🎒 School Starter, 6-8 years (Grade 1-3)</button></div>
  <div class="grid g3">${list.map(actCard).join('')}</div>
  <div class="sec"><h2>Count in three languages</h2></div>
  <div class="card"><div class="grid g5">${NUMBERS.map(n => `<button class="chip" style="padding:12px" data-maa="n${n.n}"><b style="font-size:1.4rem">${n.n}</b><br>${n.maa}<br><span class="mute small">${n.sw} · ${n.en}</span></button>`).join('')}</div><p class="small mute" style="margin:10px 0 0">Maa spellings vary. Ask the mothers to teach the facilitator the right sounds.</p></div>
  <div class="sec" id="maa-words"><h2>🎙️ Mama's Voice: Maa words</h2><span class="pill">Used in the games</span></div>
  <div class="card"><p>No phone can speak Maa yet, so the games use a Swahili voice for Maa words. <b>Mama, record each word in your own voice</b> and the games will play YOUR voice to the children. Recordings stay on this phone.</p>
    <p class="small mute">✅ checked in Maa sources · ❔ please check with the mothers in Sekenani. Spellings vary (Purko, Keekonyokie).</p>
    <div class="grid g3" data-words>${Object.entries(MAA).map(([k, m]) => `<div class="word-row"><div><b>${m.w}</b> ${m.c === 'H' ? '✅' : '❔'}<div class="small mute">${m.en} · ${m.sw}</div></div><div class="row" style="gap:6px"><button class="listen" data-maa="${k}" aria-label="Play ${m.w}">🔊</button><button class="listen rec ${REC.has('maa-' + k) ? 'has' : ''}" data-rec="${k}" aria-label="Record ${m.w}">🎙️</button></div></div>`).join('')}</div></div>
  <div class="card" style="margin-top:12px"><h3>🇰🇪 Kenyan accent</h3><p class="small" style="margin:0" data-voice></p></div>
  <div class="sec"><h2>How we greet in Maa</h2>${listenBtn(GREET_WAYS.map(g => g.t + '. ' + g.p).join(' '), 'en', '🔊')}</div>
  <div class="grid g2">${GREET_WAYS.map(g => `<div class="card"><div class="row" style="justify-content:space-between"><span style="font-size:2rem">${g.icon}</span>${listenBtn(g.t + '. ' + g.p)}</div><h3>${g.t}</h3><p class="mute" style="margin:0">${g.p}</p></div>`).join('')}</div>
  <div class="sec"><h2>Words that help children grow</h2></div>
  <div class="card">${PHRASES.map(p => `<div class="phrase"><div>${p.maa ? `<b>${p.maa}</b> · ` : ''}<b>${p.sw}</b><div class="small mute">${p.en}${p.note ? ' · ' + p.note : ''}</div></div>${listenBtn(p.sw, 'sw')}</div>`).join('')}</div>`;
};
V.mothers.track = 'little';
V.mothers.after = () => {
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { V.mothers.track = b.dataset.t; render(); });
  const voiceNote = () => {
    const l = VOICE.label(), ke = VOICE.kenyan('en') || VOICE.kenyan('sw'), v = $('[data-voice]'); if (!v) return;
    v.innerHTML = `This phone speaks English with <b>${esc(l.en)}</b> and Swahili with <b>${esc(l.sw)}</b>. ` +
      (ke ? '🎉 A Kenyan voice was found! English is read in an East African accent.' : 'No Kenyan voice on this phone yet. For a Kenyan accent, open the site in <b>Microsoft Edge</b> (it has Kenyan English and Swahili voices), or add <b>Swahili</b> in your phone\'s Text-to-speech settings.');
  };
  voiceNote(); setTimeout(voiceNote, 800);
  document.querySelectorAll('[data-rec]').forEach(b => b.onclick = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast('This phone cannot record. Try Chrome.');
    const k = b.dataset.rec;
    b.textContent = '⏺️'; b.classList.add('recording'); toast(`Say "${MAA[k].w}" now...`);
    try {
      await REC.record('maa-' + k, 2500);
      b.textContent = '🎙️'; b.classList.remove('recording'); b.classList.add('has');
      toast(`✅ Saved! Ashe oleng, Mama.`); sayMaa(k);
      if (Object.keys(MAA).filter(x => REC.has('maa-' + x)).length >= 3) badge('voice');
    } catch { b.textContent = '🎙️'; b.classList.remove('recording'); toast('Microphone not allowed. Allow it in the browser to record.'); }
  });
};

const RUN = [
  ['Day 1', [['8:30', 'Welcome song, Copy the Model warm-up'], ['9:00', 'Session 1: Why Play?'], ['11:00', 'Session 2: Meet the Six Bricks'], ['14:00', 'Warm-up relay in pairs'], ['15:30', 'Reflect and share']]],
  ['Day 2', [['8:30', 'Tricky Tower warm-up'], ['9:00', 'Session 3: Numbers & Words'], ['11:00', 'Session 4: Body, Mind & Heart'], ['14:00', 'Design a number game'], ['15:30', 'Feelings circle']]],
  ['Day 3', [['8:30', 'Cross the Talek River warm-up'], ['9:00', 'Session 5: Mothers Who Teach'], ['11:00', 'Session 6: Your Expertise, Their Play'], ['14:00', "Home visit practice and a Mama's Circle"], ['15:30', 'Plan your first month']]],
];
V.training = () => `<h1>Training for Facilitators</h1>
  <p class="mute" style="max-width:720px">Six sessions, one for each brick colour, over three days. Each session ends with practice, a reflection and a short quiz that earns a badge.</p>
  <div class="grid g3">${RUN.map(([d, rows]) => `<div class="card run"><h3>${d}</h3>${rows.map(([t, x]) => `<div class="run-row"><b>${t}</b><span>${x}</span></div>`).join('')}</div>`).join('')}</div>
  <div class="row" style="margin:14px 0"><a class="btn" href="#/cards">🖨️ Printable activity cards</a><a class="btn alt" href="#/team">🤝 Meet the team</a></div>
  <div class="sec"><h2>The six sessions</h2></div>
  <div class="grid g3">${MODULES.map(m => `<a class="card mod" href="#/module/${m.id}" style="--mc:${BRICK[m.c].hex}"><div class="row" style="justify-content:space-between">${pill(BRICK[m.c].hex, 'Session ' + m.id + ' · ' + BRICK[m.c].name)}${S.badges.includes('mod' + m.id) ? '🎓' : ''}</div><h3 style="margin-top:10px">${m.t}</h3><p class="mute small" style="margin:0">${m.sub}</p></a>`).join('')}</div>
` + `  <div class="sec"><h2>The Mama's Circle</h2><span class="pill">Monthly, under a tree</span></div>
  <div class="grid g3">
    <div class="card"><h3>🎶 Open with a song</h3><p>A song everyone knows. Mothers lead it. Then each mother shows how many bricks her child can name.</p></div>
    <div class="card"><h3>🌟 Share one success</h3><p>"My son counted the goats in Maa." Clap for every story. Mothers learn most from each other.</p></div>
    <div class="card"><h3>🧱 Learn one new game</h3><p>The facilitator shows one activity. Mothers play it in pairs, one as "child", one as "Mama".</p></div>
    <div class="card"><h3>🗓️ Plan the month</h3><p>Pick two games for the month. Choose a buddy mother to visit and play with.</p></div>
  </div>
  <div class="sec"><h2>Your facilitator badges</h2></div>
  <div class="grid g5">${BADGES.filter(b => b.fac).map(b => `<div class="card badge ${S.badges.includes(b.id) ? '' : 'lock'}"><div class="i">${b.icon}</div><b class="small">${b.t}</b></div>`).join('')}</div>`;
V.cards = () => `<div class="no-print"><a href="#/training" class="mute">← Training</a><h1 style="margin-top:10px">Printable activity cards</h1><p class="mute">One card per activity: picture, steps and what you need. Print and leave them with mothers.</p><button class="btn" onclick="print()">🖨️ Print all cards</button></div>
  <div class="print-cards">${ACTIVITIES.map(a => `<div class="pcard-print card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${a.t}</h3>${pill(DOMAINS[a.dom].c, DOMAINS[a.dom].icon + ' ' + DOMAINS[a.dom].t)}</div>${buildSVG(a.demo, { u: 12 })}<ol>${a.steps.map(s => `<li>${s}</li>`).join('')}</ol><p class="small"><b>You need:</b> ${a.mat}. <b>No bricks?</b> ${a.local}</p></div>`).join('')}</div>`;
V.module = id => {
  const m = MODULES.find(x => x.id == id); if (!m) return V.notfound();
  const hex = BRICK[m.c].hex;
  return `<a href="#/training" class="mute">← All sessions</a>
  <div class="card" style="border-top:10px solid ${hex};margin-top:10px">${pill(hex, 'Session ' + m.id + ' · ' + BRICK[m.c].name + ' brick')}<h1 style="margin-top:10px">${m.t}</h1><p class="mute">${m.sub}</p>
    <h3>By the end you can</h3><ul>${m.goals.map(g => `<li>${g}</li>`).join('')}</ul></div>
  <div class="sec"><h2>Key ideas</h2></div>
  <div class="grid g2">${m.ideas.map(x => `<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${x.h}</h3>${listenBtn(x.h + '. ' + x.p)}</div><p style="margin-top:8px">${x.p}</p></div>`).join('')}</div>
  <div class="sec"><h2>Practice: ${m.practice.h}</h2></div>
  <ol class="steps">${m.practice.steps.map((s, i) => `<li style="--sc:${hex}"><span>${s}</span></li>`).join('')}</ol>
  <div class="card" style="margin-top:16px;background:#fffaf0"><h3>🤔 Reflect</h3><p style="margin:0">${m.reflect}</p></div>
  <div class="sec"><h2>Quick quiz</h2><span class="mute small" id="qs"></span></div>
  <div class="grid g3 quiz">${m.quiz.map((q, qi) => `<div class="card"><b>${qi + 1}. ${q.q}</b>${q.o.map((o, oi) => `<button data-q="${qi}" data-o="${oi}">${o}</button>`).join('')}</div>`).join('')}</div>
  <div class="row" style="justify-content:space-between;margin-top:20px">${m.id > 1 ? `<a class="btn alt" href="#/module/${m.id - 1}">← Session ${m.id - 1}</a>` : '<span></span>'}${m.id < 6 ? `<a class="btn" href="#/module/${m.id + 1}">Session ${m.id + 1} →</a>` : '<a class="btn" href="#/team">Meet the team →</a>'}</div>`;
};
V.module.after = id => {
  const m = MODULES.find(x => x.id == id), right = new Set();
  document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    const q = +b.dataset.q, ok = +b.dataset.o === m.quiz[q].a;
    b.classList.add(ok ? 'ok' : 'no');
    if (ok) { right.add(q); b.parentElement.querySelectorAll('button').forEach(x => x.disabled = true); }
    $('#qs').textContent = `${right.size} / ${m.quiz.length} correct`;
    if (right.size === m.quiz.length && !S.badges.includes('mod' + m.id)) { badge('mod' + m.id); star(3, '🎓 Session complete! +3 ⭐'); }
  });
};

V.team = () => `<h1>The Facilitator Team</h1><p class="mute" style="max-width:720px">Each facilitator brings a strand from their own work. Together they cover the whole child: soil, digital, health, dreams, food and money.</p>
  <div class="grid g2 team">${TEAM.map(t => `<div class="card"><div class="row">${AV(t.k === 'biz' ? 'ruth' : t.k, t.role, t.av.wrap + '33')}<div><h2 style="margin:0">${t.name ? t.name + ', ' : ''}${t.role}</h2><span class="pill">${t.strand}</span></div></div>
    <p style="margin-top:12px">${t.blurb}</p><b class="small">Signature activities</b><div class="row" style="margin-top:6px">${t.acts.map(a => `<a class="chip" href="#/activity/${a}">${ACT[a].t}</a>`).join('')}</div></div>`).join('')}</div>
  <div class="card" style="margin-top:16px"><h3>How the team works with mothers</h3><p style="margin:0">Each facilitator adopts a cluster of homes in Sekenani. They visit once a month, lead the Mama's Circle in turns, and bring their strand to the local schools so children carry the games home.</p></div>`;

V.progress = () => {
  const done = Object.keys(S.done);
  return `<h1>My Progress</h1>
  <div class="stats"><div class="card stat" style="--c:var(--y)"><span class="ic">⭐</span><div><span>Stars</span><b>${S.stars}</b></div></div><div class="card stat" style="--c:var(--o)"><span class="ic">🔥</span><div><span>Day Streak</span><b>${streak()}</b></div></div><div class="card stat" style="--c:var(--g)"><span class="ic">🧱</span><div><span>Activities</span><b>${done.length}</b></div></div></div>
  <div class="sec"><h2>Badges</h2></div>
  ${S.badges.length ? '' : `<div class="card center empty">${lambSVG()}<h3>No badges yet</h3><p class="mute">Play a game or a brick challenge to earn your first one.</p><a class="btn" href="#/games">Let's play</a></div>`}
  <div class="grid g5" style="margin-top:12px">${BADGES.filter(b => !b.fac).map(b => `<div class="card badge ${S.badges.includes(b.id) ? '' : 'lock'}"><div class="i">${b.icon}</div><b>${b.t}</b><div class="small mute">${b.how}</div></div>`).join('')}</div>
  <div class="sec"><h2>Activities done</h2></div>
  <div class="card">${done.length ? done.map(id => `<div class="phrase"><a href="#/activity/${id}">${ACT[id].t}</a><span>${'⭐'.repeat(Math.min(S.done[id], 5))}</span></div>`).join('') : '<p class="mute" style="margin:0">None yet. Try Today\'s Brick Challenge on the Home page!</p>'}</div>
  <p class="small mute" style="margin-top:16px">Progress is saved on this phone only. Many children share one phone? These are family stars: count them together at the end of the week.</p>
  <button class="btn alt" id="reset">Start again</button>`;
};
V.progress.after = () => { $('#reset').onclick = () => { if (confirm('Clear all stars and badges on this device?')) { S = { ...DEF }; save(); render(); } }; };

V.notfound = () => `<h1>Page not found</h1><a class="btn" href="#/home">Go home</a>`;

// ---------- Router ----------
function render() {
  window.speechSynthesis?.cancel(); SND.music(false);
  const [, r = 'home', arg] = (location.hash || '#/home').split('/');
  const view = V[r] && r !== 'notfound' ? V[r] : V.notfound;
  $('#view').innerHTML = view(arg);
  view.after && view.after(arg);
  const navKey = { activity: 'activities', game: 'games', story: 'stories', module: 'training', cards: 'training', bricks: 'home' }[r] || r;
  document.querySelectorAll('#nav a').forEach(a => { const on = a.dataset.r === navKey; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
}
window.addEventListener('hashchange', () => { render(); scrollTo(0, 0); $('#view').focus({ preventScroll: true }); });
updateLamb();
render();
REC.ready.then(() => location.hash.includes('mothers') && render());
const sndBtn = $('#sndBtn'), sndIcon = () => { sndBtn.textContent = SND.on ? '🔊' : '🔇'; sndBtn.setAttribute('aria-pressed', SND.on); };
sndIcon(); sndBtn.onclick = () => { SND.toggle(); sndIcon(); toast(SND.on ? 'Sound on' : 'Sound off'); };
// Offline: cache the site so it opens without signal in the Mara.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
