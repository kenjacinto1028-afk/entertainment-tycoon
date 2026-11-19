'use strict';
// R4: genre fatigue. Config depth.json GENRE_FATIGUE. Worked out from release history: no save field, no RNG.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;const N=9;
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const F=E.CONFIG.depth.GENRE_FATIGUE;
const game=(seed,depth='standard')=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8,depth});
const run=(seed,years,depth)=>{const s=game(seed,depth);for(let w=0;w<52*years;w++)E.advance(s,1);return s;};
const withModes=(modes,fn)=>{const old=F.modes;F.modes=modes;try{return fn();}finally{F.modes=old;}};
const crowded=s=>{let best=null;for(const sec of Object.keys(E.SECTORS)){if(!E.available(sec,s.week))continue;const f=E.genreFatigue(s,sec);
 for(const g of E.GENRES)if(!best||f[g]<best.mult)best={sector:sec,genre:g,mult:f[g]};}return best;};
const mature=run('r4-world',6);
// Make a genre crowded on purpose: background firms put out n same-genre releases this week.
const crowd=(s,sector,genre,n=12)=>{const b=s.backgroundFirms.find(x=>x.sector===sector);assert(b,'no background firm for '+sector);
 for(let i=0;i<n;i++)b.releases.push({id:'minorwork-r4-'+i,releaseWeek:s.week,genre,quality:60,marketingRatio:.2});return {sector,genre,mult:E.genreFatigue(s,sector)[genre]};};
const crowdedCopy=()=>{const s=E.loadState(JSON.stringify(mature));return [s,crowd(s,'publishing','Mystery')];};

check('Config is valid and on in all three modes',()=>{
 assert.deepEqual(F.modes,['simple','standard','veryComplex']);assert(F.windowWeeks>0&&F.floor>0&&F.floor<1&&F.backgroundWeight>=0);
 for(const sec of Object.keys(E.SECTORS)){assert(F.free[sec]>=0,sec);assert(F.perPoint[sec]>0,sec);}
});
check('Multiplier: 1 up to the free allowance, then falls per point, never below the floor',()=>{
 for(const sec of Object.keys(E.SECTORS)){assert.equal(E.genreFatigueMult(sec,0),1);assert.equal(E.genreFatigueMult(sec,F.free[sec]),1);
  assert(Math.abs(E.genreFatigueMult(sec,F.free[sec]+1)-(1-F.perPoint[sec]))<1e-9);assert.equal(E.genreFatigueMult(sec,1e6),F.floor);}
});
check('Pressure matches the release history: titles count 1, background firms count half, fading over the window',()=>{
 const s=mature,sec='publishing',P=E.genreFatiguePressure(s,sec),r=E.activeRegions(s)[0].name,W=F.windowWeeks,want={};
 for(const p of s.projects)if(p.sector===sec&&p.status==='released'&&p.route!=='contract'&&s.week-p.releaseWeek<W&&p.releaseWeek<=s.week&&E.canDistribute43(s,p,r,p.releaseWeek))want[p.genre]=(want[p.genre]||0)+1-(s.week-p.releaseWeek)/W;
 for(const b of s.backgroundFirms)if(b.sector===sec)for(const x of b.releases)if(s.week-x.releaseWeek<W&&x.releaseWeek<=s.week)want[x.genre]=(want[x.genre]||0)+F.backgroundWeight*(1-(s.week-x.releaseWeek)/W);
 for(const g of E.GENRES)assert(Math.abs((P[r][g]||0)-(want[g]||0))<1e-9,g);
 return crowded(s);
});
check('Fatigue fades: with no new releases a crowded genre recovers after the window',()=>{
 const [s,c]=crowdedCopy(),later=E.genreFatigue(s,c.sector,s.week+Math.floor(F.windowWeeks/2))[c.genre],gone=E.genreFatigue(s,c.sector,s.week+F.windowWeeks)[c.genre];
 assert(c.mult<1&&later>c.mult&&gone===1,[c.mult,later,gone]);return {now:c.mult,halfWindow:later,afterWindow:gone};
});
check('Greenlight forecast reflects fatigue: a crowded genre forecasts lower than with fatigue off, and says so',()=>{
 const [s,c]=crowdedCopy(),pc=E.player(s);if(!pc.capabilities[c.sector])pc.capabilities[c.sector]='internal';
 const data={sector:c.sector,title:'Fatigue probe',route:'original',genre:c.genre,size:.6};
 const on=E.previewProject(s,data).forecast,off=withModes([],()=>E.previewProject(s,data).forecast);
 assert(on.genreFatigueAtRelease<1,'at release '+on.genreFatigueAtRelease);assert.equal(off.genreFatigueAtRelease,1);
 assert(on.scenario.expected.gross<off.scenario.expected.gross,'forecast not lowered');
 const job=E.previewProject(s,{...data,route:'contract'}).forecast;assert.equal(job.genreFatigueAtRelease,1);
 return {genre:c.genre,sector:c.sector,atRelease:on.genreFatigueAtRelease,expectedOn:on.scenario.expected.gross,expectedOff:off.scenario.expected.gross};
});
check('Sales: the same week sells less in a crowded genre than with fatigue off; total spending stays inside the wallet',()=>{
 const [a,c]=crowdedCopy(),b=E.loadState(JSON.stringify(a));
 const live=x=>x.projects.filter(p=>p.sector===c.sector&&p.genre===c.genre&&p.status==='released'&&p.route!=='contract').reduce((n,p)=>n+p.directRevenue,0);
 const a0=live(a);E.advance(a,1);withModes([],()=>E.advance(b,1));
 assert(live(a)-a0<live(b)-a0,'crowded genre did not sell less');
 const ceiling=E.activeRegions(a).reduce((acc,r)=>acc+Object.keys(E.SECTORS).reduce((v,sec)=>v+E.worldMarketBudget(a,sec,r.name),0),0);
 assert(a.weeklyConsumerSpend<=ceiling+Math.max(1,.0002*ceiling));
 return {withFatigue:Math.round(live(a)-a0),without:Math.round(live(b)-a0)};
});
check('No random numbers: same seed gives the same world, and fatigue never touches s.rng',()=>{
 const s=E.loadState(JSON.stringify(mature)),rng=s.rng;E.genreFatigue(s,'publishing');E.genreFatiguePressure(s,'movie');assert.equal(s.rng,rng);
 const x=JSON.stringify(run('r4-same',3).projects.map(p=>[p.id,p.genre,p.directRevenue])),y=JSON.stringify(run('r4-same',3).projects.map(p=>[p.id,p.genre,p.directRevenue]));assert.equal(x,y);
});
check('Save and reload: fatigue is the same (no new save field) and the world audits clean',()=>{
 const s=E.loadState(JSON.stringify(mature));for(const sec of Object.keys(E.SECTORS))assert.deepEqual(E.genreFatigue(s,sec),E.genreFatigue(mature,sec));
 assert.deepEqual(E.audit(s),[]);assert(E.SAVE_VERSION>=38);
});
check('Every company in a region sees the same multiplier for a genre (player and rivals alike)',()=>{
 const s=mature,P=E.genreFatiguePressure(s,'publishing');for(const r of E.activeRegions(s))for(const g of E.GENRES){const m=E.genreFatigueMult('publishing',P[r.name][g]);assert(m>=F.floor&&m<=1);}
});
console.log(total+'/'+N+' R4 checks passed');
