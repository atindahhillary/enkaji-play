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
function speak(text, lang = 'en', onend) {
  if (!('speechSynthesis' in window) || !SND.on) { onend && onend(); return; }
  window.speechSynthesis.cancel();
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
const GAMES = [
  { id: 'copy', t: 'Copy the Model', c: '#0277BD', bg: 'linear-gradient(135deg,#29B6F6,#81D4FA)', d: 'Look, remember, build' },
  { id: 'cattle', t: 'Count the Cattle', c: '#e65100', bg: 'linear-gradient(135deg,#fb8c00,#ffca28)', d: 'Count in Maa, Swahili, English' },
  { id: 'beads', t: 'Bead Patterns', c: '#c62828', bg: 'linear-gradient(135deg,#E53935,#FF8A65)', d: 'What comes next?' },
  { id: 'colour', t: 'Colour Hunt', c: '#0d9488', bg: 'linear-gradient(135deg,#14b8a6,#5eead4)', d: 'Find the colour' },
  { id: 'market', t: "Ruth's Market", c: '#1d4ed8', bg: 'linear-gradient(135deg,#3b82f6,#93c5fd)', d: 'Pay with shillings' },
  { id: 'code', t: 'Code the Cow', c: '#15803d', bg: 'linear-gradient(135deg,#22c55e,#a3e635)', d: 'Arrow cards, find the water' },
];
const tile = g => `<a class="tile" href="#/game/${g.id}"><div class="art" style="background:${g.bg}">${TILE_ART[g.id]()}</div><div class="tb"><h3>${g.t}</h3><span class="play" style="background:${g.c}">Play</span></div></a>`;
const actCard = a => `<a class="card act" href="#/activity/${a.id}">${S.done[a.id] ? '<span class="done" title="Done">✅</span>' : ''}${buildSVG(a.demo, { u: 14 })}
  <div class="row"><span class="pill" style="background:${DOMAINS[a.dom].c}22;color:${DOMAINS[a.dom].c}">${DOMAINS[a.dom].icon} ${DOMAINS[a.dom].t}</span><span class="pill">${a.mins} min</span></div>
  <h3>${a.t}</h3><p class="small mute" style="margin:0">${AGES[a.age]}</p></a>`;
const storyCover = s => s.pages[0].s();
function updateLamb() { $('#sideLamb').innerHTML = lambSVG('bounce'); }

// ---------- Views ----------
const V = {};

V.home = () => {
  const d = today(), n = (S.played[d] || []).length, pick = ACTIVITIES[new Date().getDate() % ACTIVITIES.length];
  return `
  <section class="hello"><div style="flex:1"><div class="tag">Supa! Hello, little explorer!</div>
    <div class="row"><span class="name">${esc(S.name)}</span><button class="editname" id="editName" aria-label="Change name">✏️</button></div>
    <div style="opacity:.95;font-weight:600">Six bricks. Endless ideas. Learning at home in Sekenani.</div></div>
    ${avatarSVG({ kind: 'girl', wrap: '#1E88E5', collar: ['#FDD835', '#fff', '#E53935', '#43A047'], bg: '#fff3e0' })}<div class="hero-band"></div></section>
  <div class="stats">
    <div class="card stat"><span class="ic">⭐</span><div><span>Stars</span><b>${S.stars}</b></div></div>
    <div class="card stat"><span class="ic">🔥</span><div><span>Day Streak</span><b>${streak()}</b></div></div>
    <div class="card stat"><span class="ic">🛡️</span><div><span>Badges</span><b>${S.badges.length}</b></div></div>
  </div>
  <div class="sec"><h2>🚀 Explore Games</h2><a href="#/games">View all →</a></div>
  <div class="grid g5">${GAMES.map(tile).join('')}</div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card goal"><h3>Today's Goal</h3><div class="row" style="justify-content:space-between"><span>Play 3 different games</span><b style="color:var(--pur)">${Math.min(n, 3)} / 3</b></div><div class="bar"><i style="width:${Math.min(n, 3) / 3 * 100}%"></i></div></div>
    <div class="card keep">${lambSVG()}<div><h3>Keep Going!</h3><p style="margin:0">${n >= 3 ? 'Goal done! Kerri the Maasai sheep is proud of you!' : "You're doing amazing! Kerri the Maasai sheep is cheering."}</p></div></div>
  </div>
  <div class="sec"><h2>🧱 Today's Brick Challenge</h2></div>
  <a class="card act" href="#/activity/${pick.id}" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:16px;align-items:center">${buildSVG(pick.demo, { u: 16, anim: true })}<div><span class="pill">${DOMAINS[pick.dom].icon} ${DOMAINS[pick.dom].t}</span><h2 style="margin-top:8px">${pick.t}</h2><p class="mute">${pick.steps[0]}</p><span class="btn">Let's play →</span></div></a>
  <div class="sec"><h2>Where do you want to go?</h2></div>
  <div class="grid g2">
    <a class="card entry" href="#/mothers">${avatarSVG({ kind: 'mother', wrap: '#c62828', bg: '#ffe9d6' })}<div><h3>Mothers Who Teach</h3><p class="mute small" style="margin:0">Picture and voice guides for Mama. No reading needed.</p></div></a>
    <a class="card entry" href="#/training">${avatarSVG({ kind: 'man', wrap: '#1565C0', bg: '#e3f2fd' })}<div><h3>Facilitator Training</h3><p class="mute small" style="margin:0">Six modules, one for each brick colour, with quizzes.</p></div></a>
    <a class="card entry" href="#/stories"><span class="em">📖</span><div><h3>Mara Stories</h3><p class="mute small" style="margin:0">Animated, read-aloud stories with a brick challenge.</p></div></a>
    <a class="card entry" href="#/bricks"><span class="em">🧱</span><div><h3>What is Six Bricks?</h3><p class="mute small" style="margin:0">The six colours, the rules and the Home Play Circle.</p></div></a>
  </div>`;
};
V.home.after = () => { $('#editName').onclick = () => { const n = prompt("What is the child's name?", S.name); if (n && n.trim()) { S.name = n.trim().slice(0, 20); save(); render(); } }; };

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
  return `<h1>Brick Activities</h1><p class="mute">${ACTIVITIES.length} activities for home and school. Each one has a picture demo and can be read aloud.</p>
  <div class="chips">${chip('age', 'all', 'All ages')}${chip('age', 'little', '👶🏾 Little Ones 3-5')}${chip('age', 'starter', '🎒 School Starters 6-8')}</div>
  <div class="chips">${chip('dom', 'all', 'All skills')}${Object.entries(DOMAINS).map(([k, d]) => chip('dom', k, d.icon + ' ' + d.t)).join('')}</div>
  <div class="grid g3">${list.map(actCard).join('') || '<p>No activities match.</p>'}</div>`;
};
V.activities.f = { age: 'all', dom: 'all' };
V.activities.after = () => document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { V.activities.f[b.dataset.f] = b.dataset.v; render(); });

