'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let passed=0;
function test(name,fn){try{const d=fn();console.log('PASS',name,JSON.stringify(d||{}));passed++}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1}}
const audit=s=>{A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032)};
function world(seed){return E.createGame({era:25,origin:'film',seed,startingCapital:'funded',aiCount:5,regionCount:2})}
test('14 film: funded talent, exclusive casting across film and TV, finite owned backlot',()=>{
 const s=world('update48film-cast'),p=E.createProject(s,{sector:'movie',route:'original',title:'Stars and Stars',size:.6}),q=E.createProject(s,{sector:'movie',route:'original',title:'Star Two',size:.6});
 const actors=E.filmActorPool(s),a=actors.find(x=>x.available);A(a);
 const cash=E.player(s).finance.cash;E.filmAudition(s,p.id,a.id);const cast=E.filmChooseCast(s,p.id,a.id);A(cast.fee>0);A(E.player(s).finance.cash<cash);
 A.throws(()=>E.filmChooseCast(s,q.id,a.id),/unavailable/i);E.buildFilmBacklot(s);E.useFilmBacklot(s,p.id);A.throws(()=>E.useFilmBacklot(s,q.id),/occupied/i);
 A(E.player(s).filmBacklot.cost>0);audit(s);
 for(let k=0;k<90&&p.status==='active';k++)E.advance(s,1);A.equal(p.status,'released');A.equal(s.filmActors.find(x=>x.id===a.id).busyProjectId,null);
 const r=E.createProject(s,{sector:"movie",route:"original",title:"Star Returns",size:.6});E.filmChooseCast(s,r.id,a.id);A(r.cinema.castActorId===a.id);audit(s);
 return {castFee:cast.fee,facility:E.player(s).filmBacklot.cost,firstRelease:p.releaseWeek};
});
test('14 film: script, paid location/facility decisions, screening feedback and reshoot',()=>{
 const s=world('update48film-creative'),p=E.createProject(s,{sector:'movie',route:'original',title:'Creative Risk',size:.8});
 const cash=E.player(s).finance.cash,old=p.creativeQuality;E.filmDecision(s,p.id,'script');A(p.creativeQuality>old);A(p.weeksTotal>12);E.filmDecision(s,p.id,'facilities');
 A.throws(()=>E.filmDecision(s,p.id,'script'),/already/);
 for(let i=0;i<90&&p.weeksDone/p.weeksTotal<.48;i++)E.advance(s,1);
 const screening=E.filmDecision(s,p.id,'screening');A(screening.cost>0);E.filmDecision(s,p.id,'reshoot');A(p.cinema.reshoots===1);
 A(E.player(s).finance.cash<cash);audit(s);
 return {screening:screening.cost,scriptDrafts:p.cinema.scriptDrafts,reshoots:p.cinema.reshoots};
});
test('15 cinema: region premieres, window transitions, age categories, real festival honors and backend',()=>{
 const s=world('update48film-honors'),p=E.createProject(s,{sector:'movie',route:'original',title:'Regional Front Row',size:.65,targetAudience:'mature'});
 const actor=E.filmActorPool(s)[0];E.filmChooseCast(s,p.id,actor.id);E.filmDecision(s,p.id,'festival');E.filmDistribution(s,p.id,'wide');E.filmPremiere(s,p.id,'North Coast');
 A.equal(p.cinema.rating,'M');let begin=0;for(;begin<90&&p.status==='active';begin++)E.advance(s,1);A.equal(p.status,'released');
 for(let i=0;i<27;i++)E.advance(s,1);
 const report=E.filmBoxOffice(s,p.id);A(report.totalGross>0);A(report.channelGross.theatrical>0);A(report.channelGross['premium-rental']>0);A(report.channelGross.catalog>0);
 A(report.castPaid>0);A(report.castPaid<report.totalGross);A(report.regionalGross.some(x=>x.region==='North Coast'));A.equal(typeof p.criticScore,'number');A.equal(typeof p.audienceScore,'number');
 for(let i=0;i<120&&s.filmHonors.filter(x=>x.projectId===p.id).length===0;i++)E.advance(s,1);
 A(s.filmHonors.some(x=>x.projectId===p.id), 'Eligible festival release must produce a real recorded festival recognition');
 const award=s.filmHonors.find(x=>x.projectId===p.id);A(award.week>p.releaseWeek);audit(s);
 return {gross:report.totalGross,backend:report.castPaid,festival:award.festivalName,rating:report.rating};
});
console.log(`UPDATE48 FILM ${passed}/3`);if(passed!==3)process.exitCode=1;
