// Offline support: the Mara has weak signal, so cache the whole site after the first visit.
// Bump VERSION on every deploy that changes files, so phones pick up the new copy.
const VERSION = 'enkaji-v16';
const FILES = ['./', 'index.html', 'styles.css', 'games.css', 'data.js', 'voicelines.js', 'sound.js', 'art.js', 'games.js', 'app.js', 'manifest.webmanifest', 'fonts.css', 'fonts/Inter-latin-400.woff2', 'fonts/Inter-latin-ext-400.woff2', 'fonts/PatrickHandSC-latin-400.woff2', 'fonts/PatrickHandSC-latin-ext-400.woff2', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', ...['beads','black','blue','bye','calf','cattle','child','come','cow','enkang','goat','good','green','hello','house','iko','koko','look','milk','mother','n1','n10','n2','n3','n4','n5','n6','n7','n8','n9','orange','p_aii','p_aii_maa','p_asante','p_asante_maa','p_beadnext','p_beadnext_maa','p_bug','p_bug_maa','p_buildit','p_buildit_maa','p_coming','p_coming_maa','p_countme','p_countme_maa','p_drumlisten','p_drumlisten_maa','p_harvest','p_harvest_maa','p_hongera','p_howmanyhome','p_howmanyhome_maa','p_howmanynow','p_howmanynow_maa','p_jaribu','p_jenga','p_jenga_maa','p_letsplay','p_letsplay_maa','p_listen','p_listen_maa','p_lookcolours','p_lookcolours_maa','p_pole','p_pole_maa','p_sawa','p_sawa_maa','p_sikiliza','p_sikiliza_maa','p_starts','p_starts_maa','p_thirsty','p_thirsty_maa','p_tryagain','p_tryagain_maa','p_welldone','p_welldone_maa','p_yourturn','p_yourturn_maa','red','s_littleseed_1_en','s_littleseed_1_maa','s_littleseed_1_sw','s_littleseed_2_en','s_littleseed_2_maa','s_littleseed_2_sw','s_littleseed_3_en','s_littleseed_3_maa','s_littleseed_3_sw','s_littleseed_4_en','s_littleseed_4_maa','s_littleseed_4_sw','s_lostcalf_1_en','s_lostcalf_1_maa','s_lostcalf_1_sw','s_lostcalf_2_en','s_lostcalf_2_maa','s_lostcalf_2_sw','s_lostcalf_3_en','s_lostcalf_3_maa','s_lostcalf_3_sw','s_lostcalf_4_en','s_lostcalf_4_maa','s_lostcalf_4_sw','s_lostcalf_5_en','s_lostcalf_5_maa','s_lostcalf_5_sw','s_mamabeads_1_en','s_mamabeads_1_maa','s_mamabeads_1_sw','s_mamabeads_2_en','s_mamabeads_2_maa','s_mamabeads_2_sw','s_mamabeads_3_en','s_mamabeads_3_maa','s_mamabeads_3_sw','s_mamabeads_4_en','s_mamabeads_4_maa','s_mamabeads_4_sw','s_sixbricks_1_en','s_sixbricks_1_maa','s_sixbricks_1_sw','s_sixbricks_2_en','s_sixbricks_2_maa','s_sixbricks_2_sw','s_sixbricks_3_en','s_sixbricks_3_maa','s_sixbricks_3_sw','s_sixbricks_4_en','s_sixbricks_4_maa','s_sixbricks_4_sw','s_sixbricks_5_en','s_sixbricks_5_maa','s_sixbricks_5_sw','s_sixbricks_6_en','s_sixbricks_6_maa','s_sixbricks_6_sw','sheep','sky','supa','supaAll','thanks','water','white','yellow','yes'].map(k => `voice/${k}.mp3`)];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first (fresh content when there is signal), cache as the fallback. Fonts: cache first.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const font = /fonts\.(googleapis|gstatic)\.com/.test(req.url);
  if (!font && new URL(req.url).origin !== location.origin) return;
  if (font) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html'))));
});
