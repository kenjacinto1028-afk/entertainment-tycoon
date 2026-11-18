'use strict';
const E=require('../dist/engine.js'),assert=require('node:assert/strict'),fs=require('node:fs');
const scenarios=[
 {seed:'player-century-publisher44',era:1,origin:'publisher',startingCapital:'funded',aiCount:3,regionCount:2,years:100},
 {seed:'player-century-game44',era:25,origin:'games',startingCapital:'funded',aiCount:3,regionCount:2,years:100}
];
const results=[];
for(const config of scenarios){
 const recoveredPath=`reports/UPDATE_44_CENTURY_CHECKPOINT_${config.era}.json`;
 const recovered=process.env.STUDIO_RESUME_CENTURY==='1'&&fs.existsSync(recoveredPath)?JSON.parse(fs.readFileSync(recoveredPath,'utf8')):null;
 const s=recovered?E.loadState(recovered.state):E.createGame(config),started=Date.now(),initial=s.week-(recovered?recovered.year*52:0),ownerId=s.playerId,founderShares=E.corporateStatus(s).ownership.founder;
 let auditedYears=recovered?.metrics.auditedYears??recovered?.year??0;
 let appointments=recovered?.metrics.appointments||0,transitionWeeks=recovered?.metrics.transitionWeeks||0,launches=recovered?.metrics.launches||0,lateActiveWeeks=recovered?.metrics.lateActiveWeeks||0,maxSerialized=recovered?.metrics.maxSerialized||0,minCash=recovered?.metrics.minCash??Number.POSITIVE_INFINITY;
 const decisions=recovered?.metrics.decisions||[];
 for(let year=(recovered?.year||0)+1;year<=config.years;year++){
  const c=E.player(s);
  if(s.management.status==='active'&&!c.operating44.furloughed&&c.finance.cash>20000&&!s.projects.some(p=>p.companyId===c.id&&p.status==='active')){
   try{E.createProject(s,{title:'Century Library '+config.seed+' '+year,sector:c.sector,route:'original',genre:'Fantasy',size:.72});launches++;}catch(e){decisions.push({year,reason:'production-not-funded-or-ready',message:e.message});}
  }
  if(s.management.status==='active'&&s.founder.age>=69&&s.management.personId===s.founder.id){
   const leaders=s.employees.filter(e=>e.employerId===s.playerId&&e.status==='employed'&&e.age<65&&e.skill>=45&&E.player(s).teams.some(t=>t.leaderId===e.id));
   if(leaders.length&&!s.management.plannedSuccessorId)E.planLeadership(s,leaders[0].id);
  }
  for(let week=1;week<=52;week++){
   E.advance(s,1);
   if(s.management.status==='transition'){
    transitionWeeks++;
    const c=E.player(s),leaders=s.employees.filter(e=>e.employerId===c.id&&e.status==='employed'&&e.skill>=45&&e.age<75&&c.teams.some(t=>t.leaderId===e.id));
    if(leaders.length){
     const preferred=leaders.find(x=>x.id===s.management.plannedSuccessorId)||leaders.sort((a,b)=>a.age-b.age)[0];
     E.chooseLeader(s,preferred.id);appointments++;
    }
   }
   if(year>=50&&s.management.status==='active')lateActiveWeeks++;
  }
  const issues=E.audit(s);assert.deepEqual(issues,[],config.seed+' year '+year+' audit: '+issues.slice(0,5));auditedYears++;
  assert.equal(s.playerId,ownerId,'Executive appointment must not move company ownership');
  assert.equal(E.corporateStatus(s).ownership.founder,founderShares,'Appointments never transfer shares');
  minCash=Math.min(minCash,c.finance.cash);
  if(year%10===0){
   const restore=E.loadState(JSON.stringify(s));assert.deepEqual(E.audit(restore),[]);
   const size=Buffer.byteLength(JSON.stringify(s));maxSerialized=Math.max(maxSerialized,size);
   assert(size<80e6,config.seed+' 100-year save within tested 80 MB limit');
   fs.writeFileSync(recoveredPath,JSON.stringify({year,state:JSON.stringify(s),metrics:{auditedYears,appointments,transitionWeeks,launches,lateActiveWeeks,maxSerialized,minCash,decisions}}));
   console.log('CHECK',config.seed,'year',year,'active',s.management.status==='active','appointments',appointments,'cash',c.finance.cash,
    'releases',s.projects.filter(p=>p.companyId===ownerId&&p.status==='released').length,'sizeMB',(size/1e6).toFixed(1),'elapsedS',Math.round((Date.now()-started)/1000));
  }
 }
 assert.equal(s.week,initial+100*52);assert.equal(auditedYears,100,'Every year must have recorded an audit across resumed segments');
 const result={seed:config.seed,era:config.era,years:config.years,launches,appointments,transitionWeeks,lateActiveWeeks,
  playerCash:E.player(s).finance.cash,minCash,playerStatus:s.management.status,ownerId,
  playablePercent:Number((100*(s.week-initial-transitionWeeks)/(s.week-initial)).toFixed(3)),maxSerialized,auditedYears,
  completedReleases:s.projects.filter(p=>p.companyId===ownerId&&p.status==='released').length,issues:decisions.slice(0,20),lastSegmentElapsedSeconds:Math.round((Date.now()-started)/1000)};
 results.push(result);console.log('PASS',config.seed,JSON.stringify(result));
}
fs.writeFileSync('reports/UPDATE_44_PLAYER_CENTURY.json',JSON.stringify(results,null,2));
console.log('UPDATE44 managed century',results.length,'worlds, 200 yearly audits, 20 save/reloads');
