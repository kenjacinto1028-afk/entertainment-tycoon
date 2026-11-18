'use strict';
// Q16: independent full-century timelines from two eras, no mocked business ticks.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');
const plans=[
 {seed:'century-publishing-43',era:1,origin:'publisher',aiCount:3,difficulty:'standard',regionCount:2,worldScale:1,years:100},
 {seed:'century-mature-43',era:25,origin:'games',aiCount:3,difficulty:'challenging',regionCount:2,worldScale:1,years:100}
];
let successes=0;
for(const plan of plans){
 const started=Date.now(),s=E.createGame(plan),initial=s.week;let successorCount=0,unfilled=0,maxBytes=0;
 const c=E.player(s),p=E.createProject(s,{title:plan.era===1?'Story of a Century':'Beyond Time',sector:c.sector,route:'original',size:.7,genre:'Fantasy'});
 if(plan.era===25){
  const pub=s.companies.find(x=>x.capabilities.games&&!x.isPlayer&&!x.parentId&&!x.bankrupt&&E.gamePublisherQuote43(s,p.id,x.id).willAccept);
  if(pub)E.signGamePublisher43(s,p.id,pub.id);
  const holder=s.companies.find(x=>!x.isPlayer&&!x.parentId&&x.finance.cash>6000);
  if(holder)E.grantRightsPackage43(s,{ipId:p.ipId,holderId:holder.id,media:'movie',territories:['North Coast'],weeks:52,fee:1600,exclusive:true});
 }
 for(let y=1;y<=plan.years;y++){
  for(let w=0;w<52;w++){
   const step=E.advance(s,1);assert.equal(step.weeks,1,`World unexpectedly stopped ${plan.seed} Y${y}`);
   if(s.management.status==='transition'){
    const c=E.player(s),leaders=(s.employees||[]).filter(e=>e.employerId===c.id&&e.status==='employed'&&e.skill>=45&&e.age<75&&c.teams.some(t=>t.leaderId===e.id));
    if(leaders.length){try{E.chooseLeader(s,leaders.sort((a,b)=>a.age-b.age)[0].id);successorCount++;}catch(_){unfilled++;}}
    else unfilled++;
   }
  }
  const bad=E.audit(s);
  if(bad.length)throw Error(`${plan.seed} world year ${E.yearAt(s.week)}: ${JSON.stringify(bad.slice(0,9))}`);
  const group=E.consolidatedStatements(s);assert(Math.abs(group.balance.difference)<=.031,'Group must reconcile');
  assert(s.projects.every(x=>E.yearAt(x.startWeek)>=E.SECTORS[x.sector].year),'No project may precede industry debut');
  assert(s.grants.every(g=>g.startWeek<=s.week),'No future-dated active obligations');
  if(y%10===0){
   const copy=E.loadState(JSON.stringify(s));assert.deepEqual(E.audit(copy),[]);
   const bytes=Buffer.byteLength(JSON.stringify(s));maxBytes=Math.max(maxBytes,bytes);
   assert(bytes<70e6,'Century save exceeded 70 MB ceiling');
   console.log(`CHECK ${plan.seed} Y${y} worldY${E.yearAt(s.week)} companies=${s.companies.length} projects=${s.projects.length} saveMB=${(bytes/1e6).toFixed(2)} audit=PASS elapsed=${Math.round((Date.now()-started)/1000)}s`);
  }
 }
 assert.equal(s.week,initial+5200);
 assert(s.companies.length>1&&s.projects.length>0);
 console.log('PASS',plan.seed,'100 years','100 yearly audits','10 save/reloads','maxSaveMB',(maxBytes/1e6).toFixed(2),'successionAppointments',successorCount,'transitionWeeks',unfilled,'elapsedS',Math.round((Date.now()-started)/1000));
 successes++;
}
console.log(`UPDATE43 Q16 ${successes}/${plans.length} centuries passed`);
