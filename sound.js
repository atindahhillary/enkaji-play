// Sound effects synthesised with Web Audio (no audio files) and Kenyan-voice selection for speech.
// Kept soft: every effect peaks well below speech so nothing startles a small child.

const SND = (() => {
  let ac, on = true;
  try { on = localStorage.getItem('enkaji-sound') !== 'off'; } catch {}
  const ctx = () => { if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); } if (ac.state === 'suspended') ac.resume(); return ac; };

  // One enveloped oscillator note.
  function tone(f, t0, dur, { type = 'sine', vol = .12, slide = 0, attack = .008 } = {}) {
    const a = ctx(); if (!a || !on) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  function noise(t0, dur, { vol = .05, freq = 2000, q = 1 } = {}) {
    const a = ctx(); if (!a || !on) return;
    const len = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + t0;
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start(t);
  }
  const fx = {
    pop: () => { tone(520, 0, .12, { vol: .1, slide: 380 }); },
    tap: () => { tone(880, 0, .06, { type: 'triangle', vol: .06 }); },
    brick: () => { noise(0, .05, { vol: .08, freq: 1800, q: 3 }); tone(300, 0, .08, { type: 'square', vol: .03 }); },
    clink: () => { tone(2400, 0, .25, { type: 'sine', vol: .05 }); tone(3600, .01, .18, { vol: .03 }); },
    coin: () => { tone(1320, 0, .12, { type: 'square', vol: .035 }); tone(1980, .07, .3, { type: 'square', vol: .03 }); },
    // Low sawtooth with a falling glide through a lowpass reads as a gentle "mooo".
    moo: () => {
      const a = ctx(); if (!a || !on) return;
      const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
      o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t); o.frequency.linearRampToValueAtTime(175, t + .25); o.frequency.linearRampToValueAtTime(120, t + .9);
      f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(900, t + .3); f.frequency.linearRampToValueAtTime(350, t + .9);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .12); g.gain.linearRampToValueAtTime(.0001, t + 1);
      o.connect(f).connect(g).connect(a.destination); o.start(t); o.stop(t + 1.05);
    },
    bleat: () => { [0, .12, .24].forEach(d => tone(520, d, .11, { type: 'triangle', vol: .05, slide: -60 })); },
    bell: () => { tone(660, 0, .9, { vol: .05 }); tone(990, 0, .7, { vol: .03 }); }, // cow bell / enkorkor
    yes: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .08, .3, { type: 'triangle', vol: .08 })); },
    no: () => { tone(330, 0, .16, { type: 'triangle', vol: .06 }); tone(262, .14, .22, { type: 'triangle', vol: .06 }); },
    cheer: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .06, .5, { type: 'triangle', vol: .06 })); noise(.1, .5, { vol: .025, freq: 3000, q: .5 }); },
    drumHi: () => { tone(300, 0, .16, { vol: .12, slide: -80 }); noise(0, .05, { vol: .03, freq: 2200 }); },
    drum: () => { tone(110, 0, .25, { vol: .14, slide: -50 }); noise(0, .08, { vol: .03, freq: 600 }); },
    whoosh: () => { noise(0, .3, { vol: .03, freq: 900, q: .7 }); },
  };
  // Story music bed: soft kalimba-like plucks in D major pentatonic at 96 bpm, a low drum pulse
  // and a light shaker. Layers enter one per bar (no startling jump), and the bed ducks while
  // anyone is speaking so the narrator always sits on top.
  let bed = null;
  function music(on) {
    if (!on) { if (bed) { clearInterval(bed.iv); const a = ctx(); if (a) bed.g.gain.setTargetAtTime(0, a.currentTime, .3); bed = null; } return; }
    const a = ctx(); if (!a || bed || !SND_ON()) return;
    const g = a.createGain(); g.gain.value = 0; g.connect(a.destination); g.gain.setTargetAtTime(1, a.currentTime, 1.2);
    const pluck = (f, t, v) => { const o = a.createOscillator(), o2 = a.createOscillator(), e = a.createGain(); o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2; e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(v, t + .005); e.gain.exponentialRampToValueAtTime(.0001, t + .9); o.connect(e); o2.connect(e); e.connect(g); o.start(t); o2.start(t); o.stop(t + 1); o2.stop(t + 1); };
    const D = [293.7, 329.6, 370, 440, 493.9, 587.3, 659.3];
    const melody = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 3, 4, 6, 5, 4, 2]; // two bars of eighths, resolves home
    const bass = [146.8, 146.8, 110, 123.5]; // D D A B, one per bar
    const eighth = 60 / 96 / 2; let n = 0, next = a.currentTime + .1;
    bed = { g, iv: setInterval(() => {
      const duck = window.speechSynthesis && speechSynthesis.speaking ? .35 : 1;
      g.gain.setTargetAtTime(duck, a.currentTime, .25);
      while (next < a.currentTime + .25) {
        const bar = Math.floor(n / 8);
        pluck(D[melody[n % 16]], next, .035);
        if (bar >= 1 && n % 8 === 0) { const o = a.createOscillator(), e = a.createGain(); o.frequency.value = bass[bar % 4]; e.gain.setValueAtTime(0, next); e.gain.linearRampToValueAtTime(.06, next + .02); e.gain.exponentialRampToValueAtTime(.0001, next + 1.6); o.connect(e).connect(g); o.start(next); o.stop(next + 1.7); }
        if (bar >= 2 && n % 2 === 1) { const len = a.sampleRate * .05, b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len); const src = a.createBufferSource(), f = a.createBiquadFilter(), e = a.createGain(); src.buffer = b; f.type = 'highpass'; f.frequency.value = 5000; e.gain.value = .012; src.connect(f).connect(e).connect(g); src.start(next); }
        n++; next += eighth;
      }
    }, 80) };
  }
  const SND_ON = () => on;
  return {
    music: v => { try { music(v); } catch {} },
    play: k => { try { fx[k] && fx[k](); } catch {} },
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('enkaji-sound', on ? 'on' : 'off'); } catch {} if (!on) { window.speechSynthesis?.cancel(); music(false); } return on; },
  };
})();

