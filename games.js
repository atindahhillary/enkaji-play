// Five short games. Each mount(el, api) draws into el and calls api.star / api.badge on wins.

const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shakeEl = el => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

const GAME_MOUNT = {
  // Look at a tower, remember it, rebuild it from memory.
  copy(el, api) {
    let level = 1;
    const round = () => {
      const target = shuffle(BRICKS.map(b => b.k)).slice(0, Math.min(level + 1, 6));
      let mine = [];
      el.innerHTML = `<p class="lvl">Level ${level}</p><h2>Look carefully! 👀</h2><div id="show">${towerSVG(target)}</div><p id="cd" class="mute"></p>`;
      api.speak('Look carefully and remember the colours');
      let t = 2 + level;
      const tick = setInterval(() => {
        const cd = document.getElementById('cd'); if (!cd) return clearInterval(tick);
        cd.textContent = `Hiding in ${t}...`;
        if (t-- <= 0) { clearInterval(tick); build(); }
      }, 1000);
      const build = () => {
        el.innerHTML = `<p class="lvl">Level ${level}</p><h2>Now build it! Bottom brick first 🧱</h2><div id="mine">${towerSVG(mine)}</div>
          <div class="palette">${BRICKS.map(b => `<button style="background:${b.hex}" data-k="${b.k}" aria-label="${b.name}"></button>`).join('')}</div><button class="btn alt" id="undo">↩ Undo</button>`;
        el.querySelectorAll('[data-k]').forEach(btn => btn.onclick = () => {
          mine.push(btn.dataset.k); api.speak(BRICK[btn.dataset.k].name);
          document.getElementById('mine').innerHTML = towerSVG(mine);
          if (mine.length === target.length) check();
        });
        document.getElementById('undo').onclick = () => { mine.pop(); document.getElementById('mine').innerHTML = towerSVG(mine); };
      };
      const check = () => {
        const ok = mine.join() === target.join();
        el.innerHTML = `<h2>${ok ? 'Perfect copy! 🎉' : 'Nearly! Look at both 👇'}</h2><div class="row" style="justify-content:center;gap:40px"><div><b>Model</b>${towerSVG(target)}</div><div><b>Yours</b>${towerSVG(mine)}</div></div>
          <button class="btn big" id="nx">${ok ? 'Next level →' : 'Try again'}</button>`;
        if (ok) { api.star(); api.played(); level++; if (level >= 4) api.badge('memory'); api.speak('Perfect copy!'); } else api.speak('Nearly! Try again');
        document.getElementById('nx').onclick = round;
      };
    };
    round();
  },

  // Count cattle in the boma, answer in Maa, Swahili and English.
  cattle(el, api) {
    let wins = 0;
    const round = () => {
      const n = rnd(1, wins < 3 ? 5 : 10), cols = ['#8d5524', '#eee', '#3e2723', '#c17d3c'];
      const herd = Array.from({ length: n }, (_, i) => cow(70 + (i % 5) * 140, 150 + Math.floor(i / 5) * 110, .8, cols[i % 4], i % 2)).join('');
      const opts = [n, ...shuffle([n - 2, n - 1, n + 1, n + 2].filter(v => v >= 1 && v <= 10)).slice(0, 2)];
      el.innerHTML = `<p class="lvl">Herds counted: ${wins}</p><h2>How many cows are in the boma? 🐄</h2>
        <div class="herd"><svg viewBox="0 0 720 280"><rect width="720" height="280" rx="20" fill="#e9dcae"/>${boma(10, 278, 700)}${herd}</svg></div>
        <div class="choices">${shuffle(opts).map(o => `<button data-n="${o}">${o}</button>`).join('')}</div>`;
      api.speak('How many cows are in the boma?');
      el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
        if (+b.dataset.n !== n) { shakeEl(b); api.speak('Count again, touch each cow'); return; }
        const w = NUMBERS[n - 1]; wins++;
        api.speak(`${w.en}! ${w.sw}!`); api.star(1, `⭐ ${w.maa}! ${w.sw}! ${w.en}!`); api.played();
        api.bump('cattle', 5, 'cattle');
        setTimeout(round, 1800);
      });
    };
    round();
  },

  // Continue a Maasai beadwork pattern.
  beads(el, api) {
    const C = ['#E53935', '#ffffff', '#1E88E5', '#FDD835', '#43A047', '#FB8C00'];
    const KINDS = ['AB', 'AAB', 'ABC', 'ABB'];
    let wins = 0;
    const round = () => {
      const kind = KINDS[Math.min(Math.floor(wins / 2), 3)], cols = shuffle(C).slice(0, 3);
      const unit = kind.split('').map(ch => cols[ch.charCodeAt(0) - 65]);
      const seq = Array.from({ length: unit.length * 2 + 1 }, (_, i) => unit[i % unit.length]);
      const ans = unit[seq.length % unit.length];
      const opts = shuffle([...new Set([ans, ...cols, C[0]])]).slice(0, 3); if (!opts.includes(ans)) opts[0] = ans;
      el.innerHTML = `<p class="lvl">Patterns: ${wins}</p><h2>What bead comes next? 📿</h2>
        <div style="margin:16px 0">${seq.map(c => `<span class="bead" style="background:${c}"></span>`).join('')}<span class="bead q">?</span></div>
        <div class="choices">${shuffle(opts).map(c => `<button data-c="${c}" aria-label="bead"><span class="bead" style="background:${c}"></span></button>`).join('')}</div>`;
      api.speak('What bead comes next?');
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
        if (b.dataset.c !== ans) { shakeEl(b); api.speak('Look at the pattern again'); return; }
        wins++; api.star(1, '⭐ Beautiful beadwork!'); api.played(); api.bump('beads', 5, 'beads');
        setTimeout(round, 1300);
      });
    };
    round();
  },

  // Hear a colour name and tap the brick. English or Swahili.
  colour(el, api) {
    let lang = 'en', found = 0;
    const round = () => {
      const target = BRICKS[rnd(0, 5)], word = lang === 'en' ? target.name : target.sw;
      el.innerHTML = `<div class="chips" style="justify-content:center"><button class="chip ${lang === 'en' ? 'on' : ''}" data-l="en">English</button><button class="chip ${lang === 'sw' ? 'on' : ''}" data-l="sw">Kiswahili</button></div>
        <p class="lvl">Found: ${found}</p><h2>Find <span style="color:${target.hex === '#FDD835' ? '#c9a400' : target.hex}">${word}</span>! <button class="listen" id="again">🔊</button></h2>
        <div class="palette">${shuffle(BRICKS).map(b => `<button style="background:${b.hex};width:96px;height:72px" data-k="${b.k}" aria-label="brick"></button>`).join('')}</div>`;
      const say = () => api.speak(lang === 'en' ? 'Find ' + word : 'Tafuta ' + word, lang);
      say(); document.getElementById('again').onclick = say;
      el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { lang = b.dataset.l; round(); });
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
        if (b.dataset.k !== target.k) { shakeEl(b); api.speak(lang === 'en' ? 'That is ' + BRICK[b.dataset.k].name : 'Hiyo ni ' + BRICK[b.dataset.k].sw, lang); return; }
        found++; api.star(1, `⭐ ${target.name} · ${target.sw}`); api.played(); api.bump('colour', 6, 'colour');
        setTimeout(round, 1100);
      });
    };
    round();
  },

  // Pay the exact price at Ruth's stall with Kenyan coins.
  market(el, api) {
    const ITEMS = [['🥛', 'Milk', 15], ['🥚', 'Egg', 5], ['🥬', 'Sukuma', 10], ['🌽', 'Maize cob', 20], ['🍌', 'Bananas', 12], ['🍅', 'Tomatoes', 8], ['🫘', 'Beans', 7], ['🥖', 'Bread', 25]];
    let wins = 0;
    const round = () => {
      const [icon, name, price] = ITEMS[rnd(0, ITEMS.length - 1)];
      let paid = [];
      const draw = () => {
        const sum = paid.reduce((a, b) => a + b, 0);
        el.innerHTML = `<p class="lvl">Paid right: ${wins}</p><div style="font-size:4rem">${icon}</div><h2>${name} costs ${price} shillings</h2>
          <p>Ruth says: "Pay me the exact money, please!"</p>
          <div class="coins">${[1, 5, 10, 20].map(c => `<button class="coin ${c >= 10 ? 's' : ''}" data-c="${c}">${c}<br><small>KSh</small></button>`).join('')}</div>
          <h3 style="margin-top:16px">You gave: <span style="color:${sum > price ? 'var(--r)' : 'var(--pur)'}">${sum}</span> / ${price}</h3>
          <p class="small mute">${paid.join(' + ') || 'Tap the coins'}</p>
          <div class="row" style="justify-content:center"><button class="btn alt" id="clr">Take back coins</button><button class="btn" id="pay">Pay Ruth</button></div>`;
        el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { paid.push(+b.dataset.c); api.speak(b.dataset.c); draw(); });
        document.getElementById('clr').onclick = () => { paid = []; draw(); };
        document.getElementById('pay').onclick = () => {
          if (sum === price) { wins++; api.star(1, '⭐ Asante! Exact money!'); api.played(); api.bump('market', 4, 'market'); api.speak('Asante sana! Exact money!'); setTimeout(round, 1500); }
          else { shakeEl(document.getElementById('pay')); api.speak(sum < price ? `Not enough. You need ${price - sum} more.` : `Too much! Take back ${sum - price}.`); }
        };
      };
      draw(); api.speak(`${name} costs ${price} shillings`);
    };
    round();
  },
};
