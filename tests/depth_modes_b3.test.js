'use strict';
// Depth modes step 2, B3: client contracts gated by player Reputation.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const T=E.CONFIG.depth.CONTRACT_TIERS;
const game=(depth='standard')=>{const s=E.createGame({seed:'b3',era:25,origin:'established',startingCapital:'funded',aiCount:10,depth});return s;};
const withRep=(s,r)=>{E.player(s).reputation=r;return s;};
const req=(s,size,extra={})=>{const sector=E.player(s).sector,cl=E.eligibleClients(s,0)[0];
 return E.requestCommission(s,{sector,title:'Job',size,clientId:cl.id,...extra});};
check('Tiers live in config: 35 / 55 / 75 and 0/5/10/20% pay',()=>{
 assert.deepEqual(T.tiers.map(t=>t.minReputation),[0,35,55,75]);assert.deepEqual(T.tiers.map(t=>t.payBonus),[0,0.05,0.1,0.2]);});
check('Tier lookup by Reputation',()=>{const s=game();
 for(const [r,t] of [[10,1],[34,1],[35,2],[54,2],[55,3],[74,3],[75,4],[98,4]]){assert.equal(E.contractTier(withRep(s,r)).tier,t,'rep '+r);}});
check('Under 35: small job allowed, bigger refused with plain message',()=>{
 const s=withRep(game(),20);assert.equal(req(s,0.75).status!==undefined,true);
 assert.throws(()=>req(s,1),/small jobs until Reputation 35/);assert.throws(()=>req(s,1.5),/Reputation (35|55)/);});
check('35–54: standard allowed, ambitious refused until 55',()=>{
 const s=withRep(game(),40);req(s,1);assert.throws(()=>req(s,1.5),/Reputation 55/);});
check('55+: any size allowed',()=>{const s=withRep(game(),60);req(s,1.5);});
check('Pay bonus grows with tier (same job, same seed)',()=>{
 const fee=r=>{const s=withRep(game(),r);return E.previewProject(s,{sector:E.player(s).sector,route:'contract',size:0.75,withForecast:false}).contractFee;};
 const base=fee(10),f40=fee(40),f60=fee(60),f80=fee(80);
 assert(f40>base&&f60>f40&&f80>f60);assert(Math.abs(f80/base-1.2)<0.01);assert(Math.abs(f40/base-1.05)<0.01);});
check('Rivals are not gated or bonused (bonus only for the player)',()=>{
 const s=game(),ai=s.companies.find(c=>c.id!==s.playerId&&!c.parentId);
 const a=E.previewProject(s,{companyId:ai.id,sector:ai.sector,route:'contract',size:1,withForecast:false});
 const b=E.previewProject(withRep(s,90),{companyId:ai.id,sector:ai.sector,route:'contract',size:1,withForecast:false});assert.equal(a.contractFee,b.contractFee);});
check('Booking an unsigned big contract directly is also blocked at low Reputation',()=>{
 const s=withRep(game(),20);assert.throws(()=>E.createProject(s,{sector:E.player(s).sector,route:'contract',title:'X',size:1.5,clientId:'auto'}),/Reputation/);});
check('Gate works in every depth mode; audit is clean',()=>{
 for(const d of ['simple','standard','veryComplex']){const s=withRep(game(d),20);assert.throws(()=>req(s,1.5),/Reputation/);assert.deepEqual(E.audit(s),[]);}});
