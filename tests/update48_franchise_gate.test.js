'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function check(name,fn){try{let r=fn();console.log('PASS',name,JSON.stringify(r||{}));n++}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1}}
const audit=s=>{A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032)};
const release=(s,p)=>{for(let i=0;i<90&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released')};
check('23: four-medium franchise has single source ownership, main and alternate canon, crossmedia linked works',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'update48-franchise',startingCapital:'funded',aiCount:6,regionCount:2}),book=E.createProject(s,{title:'Aster Saga',sector:'publishing',route:'original',size:.55,genre:'Fantasy',leadCharacter:'Astral Fox'});release(s,book);
 const id=book.ipId;for(const sec of ['movie','tv','games'])E.enterSector(s,sec,'partner');
 const p=E.createProject(s,{sector:'movie',route:'adaptation',title:'Aster Feature',ipId:id,size:.55,leadCharacter:'Astral Fox'});
 const q=E.createProject(s,{sector:'tv',route:'adaptation',title:'Aster Series',ipId:id,size:.55,leadCharacter:'Astral Fox'});E.editFranchiseBranch(s,id,q.id,'alternate');
 const schedule=E.franchiseSchedule(s,id);A(schedule.productions.length>=3);E.coordinateFranchiseReleases(s,id,8);
 release(s,p);release(s,q);const game=E.createProject(s,{sector:'games',route:'adaptation',title:'Aster Quest',ipId:id,size:.55,leadCharacter:'Astral Fox'});release(s,game);
 const b=E.franchiseBible(s,id);A.equal(b.underlyingOwnerId,s.playerId);A.equal(b.projects.length,4);A.equal(b.characters[0].projectIds.length,4);
 A(b.branches.main.some(x=>x.projectId===book.id));A(b.branches.alternate.some(x=>x.projectId===q.id));A.equal(b.events.filter(x=>x.kind==='release').length,4);
 A.equal(new Set(b.projects.map(x=>x.sourceId)).size,1);A(s.works.every(w=>w.ipId!==id||w.ownerId===s.playerId));
 E.editFranchiseBible(s,id,{summary:'One connected creative universe',continuity:'strict'});A.equal(E.franchiseBible(s,id).editorialNotes.continuity,'strict');
 const f=E.franchiseOverview(s,id);A.equal(f.linkedProductionCount,4);A(f.directContribution===E.franchiseFinancial(s,id).directContribution);audit(s);audit(E.loadState(JSON.stringify(s)));
 return {ip:id,works:b.projects.length,events:b.events.length,net:f.directContribution};
});
check('23: independent adaptation retains external producer revenue and owner has only earned license',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'update48-external-ip',startingCapital:'funded',aiCount:9,regionCount:2}),book=E.createProject(s,{sector:'publishing',route:'original',title:'Owned Novel Rights',size:.55});
 const studio=s.companies.find(x=>x.id!==s.playerId&&x.capabilities.movie&&x.finance.cash>20000);A(studio);
 const grant=E.grantRightsPackage43(s,{ipId:book.ipId,holderId:studio.id,media:'movie',territories:['North Coast'],fee:3000,weeks:60,exclusive:true});
 const film=E.createProject(s,{sector:'movie',route:'adaptation',companyId:studio.id,ipId:book.ipId,title:'Licensed Film',releaseTerritories:['North Coast'],size:.55});
 const beforeOwner=E.franchiseFinancial(s,book.ipId);A(beforeOwner.recognizedOwnerLicensingIncome>=3000);
 A.throws(()=>E.editFranchiseBranch(s,book.ipId,film.id,'alternate'),/unrelated|externally/i);
 release(s,film);for(let k=0;k<5;k++)E.advance(s,1);
 const f=E.franchiseFinancial(s,book.ipId);A.equal(f.externalProjectCount,1);A.equal(f.directProductionRevenue,book.directRevenue);
 A.equal(E.franchiseBible(s,book.ipId).rights.find(x=>x.grantId===grant.id).holderId,studio.id);A.equal(s.ips.find(x=>x.id===book.ipId).ownerId,s.playerId);
 audit(s);return {externalGross:film.stats.totalSales,ownerLicensingIncome:f.recognizedOwnerLicensingIncome};
});
console.log(`UPDATE48 FRANCHISE ${n}/2`);if(n!==2)process.exitCode=1;
