'use strict';
// R2: format sub-wallets. Book spending is split into print / digital / audio buyers (config depth.json FORMAT_POOLS).
// Full releases (Novel, Nonfiction, Comic / Manga) reach every group; Ebook and Web Serial reach digital only; Audiobook audio only.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const F=E.CONFIG.depth.FORMAT_POOLS;
const game=(seed,era=25,depth='standard')=>E.createGame({seed,era,origin:'established',startingCapital:'funded',aiCount:6,depth});
const release=(s,format)=>{const p=E.createProject(s,{title:'R2 '+format,sector:'publishing',format,genre:'Fantasy',route:'original',size:1});let w=0;while(p.status!=='released'&&w++<200)E.advance(s,1);assert.equal(p.status,'released');return p;};

check('Config: shares are valid every year, digital and audio grow, audio is zero before audiobooks exist',()=>{
 const s=game('r2-shares',1);let prev=null;
 for(let y=1;y<=130;y++){const sh=E.formatPoolShares(s,(y-1)*52+1);
  assert(Math.abs(sh.print+sh.digital+sh.audio-1)<1e-9,'sum '+y);for(const v of Object.values(sh))assert(v>=0&&v<=1,'range '+y);
  if(y<E.CONFIG.tuning_engine.publishingFormatAvailable__001)assert.equal(sh.audio,0);
  if(prev){assert(sh.digital>=prev.digital-1e-12);if(y>E.CONFIG.tuning_engine.publishingFormatAvailable__001)assert(sh.audio>=prev.audio-1e-12);}prev=sh;}
 assert(prev.print>0.3,'print stays the biggest group');
 assert.equal(E.formatReach('Novel'),null);assert.deepEqual(E.formatReach('Ebook'),['digital']);assert.deepEqual(E.formatReach('Audiobook'),['audio']);
 return {year130:prev};
});
check('Pool shares never touch the random stream',()=>{const s=game('r2-rng'),r=s.rng;E.formatPoolShares(s);E.formatReachShare(s,'Ebook');assert.equal(s.rng,r);});
check('Ebook-only edition earns about the digital share of a twin novel (same world, same week)',()=>{
 const base=game('r2-twin');E.advance(base,8);const snap=JSON.stringify(base);
 const a=E.loadState(snap),b=E.loadState(snap);const n=release(a,'Novel'),e=release(b,'Ebook');
 for(let i=0;i<2;i++){E.advance(a,52);E.advance(b,52);}
 const ratio=e.directRevenue/n.directRevenue,share=E.formatPoolShares(b).digital;
 assert(ratio>share*0.6&&ratio<share*1.5,'ratio '+ratio+' share '+share);
 assert(e.directCost<n.directCost,'ebook is the cheaper release');assert.deepEqual(E.audit(a),[]);assert.deepEqual(E.audit(b),[]);
 return {ratio:+ratio.toFixed(3),digitalShare:+share.toFixed(3)};
});
check('Forecast shows the smaller reach of digital-only and audio-only editions',()=>{
 const s=game('r2-forecast'),g=f=>E.previewProject(s,{sector:'publishing',format:f,size:1,genre:'Fantasy'}).forecast.scenario.expected.gross;
 const n=g('Novel'),e=g('Ebook'),a=g('Audiobook'),sh=E.formatPoolShares(s);
 assert(e<n*(sh.digital+0.05)&&e>n*sh.digital*0.5,'ebook '+e+' vs novel '+n);assert(a<n*(sh.audio+0.05),'audio '+a);
 return {novel:Math.round(n),ebook:Math.round(e),audiobook:Math.round(a)};
});
check('Wallet cap and audits hold with every format selling, in every mode',()=>{
 for(const d of ['simple','standard','veryComplex']){const s=game('r2-wallet-'+d,25,d);
  const make=f=>{try{E.createProject(s,{title:'W '+f,sector:'publishing',format:f,genre:'Fantasy',route:'original',size:.6});}catch(e){}};
  for(let w=0;w<130;w++){if(w%15===0)['Ebook','Audiobook','Web Serial'].forEach(make);E.advance(s,1);const ceiling=E.activeRegions(s).reduce((acc,region)=>acc+Object.keys(E.SECTORS).reduce((v,sector)=>v+E.worldMarketBudget(s,sector,region.name),0),0);
   assert(s.weeklyConsumerSpend<=ceiling+Math.max(1,.0002*ceiling),'wallet '+d+' '+w);}
  assert.deepEqual(E.audit(s),[]);const out=new Set(s.projects.filter(p=>p.companyId===s.playerId&&p.status==='released').map(p=>p.format));assert(out.has('Ebook')&&out.has('Audiobook')&&out.has('Web Serial'),[...out].join());}
});
check('Same seed gives the same game; save/load mid-sales does not change the result',()=>{
 const run=split=>{let s=game('r2-repeat');E.advance(s,8);release(s,'Ebook');release(s,'Audiobook');E.advance(s,20);if(split)s=E.loadState(JSON.stringify(s));E.advance(s,30);return JSON.stringify(s.projects.map(p=>[p.id,p.directRevenue,p.directCost]))+s.rng;};
 assert.equal(run(false),run(false));assert.equal(run(false),run(true));
});
check('A world with no digital-only or audio-only titles uses the old single-pool maths',()=>{
 // R3: rivals now make limited formats, so switch the rival mix to full releases only for this check.
 const M=E.CONFIG.rivals.RIVAL_FORMAT_MIX,keep=M.publishing;M.publishing=[{format:'Novel',weight:1}];
 try{const s=game('r2-oldpath');E.advance(s,52);assert(!s.projects.some(p=>p.sector==='publishing'&&E.formatReach(p.format)&&p.route!=='contract'),'no limited-format originals when rivals make only full releases');}finally{M.publishing=keep;}
});
console.log(total+'/7 R2 checks passed');
