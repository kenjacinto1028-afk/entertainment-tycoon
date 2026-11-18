'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
const make=seed=>E.createGame({era:25,origin:'established',seed,startingCapital:'funded',aiCount:9});
test('negotiated exclusive manuscript license respects real owner cash and optional creator veto',()=>{
 const s=make('editorial-contract-47'),m=E.manuscriptMarket(s)[0];A(m&&m.ownerId!==s.playerId);
 const offered=E.negotiateManuscript(s,m.id,{advance:m.advance-1,royaltyRate:m.royaltyRate,approvalRequired:true});
 A.equal(offered.status,'counter');const cash=E.player(s).finance.cash,owner=E.company(s,m.ownerId),ownerCash=owner.finance.cash;
 const grant=E.answerManuscript(s,offered.id,true);
 A.equal(grant.grantorId,m.ownerId);A.equal(grant.holderId,s.playerId);A(grant.approvalRequired);
 A.equal(E.player(s).finance.cash,cash-grant.fee);A.equal(owner.finance.cash,ownerCash+grant.fee);
 const veto=E.requestManuscriptApproval(s,grant.id,{title:'A wrong direction',genre:'Drama'===m.genre?'Fantasy':'Drama'});
 A.equal(veto.status,'rejected');
 const approve=E.requestManuscriptApproval(s,grant.id,{title:m.title,genre:m.genre});A.equal(approve.status,'approved');
 A.deepEqual(E.audit(s),[]);return {owner:m.ownerId,payment:grant.fee,veto:veto.status};
});
test('editorial choice changes creative and technical quality independently at actual cost and time',()=>{
 const s=make('editorial-revisions-47'),p=E.createProject(s,{sector:'publishing',route:'original',title:'Revision Matters',genre:'Fantasy',format:'Novel',size:.55});
 const creative=p.creativeQuality,technical=p.technicalQuality,weeks=p.weeksTotal,cash=E.player(s).finance.cash;
 const desk=E.editorialAssessment(s,p.id);A(desk.choices.length>=3);
 E.editorialDecision(s,p.id,'development');A(p.creativeQuality>creative);A.equal(p.technicalQuality,technical);A(p.weeksTotal>weeks);A(E.player(s).finance.cash<cash);
 E.editorialDecision(s,p.id,'copyedit');A(p.technicalQuality>technical);
 A.throws(()=>E.editorialDecision(s,p.id,'copyedit'),/already/i);
 for(let i=0;i<60&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 A(p.creatorCredits.length>0);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
 return {creativeBefore:creative,creativeAfter:p.creativeQuality,technicalBefore:technical,technicalAfter:p.technicalQuality};
});
test('delegated web serial can choose cadence and one substantive arc without chapter micromanagement',()=>{
 const s=make('editorial-serial-47'),p=E.createProject(s,{sector:'publishing',route:'original',title:'Serialized Saga',format:'Web Serial',size:.55});
 const oldWeeks=p.weeksTotal;E.setSerialCadence(s,p.id,'polished');A.equal(p.weeksTotal,oldWeeks+3);
 E.advance(s,2);const rec=E.reviewSerialArc(s,p.id,'tighten');A.equal(rec.choice,'tighten');
 A.throws(()=>E.reviewSerialArc(s,p.id,'expand'),/active mid|team handles|arc/i);
 for(let i=0;i<70&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');A(p.serialArcDecisions.length===1);A.deepEqual(E.audit(s),[]);
 return {weeks:oldWeeks,finishedWeeks:p.weeksTotal,arcs:p.serialArcDecisions.length};
});
test('creator-approved manuscript forbids unauthorized creative redirection after a legally scoped adaptation starts',()=>{
 const s=make('editorial-veto-47'),m=E.manuscriptMarket(s)[0];const o=E.negotiateManuscript(s,m.id,{approvalRequired:true});const grant=E.answerManuscript(s,o.id,true);
 const approval=E.requestManuscriptApproval(s,grant.id,{title:m.title,genre:m.genre});
 const p=E.createProject(s,{sector:'publishing',route:'adaptation',ipId:grant.ipId,title:m.title,genre:m.genre,approvalId:approval.id,size:.55});
 A.equal(p.grantId,grant.id);A.throws(()=>E.editorialDecision(s,p.id,'development'),/creator|approval/i);
 A.equal(s.ips.find(x=>x.id===m.ipId).ownerId,m.ownerId);
 A.deepEqual(E.audit(s),[]);return {legalOwner:m.ownerId,licenseHolder:grant.holderId};
});
console.log('Update47 editorial '+n+'/4');if(n!==4)process.exitCode=1;