V.activity = id => {
  const a = ACT[id]; if (!a) return V.notfound();
  const d = DOMAINS[a.dom], all = [a.t, ...a.steps.map((s, i) => `Step ${i + 1}. ${s}`)].join(' ');
  const team = a.by && TEAM.find(t => t.k === a.by);
  return `<a href="#/activities" class="mute">← All activities</a>
  <div class="row" style="justify-content:space-between;margin:10px 0"><h1 style="margin:0">${a.t}</h1>${listenBtn(all, 'en', '🔊 Listen to all steps')}</div>
  <div class="row" style="margin-bottom:14px"><span class="pill" style="background:${d.c}22;color:${d.c}">${d.icon} ${d.t}</span><span class="pill">${AGES[a.age]}</span><span class="pill">⏱ ${a.mins} min</span>${team ? `<span class="pill">Led by: ${team.name || team.role}</span>` : ''}</div>
  <div class="grid g2">
    <div class="card demo"><h3>Watch the demo</h3><div id="demo">${buildSVG(a.demo, { u: 22, anim: true })}</div><button class="btn alt" id="replay">▶ Play again</button></div>
    <div class="card"><h3>You need</h3><p>🧱 ${a.mat}</p><h3>No bricks?</h3><p>🏡 ${a.local}</p>${a.maa ? `<h3>Tip</h3><p>💡 ${a.maa}</p>` : ''}</div>
  </div>
  <div class="sec"><h2>Steps</h2></div>
  <ol class="steps">${a.steps.map((s, i) => `<li style="--sc:${BRICKS[i % 6].hex}"><span>${s}</span>${listenBtn(s)}</li>`).join('')}</ol>
  <div class="sec"><h2>Talk together</h2></div>
  <div class="card">${a.ask.map(q => `<div class="phrase"><b>💬 ${q}</b>${listenBtn(q)}</div>`).join('')}</div>
  <div style="text-align:center;margin:24px 0"><button class="btn big" id="didIt">${S.done[id] ? '✅ Done! Play it again for a star' : '🎉 We did it!'}</button></div>`;
};
V.activity.after = id => {
  $('#replay').onclick = () => { $('#demo').innerHTML = buildSVG(ACT[id].demo, { u: 22, anim: true }); };
  $('#didIt').onclick = () => { S.done[id] = (S.done[id] || 0) + 1; save(); star(1, '⭐ Great playing together!'); if (Object.keys(S.done).length >= 5) badge('mama'); render(); };
};

