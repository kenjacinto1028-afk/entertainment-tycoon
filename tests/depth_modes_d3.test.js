'use strict';
// Depth modes step D3: yearly Inbox decision-card limit per mode, auto-settle by policy, auto disputes, save v36.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;
function check(label,fn){try{const evidence=fn();console.log('PASS',label,evidence?JSON.stringify(evidence):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const INBOX=E.CONFIG.depth.INBOX,PRIORITY=E.CONFIG.depth.PRIORITY;
const JOB={sector:'publishing',route:'contract',title:'Contract job',size:.6,clientId:'auto'};
function game(depth,seed='depth-d3'){return E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:10,depth});}
// Each over-priced service proposal makes the client counter, which raises one 'commission-counter-' Inbox item.
function counters(s,n){const q=E.previewProject(s,{...JOB,withForecast:false}),clients=E.eligibleClients(s,q.contractFee);
 return Array.from({length:n},(_,i)=>{const o=E.requestCommission(s,{...JOB,title:'Job '+i,clientId:clients[i%clients.length].id,fee:q.contractFee*3});
  assert.equal(o.status,'counter');return o;});}
const items=(s,prefix)=>s.inbox.filter(a=>a.key.startsWith(prefix));
function withPriority(tier,fn){const saved=JSON.parse(JSON.stringify(PRIORITY));
 PRIORITY.low=PRIORITY.low.filter(p=>p!=='commission-counter-');if(tier!=='normal')PRIORITY[tier].push('commission-counter-');
 try{return fn();}finally{PRIORITY.low=saved.low;PRIORITY.urgent=saved.urgent;}}

check('Limits per mode match the spec pace targets; new games start an empty log on save v36',()=>{
 assert.equal(INBOX.veryComplex.yearlyCards,null);assert.equal(INBOX.veryComplex.autoDisputes,false);
 assert(INBOX.simple.yearlyCards>=8&&INBOX.simple.yearlyCards<=12);assert(INBOX.standard.yearlyCards>=15&&INBOX.standard.yearlyCards<=25);
 assert(INBOX.simple.autoDisputes&&INBOX.standard.autoDisputes);
 const s=game('standard');assert.equal(s.version,E.SAVE_VERSION);assert(E.SAVE_VERSION>=38);
 assert.deepEqual(E.decisionCardLog(s),{year:25,cards:0,low:0,auto:0,limit:INBOX.standard.yearlyCards,lowLimit:INBOX.standard.lowPriorityCards});
 assert.deepEqual(E.audit(s),[]);return {simple:INBOX.simple.yearlyCards,standard:INBOX.standard.yearlyCards};
});
check('Simple files low-priority items and settles them by policy at the next week',()=>{
 const s=game('simple'),offers=counters(s,5);
 assert(items(s,'commission-counter-').every(a=>!a.open&&a.depthTriage==='auto'));
 assert.equal(E.decisionCardLog(s).cards,0);assert.equal(E.decisionCardLog(s).auto,5);
 const r=E.advance(s,4);assert.equal(r.weeks,4);
 assert(offers.every(o=>['accepted','declined'].includes(o.status)));
 assert(items(s,'commission-counter-').every(a=>a.depthTriage==='settled'));
 assert(s.news.filter(n=>n.title.startsWith('Handled automatically')).length>=5);
 assert.deepEqual(E.audit(s),[]);return {statuses:offers.map(o=>o.status)};
});
check('Standard shows low-priority cards only under its low limit',()=>{
 const s=game('standard');counters(s,12);const low=INBOX.standard.lowPriorityCards;
 assert.equal(items(s,'commission-counter-').filter(a=>a.open&&a.depthTriage==='card').length,low);
 assert.equal(items(s,'commission-counter-').filter(a=>a.depthTriage==='auto').length,12-low);
 assert.equal(E.decisionCardLog(s).low,low);return E.decisionCardLog(s);
});
check('Normal-priority cards stop at the yearly limit; urgent items are always shown',()=>{
 const normal=withPriority('normal',()=>{const s=game('standard');counters(s,25);return E.decisionCardLog(s);});
 assert.equal(normal.cards,INBOX.standard.yearlyCards);assert.equal(normal.auto,25-INBOX.standard.yearlyCards);
 const urgent=withPriority('urgent',()=>{const s=game('simple');counters(s,15);return E.decisionCardLog(s);});
 assert.equal(urgent.cards,15);assert.equal(urgent.auto,0);
 return {normal,urgent};
});
check('Very Complex is unchanged: every item is a card and nothing is settled for you',()=>{
 const s=game('veryComplex'),offers=counters(s,25);
 assert(items(s,'commission-counter-').every(a=>a.open&&a.depthTriage==='card'));
 E.advance(s,1);assert(offers.every(o=>o.status==='counter'));
 assert(!s.news.some(n=>n.title.startsWith('Handled automatically')));
 assert.deepEqual({...E.decisionCardLog(s)},{year:25,cards:25,low:25,auto:0,limit:null,lowLimit:null});
});
check('The count resets each game year',()=>{
 const s=game('standard');counters(s,3);assert.equal(E.decisionCardLog(s).cards,3);
 const year=E.yearAt(s.week);for(let i=0;i<60&&E.yearAt(s.week)===year;i++){E.advance(s,1);for(const a of s.inbox)if(a.open)E.dismissAlert(s,a.id);}
 const log=E.decisionCardLog(s);assert.equal(log.year,year+1);
 assert(log.cards<3||s.decisionCards.year===year+1,'old-year cards must not carry over');return log;
});
function inspectedJob(depth,seed){
 const s=E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:10,depth});
 const data={sector:'publishing',route:'contract',title:'Independent funded job',size:.6,clientId:'auto'};
 const quote=E.previewProject(s,{...data,withForecast:false}),client=E.eligibleClients(s,quote.contractFee)[0];
 const offer=E.requestCommission(s,{...data,clientId:client.id});assert.equal(offer.status,'accepted');
 const p=E.createProject(s,{...data,clientId:client.id,offerId:offer.id});
 for(let i=0;i<100&&p.weeksDone<p.weeksTotal*.4;i++)E.advance(s,1);
 return {s,p,review:E.commissionInspection47(s,p.id)};
}
check('Client disputes settle automatically in Simple/Standard and stay manual in Very Complex',()=>{
 let seed=null;for(let i=0;i<30&&!seed;i++)if(inspectedJob('veryComplex','dispute-d3-'+i).review.status==='open')seed='dispute-d3-'+i;
 assert(seed,'No reproducible challenged job');
 const manual=inspectedJob('veryComplex',seed);assert.equal(manual.review.status,'open');assert(!manual.review.autoResolved);
 assert(items(manual.s,'commission-dispute-').every(a=>a.open));
 const out={};
 for(const depth of ['simple','standard']){const {s,review}=inspectedJob(depth,seed);
  assert.equal(review.autoResolved,true);assert(['remedied','arbitrated'].includes(review.status));
  assert(items(s,'commission-dispute-').every(a=>!a.open&&a.depthTriage==='settled'));
  assert.equal(E.decisionCardLog(s).cards,0);assert(s.news.some(n=>n.title.startsWith('Handled automatically')));
  assert.deepEqual(E.audit(s),[]);assert(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);
  out[depth]=review.settlement;}
 return out;
});
check('Card log survives save/load; v35 saves upgrade to v36; audit catches a bad log',()=>{
 const s=game('standard');counters(s,10);const t=E.loadState(JSON.stringify(s));
 assert.deepEqual(t.decisionCards,s.decisionCards);assert.deepEqual(E.audit(t),[]);
 const old=JSON.parse(JSON.stringify(s));old.version=35;delete old.decisionCards;for(const a of old.inbox)delete a.depthTriage;
 const u=E.loadState(old);assert.equal(u.version,E.SAVE_VERSION);assert.deepEqual(u.decisionCards,{year:25,cards:0,low:0,auto:0});assert.deepEqual(E.audit(u),[]);
 E.advance(u,2);assert.deepEqual(E.audit(u),[]);
 u.decisionCards.cards=-1;assert(E.audit(u).includes('Invalid decision card log'));
});
console.log(`DEPTH D3 ${total}/8 passed`);
