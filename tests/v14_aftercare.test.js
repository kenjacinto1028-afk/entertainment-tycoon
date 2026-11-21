'use strict';
const A=require('node:assert/strict');
const E=require('../dist/engine.js');
let count=0;
function test(label,run){try{run();count++;console.log('PASS',label);}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
function setup(seed){
 const s=E.createGame({era:25,origin:'film',seed,startingCapital:'funded',aiCount:5,regionCount:2});
 const p=E.createProject(s,{sector:'movie',route:'original',title:'Last Signal',genre:'Drama',size:.6});
 for(let n=0;n<110&&p.status==='active';n++)E.advance(s,1);
 A.equal(p.status,'released');return {s,p};
}
test('fan tour is a real expense and a temporary finite-wallet boost',()=>{
 const {s,p}=setup('v14-tour');
 const q=E.filmAftercareQuote14(s,p.id),opt=q.options.find(x=>x.kind==='fan-tour');
 A(opt.available);
 const cash=E.company(s,p.companyId).finance.cash;
 const action=E.filmAftercare14(s,p.id,'fan-tour');
 A(action.cost>0);A(E.company(s,p.companyId).finance.cash<cash);
 A(E.filmAftercareFactor14(p,s.week,'theatrical')>1);
 A.equal(E.filmAftercareFactor14(p,s.week+30,'theatrical'),1);
 A.throws(()=>E.filmAftercare14(s,p.id,'fan-tour'));
 A.deepEqual(E.audit(s),[]);
});
test('catalog restoration works after theaters with no extra revenue ledger',()=>{
 const {s,p}=setup('v14-restoration');
 for(let n=0;n<60&&E.filmWindowChannel(p,s.week)!=='catalog';n++)E.advance(s,1);
 A.equal(E.filmWindowChannel(p,s.week),'catalog');
 const before=p.directRevenue;
 const q=E.filmAftercareQuote14(s,p.id);
 A(q.options.find(x=>x.kind==='restoration').available);
 const a=E.filmAftercare14(s,p.id,'restoration');
 A(a.cost>0);A.equal(p.directRevenue,before);
 A(E.filmAftercareFactor14(p,s.week,'catalog')>1);
 E.advance(s,8);
 A.deepEqual(E.audit(s),[]);
 const copy=E.loadState(JSON.stringify(s));
 A.deepEqual(E.audit(copy),[]);
 A.equal(copy.projects.find(x=>x.id===p.id).cinema.aftercare14.length,1);
});
console.log('V14 AFTERCARE '+count+'/2');if(count!==2)process.exitCode=1;