V.games = () => `<h1>Games</h1><p class="mute">Short games for children 3-8. Every win earns a star. Sound on for voices!</p><div class="grid g5">${GAMES.map(tile).join('')}</div>
  <div class="card" style="margin-top:18px"><h3>For grown-ups</h3><p class="mute" style="margin:0">Screens are a treat, not the teacher. After each game, play the same idea with real bricks, stones or beads.</p></div>`;
V.game = id => {
  const g = GAMES.find(x => x.id === id); if (!g) return V.notfound();
  return `<a href="#/games" class="mute">← All games</a><h1 style="margin-top:10px">${g.t}</h1><div class="card gamebox" id="game"></div>`;
};
V.game.after = id => GAME_MOUNT[id]($('#game'), { star, badge, bump, speak, played: () => playedGame(id) });

V.stories = () => `<h1>Mara Stories</h1><p class="mute">Animated stories that read themselves aloud in English, with Swahili lines. Each ends with a brick challenge.</p>
  <div class="grid g3">${STORIES.map(s => `<a class="tile" href="#/story/${s.id}"><div class="cover">${storyCover(s)}</div><div class="tb"><h3>${s.t}</h3><span class="play" style="background:${s.cover}">▶ Watch</span></div></a>`).join('')}</div>`;
V.story = id => {
  const s = STORIES.find(x => x.id === id); if (!s) return V.notfound();
  return `<a href="#/stories" class="mute">← All stories</a><h1 style="margin-top:10px">${s.t}</h1>
  <div class="story-stage" id="stage"></div>
  <div class="ctl"><button class="btn alt" id="prev" aria-label="Previous page">◀</button><button class="btn" id="playS">▶ Play story</button><button class="btn alt" id="next" aria-label="Next page">▶</button><button class="listen" id="sayW">🔊 Swahili</button></div>
  <div class="ctl"><div class="dots" id="dots"></div></div>`;
};
V.story.after = id => {
  const s = STORIES.find(x => x.id === id); let i = 0, auto = false;
  const show = () => {
    const p = s.pages[i];
    if (i === s.pages.length) {
      $('#stage').innerHTML = `<div class="cap" style="border-radius:24px;text-align:center"><div style="font-size:3rem">🧱</div><h2>Brick challenge!</h2><p>Now build the story with your bricks.</p><a class="btn" href="#/activity/${s.act}">${ACT[s.act].t} →</a></div>`;
      if (!S.count['story-' + id]) { S.count['story-' + id] = 1; badge('story'); star(2, '⭐⭐ You finished the story!'); }
      auto = false; $('#playS').textContent = '↺ Again';
    } else $('#stage').innerHTML = p.s() + `<div class="cap"><p class="en">${p.en}</p><p class="sw">${p.sw}</p></div>`;
    $('#dots').innerHTML = s.pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
  };
  const go = d => { i = Math.max(0, Math.min(s.pages.length, i + d)); show(); };
  const step = () => { if (!auto || i >= s.pages.length) return; speak(s.pages[i].en, 'en', () => setTimeout(() => { if (auto) { go(1); step(); } }, 700)); };
  $('#prev').onclick = () => { auto = false; window.speechSynthesis?.cancel(); go(-1); };
  $('#next').onclick = () => { auto = false; window.speechSynthesis?.cancel(); go(1); };
  $('#playS').onclick = () => { if (i >= s.pages.length) i = 0; auto = !auto; $('#playS').textContent = auto ? '⏸ Pause' : '▶ Play story'; show(); auto ? step() : window.speechSynthesis?.cancel(); };
  $('#sayW').onclick = () => { const p = s.pages[i]; if (p) speak(p.sw, 'sw'); };
  show();
};

