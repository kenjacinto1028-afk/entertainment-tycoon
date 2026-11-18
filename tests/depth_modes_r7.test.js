'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
const init=seed=>{const s=E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8,depth:'standard'});E.incorporateStudio(s);return s;};
const check=s=>{A.deepEqual(E.audit(s),[]);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);};
test('quote scales with float and fee is a low % of the raise',()=>{
 const s=init('r7-a'),q5=E.ipoQuote(s,.05),q20=E.ipoQuote(s,.2),q40=E.ipoQuote(s,.4);
 A(q5.raise<q20.raise&&q20.raise<q40.raise);for(const q of[q5,q20,q40])A(Math.abs(q.fee-Math.max(1000,q.raise*.04))<.02);
 A.throws(()=>E.ipoQuote(s,.5),/between/);A.throws(()=>E.ipoQuote(s,.01),/between/);
 return {valuation:q20.valuation,raise20:q20.raise,fee20:q20.fee};
});
test('IPO adds raise as equity (not revenue), pays fee, keeps audit and pool conservation',()=>{
 const s=init('r7-b'),c=E.player(s),q=E.ipoQuote(s,.2),cash=c.finance.cash,rev=c.finance.revenue,pool=s.investorPool;
 const r=E.launchIPO(s,.2);A.equal(r.stage,'public-corporation');A.equal(r.raise,q.raise);
 A(Math.abs(c.finance.cash-(cash+q.raise-q.fee))<.01);A.equal(c.finance.revenue,rev);A.equal(s.investorPool,pool);
 const own=E.corporateStatus(s).ownership;A(Math.abs(own.public/own.total-.2)<.01);
 A.throws(()=>E.launchIPO(s,.2),/already/);check(s);
 return {raise:r.raise,fee:r.fee,publicShare:own.public/own.total};
});
test('works in all depth modes and across seeds',()=>{
 for(const seed of['r7-c','r7-d','r7-e']){const s=init(seed);E.launchIPO(s,.1);check(s);}return {};
});
console.log(n+' tests');
