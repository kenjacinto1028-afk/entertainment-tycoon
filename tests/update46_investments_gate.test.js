'use strict'; const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{const x=fn();console.log('PASS',name,JSON.stringify(x||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
test('four strategies and three forecast scenarios are read-only and rights-aware',()=>{
 const s=E.createGame({seed:'strategy46',era:25,origin:'established',aiCount:10}),original=JSON.stringify(s);
 const cmp=E.investmentComparison(s,{sector:'publishing',title:'A New Story',route:'original',size:1});
 A.deepEqual(cmp.choices.map(c=>c.id),['produce','license','co-produce','wait']);A(cmp.choices[0].available);A(!cmp.choices[1].available);
 for(const scenario of ['conservative','expected','optimistic'])A(Number.isFinite(cmp.choices[0].scenario[scenario].directContribution));
 A.equal(JSON.stringify(s),original);A.equal(E.audit(s).length,0);return {choices:cmp.choices.map(c=>[c.id,c.available])};
});
test('forecast warning is visible under tight capital without creating cash',()=>{
 const s=E.createGame({seed:'risk46',era:25,origin:'film',startingCapital:'lean'});
 const before=JSON.stringify(E.player(s).finance);const x=E.previewProject(s,{sector:'movie',route:'original',title:'Big Risk',size:2.2});
 A(Number.isFinite(x.forecast.noSalesCashFloor));A(x.forecast.downsideWarning);A.equal(JSON.stringify(E.player(s).finance),before);
 const cmp=E.investmentComparison(s,{sector:'movie',route:'original',title:'Big Risk',size:2.2});A.equal(cmp.choices[0].noSalesCashFloor,x.forecast.noSalesCashFloor);A.equal(E.audit(s).length,0);
 return {cash:E.player(s).finance.cash,floor:x.forecast.noSalesCashFloor,warning:x.forecast.downsideWarning};
});
test('major and minor releases receive once-only historically comparable 13-week reviews',()=>{
 const s=E.createGame({seed:'reviews46',era:25,origin:'established',startingCapital:'funded',aiCount:8});
 const major=E.createProject(s,{sector:'publishing',route:'original',title:'Flagship X',size:1,flagship:'yes'});
 const minor=E.createProject(s,{sector:'publishing',route:'original',title:'Smaller Y',size:.65});
 A(major.major);A(!minor.major);
 for(let w=0;w<75;w++)E.advance(s,1);
 for(const p of [major,minor]){A.equal(p.status,'released');A(p.review);A.equal(p.review.variance,Math.round((p.review.actualDirect-p.review.expectedDirect)*100)/100);A.equal(p.review.horizonWeeks,13);}
 const oldWeek=major.review.week;for(let w=0;w<10;w++)E.advance(s,1);A.equal(major.review.week,oldWeek);
 const e=E.projectEvidence(s,{sector:'publishing'}),h=E.projectHistory(s);A(e.sampleSize>=2);A(h.releases.length>=2);A(e.rows.every(r=>r.source==='observed 13-week postmortem'));A.deepEqual(E.audit(s),[]);
 return {major:major.review.assessment,minor:minor.review.assessment,comparables:e.sampleSize};
});
test('owned franchise makes all four approaches available but only a funded contract transfers rights',()=>{
 const s=E.createGame({seed:'license-path46',era:25,origin:'established',startingCapital:'funded',aiCount:10});
 const p=E.createProject(s,{sector:'publishing',route:'original',title:'Franchise Opportunity',size:.65});const ip=s.ips.find(i=>i.id===p.ipId),cash=E.player(s).finance.cash;
 const result=E.investmentComparison(s,{sector:'publishing',route:'adaptation',ipId:ip.id,title:'Expansion',size:.65});
 A(result.choices.every(c=>c.available));A.equal(s.grants.length,0);A.equal(s.ips.find(i=>i.id===ip.id).ownerId,s.playerId);A.equal(E.player(s).finance.cash,cash);
 A.equal(result.choices.find(c=>c.id==='license').scenario.expected.gross,0);A.deepEqual(E.audit(s),[]);
 return {available:result.choices.map(c=>c.id),rightsTransferred:0};
});
console.log(`Update46 investment ${n}/4`);if(n!==4)process.exitCode=1;