V.mothers = () => {
  const t = V.mothers.track, list = ACTIVITIES.filter(a => a.age === t || a.age === 'both').slice(0, 9);
  return `<section class="mama-hero">${avatarSVG({ kind: 'mother', wrap: '#b71c1c', bg: '#ffd8b0', collar: ['#E53935', '#fff', '#1E88E5', '#FDD835', '#43A047'] })}
    <div><div style="font-weight:800;letter-spacing:.06em">TAKWENYA, MAMA! · IKO!</div><h1>Mothers Who Teach</h1>
    <p style="font-size:1.1rem;max-width:560px">You are your child's first and best teacher. You already teach beadwork, songs, cooking and respect. Six bricks add a little play to the day you already have.</p>
    ${listenBtn('Takwenya Mama! You are your child\'s first and best teacher. You do not need to read to teach. Look at the pictures, press the listen button, and play together for five minutes every day.', 'en', '🔊 Listen, Mama')} ${listenBtn('Habari Mama! Wewe ni mwalimu wa kwanza wa mtoto wako. Huhitaji kusoma ili kufundisha. Angalia picha, bonyeza kitufe cha kusikiliza, na mcheze pamoja dakika tano kila siku.', 'sw', '🔊 Sikiliza kwa Kiswahili')}</div></section>
  <div class="sec"><h2>How to use this</h2></div>
  <div class="how4"><div><span>👀</span>Look at the picture</div><div><span>🔊</span>Press Listen</div><div><span>🧱</span>Play 5 minutes</div><div><span>🤗</span>Praise the trying</div></div>
  <div class="sec"><h2>Choose your child</h2></div>
  <div class="chips"><button class="chip ${t === 'little' ? 'on' : ''}" data-t="little">👶🏾 Little One, 3-5 years (PP1-PP2)</button><button class="chip ${t === 'starter' ? 'on' : ''}" data-t="starter">🎒 School Starter, 6-8 years (Grade 1-3)</button></div>
  <div class="grid g3">${list.map(actCard).join('')}</div>
  <div class="sec"><h2>Play while you work</h2></div>
  <div class="grid g3">${MOMENTS.map(m => `<div class="card"><div class="row" style="justify-content:space-between"><span style="font-size:2.2rem">${m.icon}</span>${listenBtn(m.t + '. ' + m.p)}</div><h3>${m.t}</h3><p class="mute" style="margin:0">${m.p}</p></div>`).join('')}</div>
  <div class="sec"><h2>Count in three languages</h2></div>
  <div class="card"><div class="grid g5">${NUMBERS.map(n => `<button class="chip" style="padding:12px" data-maa="n${n.n}"><b style="font-size:1.4rem">${n.n}</b><br>${n.maa}<br><span class="mute small">${n.sw} · ${n.en}</span></button>`).join('')}</div><p class="small mute" style="margin:10px 0 0">Maa spellings vary. Ask the mothers to teach the facilitator the right sounds.</p></div>
  <div class="sec" id="maa-words"><h2>🎙️ Mama's Voice: Maa words</h2><span class="pill">Used in the games</span></div>
  <div class="card"><p>No phone can speak Maa yet, so the games use a Swahili voice for Maa words. <b>Mama, record each word in your own voice</b> and the games will play YOUR voice to the children. Recordings stay on this phone.</p>
    <p class="small mute">✅ checked in Maa sources · ❔ please check with the mothers in Sekenani. Spellings vary (Purko, Keekonyokie).</p>
    <div class="grid g3" data-words>${Object.entries(MAA).map(([k, m]) => `<div class="word-row"><div><b>${m.w}</b> ${m.c === 'H' ? '✅' : '❔'}<div class="small mute">${m.en} · ${m.sw}</div></div><div class="row" style="gap:6px"><button class="listen" data-maa="${k}" aria-label="Play ${m.w}">🔊</button><button class="listen rec ${REC.has('maa-' + k) ? 'has' : ''}" data-rec="${k}" aria-label="Record ${m.w}">🎙️</button></div></div>`).join('')}</div></div>
  <div class="card" style="margin-top:12px"><h3>🇰🇪 Kenyan accent</h3><p class="small" style="margin:0" data-voice></p></div>
  <div class="sec"><h2>Words that help children grow</h2></div>
  <div class="card">${PHRASES.map(p => `<div class="phrase"><div>${p.maa ? `<b>${p.maa}</b> · ` : ''}<b>${p.sw}</b><div class="small mute">${p.en}${p.note ? ' · ' + p.note : ''}</div></div>${listenBtn(p.sw, 'sw')}</div>`).join('')}</div>
  <div class="sec"><h2>The Mama's Circle</h2><span class="pill">Monthly, under a tree</span></div>
  <div class="grid g3">
    <div class="card"><h3>🎶 Open with a song</h3><p>A song everyone knows. Mothers lead it. Then each mother shows how many bricks her child can name.</p></div>
    <div class="card"><h3>🌟 Share one success</h3><p>"My son counted the goats in Maa." Clap for every story. Mothers learn most from each other.</p></div>
    <div class="card"><h3>🧱 Learn one new game</h3><p>The facilitator shows one activity. Mothers play it in pairs, one as "child", one as "Mama".</p></div>
    <div class="card"><h3>🗓️ Plan the month</h3><p>Pick two games for the month. Choose a buddy mother to visit and play with.</p></div>
  </div>`;
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

V.training = () => `<h1>Facilitator Training</h1>
  <p class="mute" style="max-width:720px">Six modules, one for each brick colour. Work through them in order over a 3 day training. Each ends with a practice, a reflection and a short quiz that earns a facilitator badge.</p>
  <div class="card" style="margin-bottom:16px"><h3>Suggested 3 day plan</h3><div class="grid g3 small"><div><b>Day 1</b><br>Modules 1-2: why play, meet the bricks, warm-ups</div><div><b>Day 2</b><br>Modules 3-4: numbers, words, body, mind and heart</div><div><b>Day 3</b><br>Modules 5-6: training mothers, your strand, practice in a home</div></div></div>
  <div class="grid g3">${MODULES.map(m => `<a class="card mod" href="#/module/${m.id}" style="--mc:${BRICK[m.c].hex}"><div class="row" style="justify-content:space-between"><span class="pill" style="background:${BRICK[m.c].hex}22;color:${BRICK[m.c].hex}">Module ${m.id} · ${BRICK[m.c].name}</span>${S.badges.includes('mod' + m.id) ? '🎓' : ''}</div><h3 style="margin-top:10px">${m.t}</h3><p class="mute small" style="margin:0">${m.sub}</p></a>`).join('')}</div>`;
V.module = id => {
  const m = MODULES.find(x => x.id == id); if (!m) return V.notfound();
  const hex = BRICK[m.c].hex;
  return `<a href="#/training" class="mute">← All modules</a>
  <div class="card" style="border-top:10px solid ${hex};margin-top:10px"><span class="pill" style="background:${hex}22;color:${hex}">Module ${m.id} · ${BRICK[m.c].name} brick</span><h1 style="margin-top:10px">${m.t}</h1><p class="mute">${m.sub}</p>
    <h3>By the end you can</h3><ul>${m.goals.map(g => `<li>${g}</li>`).join('')}</ul></div>
  <div class="sec"><h2>Key ideas</h2></div>
  <div class="grid g2">${m.ideas.map(x => `<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${x.h}</h3>${listenBtn(x.h + '. ' + x.p)}</div><p style="margin-top:8px">${x.p}</p></div>`).join('')}</div>
  <div class="sec"><h2>Practice: ${m.practice.h}</h2></div>
  <ol class="steps">${m.practice.steps.map((s, i) => `<li style="--sc:${hex}"><span>${s}</span></li>`).join('')}</ol>
  <div class="card" style="margin-top:16px;background:#fffaf0"><h3>🤔 Reflect</h3><p style="margin:0">${m.reflect}</p></div>
  <div class="sec"><h2>Quick quiz</h2><span class="mute small" id="qs"></span></div>
  <div class="grid g3 quiz">${m.quiz.map((q, qi) => `<div class="card"><b>${qi + 1}. ${q.q}</b>${q.o.map((o, oi) => `<button data-q="${qi}" data-o="${oi}">${o}</button>`).join('')}</div>`).join('')}</div>
  <div class="row" style="justify-content:space-between;margin-top:20px">${m.id > 1 ? `<a class="btn alt" href="#/module/${m.id - 1}">← Module ${m.id - 1}</a>` : '<span></span>'}${m.id < 6 ? `<a class="btn" href="#/module/${m.id + 1}">Module ${m.id + 1} →</a>` : '<a class="btn" href="#/team">Meet the team →</a>'}</div>`;
};
V.module.after = id => {
  const m = MODULES.find(x => x.id == id), right = new Set();
  document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    const q = +b.dataset.q, ok = +b.dataset.o === m.quiz[q].a;
    b.classList.add(ok ? 'ok' : 'no');
    if (ok) { right.add(q); b.parentElement.querySelectorAll('button').forEach(x => x.disabled = true); }
    $('#qs').textContent = `${right.size} / ${m.quiz.length} correct`;
    if (right.size === m.quiz.length && !S.badges.includes('mod' + m.id)) { badge('mod' + m.id); star(3, '🎓 Module complete! +3 ⭐'); }
  });
};

