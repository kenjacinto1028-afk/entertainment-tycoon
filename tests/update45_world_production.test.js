'use strict';
const A=require('node:assert/strict'),E=require('../dist/engine.js');let n=0;
function test(name,fn){try{const x=fn();n++;console.log('PASS',name,x?JSON.stringify(x):'');}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
function audit(s){A.deepEqual(E.audit(s),[],'engine audit');}
test('Discovery pace separate from adoption, no waves before global sector gates',()=>{
 const runs={};for(const pace of ['slow','standard','fast']){const s=E.createGame({seed:'independent-tech',era:10,discoveryPace:pace,adoptionPace:'standard'});runs[pace]=E.technologyReport(s).publishing;}
 A(runs.fast.discoveryWeek<runs.standard.discoveryWeek&&runs.standard.discoveryWeek<runs.slow.discoveryWeek);
 for(const adopt of ['slow','standard','fast']){const s=E.createGame({seed:'adopt',era:25,discoveryPace:'standard',adoptionPace:adopt});runs[adopt+'Adoption']=E.technologyReport(s).games;}
 A.equal(runs.slowAdoption.discoveryWeek,runs.fastAdoption.discoveryWeek);
 A(runs.fastAdoption.adoption>runs.slowAdoption.adoption);
 const early=E.createGame({seed:'era1',era:1});A.equal(E.technologyReport(early).games.discovered,false);A.equal(E.worldMarketBudget(early,'games','North Coast'),0);
 audit(early);return {fastDiscovery:runs.fast.discoveryWeek,slowDiscovery:runs.slow.discoveryWeek,fastAdoption:runs.fastAdoption.adoption,slowAdoption:runs.slowAdoption.adoption};
});
test('Finite regional cohorts across maximum world size and low-wallet world',()=>{
 const results=[];for(const [seed,settings] of [['max-world45',{worldScale:3,aiCount:12,regionCount:4,populationScale:1.75,era:25,origin:'games',startingCapital:'funded'}],['lean-world45',{worldScale:3,aiCount:12,regionCount:2,populationScale:.5,era:10,origin:'games',startingCapital:'lean'}]]){
 const s=E.createGame({...settings,seed});let highestRatio=0;
 for(let w=0;w<52*2;w++){
  E.advance(s,1);const cap=E.activeRegions(s).reduce((sum,r)=>sum+Object.keys(E.SECTORS).reduce((v,sector)=>v+E.worldMarketBudget(s,sector,r.name),0),0);
  const ratio=s.weeklyConsumerSpend/Math.max(1,cap);highestRatio=Math.max(highestRatio,ratio);
  A(ratio<=1.001,`${seed}: consumer spending ${s.weeklyConsumerSpend} outstrips same-week world wallets ${cap} at ${s.week}`);
  if(s.week%13===0){audit(s);for(const r of E.activeRegions(s)){const cohorts=E.audienceCohorts(s,r.name);A.equal(cohorts.length,3);A(Math.abs(cohorts.reduce((x,c)=>x+c.share,0)-1)<1e-7);}}
 }
 results.push({seed,peakConsumerShare:+highestRatio.toFixed(3),companies:s.companies.length,background:s.backgroundFirms.length});
 }
 return results;
});
test('Same seed, same initial world, technologies and regions after serialization',()=>{
 const input={seed:'reproduction45',era:25,origin:'games',aiCount:12,regionCount:4,worldScale:3,adoptionPace:'fast'};
 const a=E.createGame(input),b=E.createGame(input);
 A.deepEqual(a,b);for(let k=0;k<12;k++){E.advance(a,1);E.advance(b,1);}
 A.deepEqual(a,b);audit(E.loadState(JSON.stringify(a)));return {week:a.week,companies:a.companies.length};
});
test('Finite distinct team slots, reassignments and interventions preserve audit',()=>{
 const s=E.createGame({seed:'workload45',era:25,origin:'established',startingCapital:'funded',aiCount:5});const c=E.player(s);
 const p1=E.createProject(s,{title:'Project one',sector:'publishing',route:'original',size:1.1,teamId:c.teams[0].id});
 const p2=E.createProject(s,{title:'Project two',sector:'publishing',route:'original',size:1.1,teamId:c.teams[1].id});
 A.throws(()=>E.createProject(s,{title:'Double-booked',sector:'publishing',route:'original',teamId:c.teams[0].id}),/team|slots/i);
 A.throws(()=>E.changeProjectTeam(s,p1.id,c.teams[1].id),/busy/i);
 const p3=E.createProject(s,{title:'Project three',sector:'publishing',route:'original',teamId:c.teams[2].id});
 A.equal(new Set([p1.teamId,p2.teamId,p3.teamId]).size,3);
 A.throws(()=>E.createProject(s,{title:'Project four',sector:'publishing',route:'original'}),/slots/);
 const old=p1.weeksTotal;const revised=E.interveneProduction(s,p1.id,'revision');A(revised.weeksTotal>old);A.throws(()=>E.interveneProduction(s,p1.id,'revision'),/once/);
 A.equal(E.setPausePolicy(s,true).stopForAdvisory,true);
 const oldWeek=s.week;s.inbox.push({id:'test-stop',kind:'advisory',open:true,title:'Decision'});
 const result=E.advance(s,10);A.equal(result.weeks,0);A.equal(s.week,oldWeek);s.inbox=s.inbox.filter(x=>x.id!=='test-stop');
 audit(s);return {active:s.projects.filter(p=>p.status==='active').length,workWeeksTotal:p1.weeksTotal};
});
console.log(`UPDATE45 WORLD+PRODUCTION ${n}/4 tests`);if(n!==4)process.exitCode=1;