// ---------- Mama's Voice: real recordings of Maa words, stored on this device (IndexedDB) ----------
const REC = (() => {
  let dbp;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('enkaji-voice', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('clips');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('clips', mode), q = fn(t.objectStore('clips')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  const cache = {};
  let keys = new Set();
  const ready = (async () => { try { keys = new Set(await tx('readonly', s => s.getAllKeys())); } catch {} })();
  return {
    ready, has: k => keys.has(k),
    async play(k) {
      if (!keys.has(k)) return false;
      try {
        if (!cache[k]) cache[k] = URL.createObjectURL(await tx('readonly', s => s.get(k)));
        const a = new Audio(cache[k]); await a.play(); return a;
      } catch { return false; }
    },
    // Records up to `ms` milliseconds from the microphone and saves it under key k.
    async record(k, ms = 3000) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream), parts = [];
      mr.ondataavailable = e => parts.push(e.data);
      const done = new Promise(r => mr.onstop = r);
      mr.start(); setTimeout(() => mr.state !== 'inactive' && mr.stop(), ms);
      await done; stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(parts, { type: mr.mimeType || 'audio/webm' });
      await tx('readwrite', s => s.put(blob, k)); keys.add(k); delete cache[k];
      return true;
    },
    async remove(k) { await tx('readwrite', s => s.delete(k)); keys.delete(k); delete cache[k]; },
  };
})();

// Play Sanau's recorded clip for a Maa word, if there is one. Resolves to the Audio, or false.
function playSanau(k) {
  if (typeof SANAU === 'undefined' || !SANAU.has(k) || !SND.on) return Promise.resolve(false);
  const a = new Audio(`voice/${k}.mp3`);
  return a.play().then(() => a, () => false);
}

// ---------- Kenyan voices ----------
// Edge and some Android phones ship Kenyan voices (en-KE, sw-KE). Maa has no voice anywhere,
// so Maa words are spoken by the Swahili voice using a Swahili-style respelling (see MAA in data.js).
const VOICE = (() => {
  let list = [];
  const load = () => { list = window.speechSynthesis ? speechSynthesis.getVoices() : []; };
  if (window.speechSynthesis) { load(); speechSynthesis.onvoiceschanged = load; }
  const by = langs => {
    for (const l of langs) {
      const m = list.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(l.toLowerCase()));
      if (m.length) return m.find(v => /natural|online|google/i.test(v.name)) || m[0];
    }
    return null;
  };
  return {
    pick: lang => lang === 'sw' ? by(['sw-KE', 'sw-TZ', 'sw']) : by(['en-KE', 'sw-KE', 'sw-TZ', 'sw', 'en-TZ', 'en-NG', 'en-ZA', 'en-GB', 'en']),
    kenyan: lang => { const v = VOICE.pick(lang); return !!v && /(-KE|^sw)/i.test(v.lang.replace('_', '-')); },
    label() {
      const e = VOICE.pick('en'), s = VOICE.pick('sw');
      return { en: e ? e.name.replace(/Microsoft |Online |\(Natural\)| - .*$/g, '').trim() + ' (' + e.lang + ')' : 'none', sw: s ? s.name.replace(/Microsoft |Online |\(Natural\)| - .*$/g, '').trim() + ' (' + s.lang + ')' : 'none' };
    },
  };
})();
