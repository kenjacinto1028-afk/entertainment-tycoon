'use strict';
const assert=require('node:assert/strict');const E=require('../dist/engine.js');
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
test('Update41 v30 save migrates to current save format without changing booked cash',()=>{
 const old=require('./fixtures/engine41.js').createGame({seed:'migrate42',era:10});
 const raw=JSON.stringify(old),converted=E.loadState(raw);
 assert.equal(converted.version,E.SAVE_VERSION);assert.equal(E.audit(converted).length,0);
 assert.equal(E.player(converted).finance.cash,old.companies.find(c=>c.id===old.playerId).finance.cash);
});
test('Rivals have reproducible, differentiated own-money multi-year plans',()=>{
 const a=E.createGame({seed:'rivalplans',era:25,aiCount:8}),b=E.createGame({seed:'rivalplans',era:25,aiCount:8});
 const fingerprint=s=>s.companies.filter(c=>!c.isPlayer).map(c=>[c.aiIdentity.style,c.aiPlan.goal,c.aiPlan.budgetCeiling,c.aiPlan.endWeek]);
 assert.deepEqual(fingerprint(a),fingerprint(b));
 assert(new Set(a.companies.filter(c=>!c.isPlayer).map(c=>c.aiIdentity.style)).size>=2);
 assert(a.companies.every(c=>c.isPlayer||(c.aiPlan.endWeek>c.aiPlan.issuedWeek&&c.aiPlan.budgetCeiling<=c.finance.cash)));
});
test('Competitor intelligence cannot expose exact private cash or plans',()=>{
 const s=E.createGame({era:25,seed:'intel42'}),c=s.companies.find(x=>!x.isPlayer);
 const displayed=JSON.stringify(E.rivalIntelligence(s,c.id));
 assert(!displayed.includes('budgetCeiling'));assert(!displayed.includes('interestPayable'));assert(!displayed.includes('aiPlan'));
 assert.equal(E.rivalIntelligence(s,c.id).publicFacts.source,'known');
 assert.equal(E.rivalIntelligence(s,c.id).strategy.source,'estimated');
});
test('New competitors spend finite founder equity, never receive recurring rescues',()=>{
 const s=E.createGame({seed:'entry42',era:25,aiCount:6});
 const old=s.companies[1];old.bankrupt=true;
 const before=s.entrepreneurPool,oldLength=s.companies.length;
 E.advance(s,52);
 assert(s.companies.length>=oldLength);assert(s.entrepreneurPool<=before);assert.equal(E.audit(s).length,0);
 const newcomer=s.rivalEvents.filter(x=>x.kind==='founder-funded-entry');
 assert(newcomer.length>0);
 assert.equal(newcomer.reduce((n,e)=>n+e.detail.capital,0),Math.round((before-s.entrepreneurPool)*100)/100);
});
test('Annual market concentration uses real audited historic revenue and no hidden financial leakage',()=>{
 const s=E.createGame({seed:'concentration42',era:25});const initial=E.rivalMarketConcentration(s,'publishing');
 assert.equal(initial.total,0);E.advance(s,52);const c=E.rivalMarketConcentration(s,'publishing');
 assert(c.topThreeShare>=0&&c.topThreeShare<=1);assert(c.leaders.every(x=>x.source===undefined));assert.equal(E.audit(s).length,0);
});
test('Institutions expose automated lender, contract and regulator descriptions',()=>{
 const s=E.createGame({seed:'institution42'});const r=E.institutionsReport(s);
 assert.match(r.lending,/underwritten/);assert.match(r.regulation,/debut years/);assert.equal(E.audit(s).length,0);
});
test('Sequential saved quarters keep rival plans, history and valid ledgers',()=>{
 const s=E.createGame({seed:'rival-long42',era:10,aiCount:8});for(let i=0;i<16;i++){
 E.advance(s,13);assert.deepEqual(E.audit(s),[]);
 const s2=E.loadState(JSON.stringify(s));assert.deepEqual(E.audit(s2),[]);
 }
});
console.log('Update42A: '+count+'/'+count+' checks passed');
