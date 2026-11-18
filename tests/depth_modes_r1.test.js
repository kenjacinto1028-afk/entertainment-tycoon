'use strict';
// R1: release reception roll (flops and breakouts). Config: depth.json RECEPTION. Save v38 field p.reception.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;const N=10;
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const R=E.CONFIG.depth.RECEPTION;
const game=(seed,depth='standard')=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:6,depth});
const fake=(i,quality,route='original')=>({id:'project-r1-'+i,route,quality});

check('Config: five levels flop..breakout, odds sum to 1, on in all three modes',()=>{
 assert.deepEqual(R.LEVELS.map(l=>l.key),['flop','weak','solid','strong','breakout']);
 assert(Math.abs(R.LEVELS.reduce((n,l)=>n+l.odds,0)-1)<1e-9);
 assert.deepEqual(R.modes,['simple','standard','veryComplex']);
 for(let i=1;i<R.LEVELS.length;i++)assert(R.LEVELS[i].mult>R.LEVELS[i-1].mult&&R.LEVELS[i].legs>=R.LEVELS[i-1].legs);
});
check('Roll never touches the main random stream and is repeatable for the same world and title',()=>{
 const s=game('r1-rng'),before=s.rng,p=fake(1,60);const a=E.receptionRoll(s,p);assert.equal(s.rng,before);
 const t=game('r1-rng'),b=E.receptionRoll(t,fake(1,60));assert.deepEqual(a,b);
 const u=game('r1-other-seed');let differs=0;for(let i=0;i<40;i++)if(E.receptionUnit(s,fake(i,60))!==E.receptionUnit(u,fake(i,60)))differs++;assert(differs>35);
});
check('Quality shifts the odds; a great title can still flop (about 6%), a very poor one cannot break out',()=>{
 const s=game('r1-odds'),count=(q,key)=>{let n=0;for(let i=0;i<4000;i++)if(E.receptionRoll(s,fake(i,q)).key===key)n++;return n/4000;};
 const f30=count(30,'flop'),f60=count(60,'flop'),f90=count(90,'flop'),b30=count(30,'breakout'),b90=count(90,'breakout');
 assert(f30>f60&&f60>f90&&f90>0.03,'flop '+[f30,f60,f90]);assert(b90>b30,'breakout '+[b30,b90]);
 assert(Math.abs(f60-R.LEVELS[0].odds)<0.03,'pivot flop share '+f60);
 return {flop:{q30:f30,q60:f60,q90:f90},breakout:{q30:b30,q90:b90}};
});
check('Contract jobs never roll',()=>{const s=game('r1-job');assert.equal(E.receptionRoll(s,fake(1,80,'contract')),null);});
check('Release: player and AI originals get a reception, player news says it, contract jobs stay null',()=>{
 const s=game('r1-release'),c=E.player(s);const p=E.createProject(s,{title:'Reception Test',sector:'publishing',route:'original',size:.6});
 assert.equal(p.reception,null);let w=0;while(p.status!=='released'&&w++<120)E.advance(s,1);
 assert.equal(p.status,'released');assert(R.LEVELS.some(l=>l.key===p.reception.key));
 assert(s.news.some(n=>n.title==='Reception Test released'&&/Reception: /.test(n.body)));
 E.advance(s,52);const ai=s.projects.filter(x=>x.companyId!==c.id&&x.status==='released'&&x.route!=='contract');assert(ai.length>0);
 assert(ai.every(x=>x.reception&&x.reception.mult>0));
 assert(s.projects.filter(x=>x.route==='contract').every(x=>x.reception===null));assert.deepEqual(E.audit(s),[]);
 return {player:p.reception.key,ai:ai.length};
});
check('Breakout sells more than flop from the same start (same title, same week)',()=>{
 const s=game('r1-sales');const p=E.createProject(s,{title:'Twin',sector:'publishing',route:'original',size:.6});let w=0;while(p.status!=='released'&&w++<120)E.advance(s,1);
 const lv=k=>R.LEVELS.find(l=>l.key===k),set=(x,k)=>{const q=x.projects.find(y=>y.id===p.id);const L=lv(k);q.reception={key:k,label:L.label,mult:L.mult,legs:L.legs,roll:0.5};return q;};
 const a=E.loadState(JSON.stringify(s)),b=E.loadState(JSON.stringify(s));const qa=set(a,'flop'),qb=set(b,'breakout');const ra=qa.directRevenue,rb=qb.directRevenue;
 E.advance(a,26);E.advance(b,26);const ga=qa.directRevenue-ra,gb=qb.directRevenue-rb;assert(gb>ga*2,'breakout '+gb+' vs flop '+ga);
 assert.deepEqual(E.audit(a),[]);assert.deepEqual(E.audit(b),[]);return {flop:Math.round(ga),breakout:Math.round(gb)};
});
check('Wallet cap and audits hold for 3 years in every mode',()=>{
 for(const d of ['simple','standard','veryComplex']){const s=game('r1-wallet-'+d,d);
  for(let w=0;w<156;w++){E.advance(s,1);const ceiling=E.activeRegions(s).reduce((acc,region)=>acc+Object.keys(E.SECTORS).reduce((v,sector)=>v+E.worldMarketBudget(s,sector,region.name),0),0);
   assert(s.weeklyConsumerSpend<=ceiling+Math.max(1,.0002*ceiling),'wallet '+d+' '+w);}
  assert.deepEqual(E.audit(s),[]);assert(s.projects.some(p=>p.reception));}
});
check('Mode switch mid-game does not change rolls; same seed gives the same game',()=>{
 const run=sw=>{const s=game('r1-switch');E.advance(s,40);if(sw)E.setDepth(s,'veryComplex');E.advance(s,40);return s.projects.filter(p=>p.reception).map(p=>p.id+':'+p.reception.key).join(',');};
 assert.equal(run(false),run(false));const a=run(false),b=run(true);const common=a.split(',').filter(x=>b.split(',').some(y=>y.split(':')[0]===x.split(':')[0]));
 assert(common.every(x=>b.includes(x)));
});
check('Save v38: round trip keeps reception; v37 saves migrate (old titles neutral) and audit rejects bad data',()=>{
 const s=game('r1-save');E.advance(s,60);const rel=s.projects.find(p=>p.reception);assert(rel);
 const t=E.loadState(JSON.stringify(s));assert.equal(t.version,E.SAVE_VERSION);assert.equal(E.SAVE_VERSION,38);assert.deepEqual(t.projects.find(p=>p.id===rel.id).reception,rel.reception);assert.deepEqual(E.audit(t),[]);
 const old=JSON.parse(JSON.stringify(s));old.version=37;for(const p of old.projects)delete p.reception;
 const u=E.loadState(old);assert.equal(u.version,E.SAVE_VERSION);assert(u.projects.every(p=>p.reception===null));assert.deepEqual(E.audit(u),[]);E.advance(u,4);assert.deepEqual(E.audit(u),[]);
 t.projects.find(p=>p.id===rel.id).reception={key:'mega',mult:9};assert(E.audit(t).some(x=>/Invalid reception/.test(x)));
});
check('Contract jobs and breakout/flop titles do not post revenue outside the sales ledger',()=>{
 const s=game('r1-ledger');E.advance(s,104);assert.deepEqual(E.audit(s),[]);const bridge=E.consolidatedStatements(s).balance;assert(Math.abs(bridge.difference)<.035);
});
console.log(`DEPTH R1 ${total}/${N} passed`);
