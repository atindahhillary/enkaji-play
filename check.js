// Smoke test: load data+art in a VM and render every scene/avatar/build without a DOM.
const fs=require('fs'),vm=require('vm');const ctx={matchMedia:()=>({matches:false})};vm.createContext(ctx);
for(const f of ['data.js','art.js','games.js'])vm.runInContext(fs.readFileSync(process.argv[2]+'/'+f,'utf8'),ctx);
vm.runInContext(`
for(const a of ACTIVITIES){if(!buildSVG(a.demo).includes('<svg'))throw a.id; if(a.by&&!TEAM.find(t=>t.k===a.by))throw 'team '+a.id}
for(const t of TEAM)for(const a of t.acts)if(!ACT[a])throw 'act '+a;
for(const s of STORIES){s.pages.forEach(p=>p.s()); if(!ACT[s.act])throw s.id}
for(const k in TILE_ART)TILE_ART[k]();for(const k in MAA)if(!MAA[k].say)throw 'maa '+k;if(Object.keys(GAME_MOUNT).length!==6)throw 'games';
avatarSVG({kind:'girl'});lambSVG();
for(const m of MODULES)for(const q of m.quiz)if(q.a>=q.o.length)throw 'quiz';
'all good: '+ACTIVITIES.length+' activities, '+STORIES.length+' stories'`,ctx);
console.log(vm.runInContext("'ok'",ctx));