V.team = () => `<h1>The Facilitator Team</h1><p class="mute" style="max-width:720px">Each facilitator brings a strand from their own work. Together they cover the whole child: soil, digital, health, dreams, food and money.</p>
  <div class="grid g2 team">${TEAM.map(t => `<div class="card"><div class="row">${avatarSVG({ kind: t.name ? 'mother' : 'man', wrap: t.av.wrap, collar: t.av.collar, bg: t.av.wrap + '33', label: t.role })}<div><h2 style="margin:0">${t.name ? t.name + ', ' : ''}${t.role}</h2><span class="pill">${t.strand}</span></div></div>
    <p style="margin-top:12px">${t.blurb}</p><b class="small">Signature activities</b><div class="row" style="margin-top:6px">${t.acts.map(a => `<a class="chip" href="#/activity/${a}">${ACT[a].t}</a>`).join('')}</div></div>`).join('')}</div>
  <div class="card" style="margin-top:16px"><h3>How the team works with mothers</h3><p style="margin:0">Each facilitator adopts a cluster of homes in Sekenani. They visit once a month, lead the Mama's Circle in turns, and bring their strand to the local schools so children carry the games home.</p></div>`;

V.progress = () => {
  const done = Object.keys(S.done);
  return `<h1>My Progress</h1>
  <div class="stats"><div class="card stat"><span class="ic">⭐</span><div><span>Stars</span><b>${S.stars}</b></div></div><div class="card stat"><span class="ic">🔥</span><div><span>Day Streak</span><b>${streak()}</b></div></div><div class="card stat"><span class="ic">🧱</span><div><span>Activities</span><b>${done.length}</b></div></div></div>
  <div class="sec"><h2>Badges</h2></div>
  <div class="grid g5">${BADGES.filter(b => !b.fac).map(b => `<div class="card badge ${S.badges.includes(b.id) ? '' : 'lock'}"><div class="i">${b.icon}</div><b>${b.t}</b><div class="small mute">${b.how}</div></div>`).join('')}</div>
  <div class="sec"><h2>Facilitator badges</h2></div>
  <div class="grid g5">${BADGES.filter(b => b.fac).map(b => `<div class="card badge ${S.badges.includes(b.id) ? '' : 'lock'}"><div class="i">${b.icon}</div><b class="small">${b.t}</b></div>`).join('')}</div>
  <div class="sec"><h2>Activities done</h2></div>
  <div class="card">${done.length ? done.map(id => `<div class="phrase"><a href="#/activity/${id}">${ACT[id].t}</a><span>${'⭐'.repeat(Math.min(S.done[id], 5))}</span></div>`).join('') : '<p class="mute" style="margin:0">None yet. Try Today\'s Brick Challenge on the Home page!</p>'}</div>
  <p class="small mute" style="margin-top:16px">Progress is saved on this phone or computer only. Share the device? Each child can use a different browser profile.</p>
  <button class="btn alt" id="reset">Start again</button>`;
};
V.progress.after = () => { $('#reset').onclick = () => { if (confirm('Clear all stars and badges on this device?')) { S = { ...DEF }; save(); render(); } }; };

V.notfound = () => `<h1>Page not found</h1><a class="btn" href="#/home">Go home</a>`;

// ---------- Router ----------
function render() {
  window.speechSynthesis?.cancel();
  const [, r = 'home', arg] = (location.hash || '#/home').split('/');
  const view = V[r] && r !== 'notfound' ? V[r] : V.notfound;
  $('#view').innerHTML = view(arg);
  view.after && view.after(arg);
  const navKey = { activity: 'activities', game: 'games', story: 'stories', module: 'training', bricks: 'home' }[r] || r;
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === navKey));
}
window.addEventListener('hashchange', () => { render(); scrollTo(0, 0); $('#view').focus({ preventScroll: true }); });
updateLamb();
render();
REC.ready.then(() => location.hash.includes('mothers') && render());
const sndBtn = $('#sndBtn'), sndIcon = () => { sndBtn.textContent = SND.on ? '🔊' : '🔇'; };
sndIcon(); sndBtn.onclick = () => { SND.toggle(); sndIcon(); toast(SND.on ? 'Sound on' : 'Sound off'); };
