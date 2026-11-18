'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
const init=(seed)=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8,depth:'veryComplex'});
const check=s=>{A.deepEqual(E.audit(s),[]);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);};
test('ordinary startup needs no board, can remain private and cannot fake shareholder decisions',()=>{
 const s=E.createGame({seed:'founder-no-board46'}),c=E.player(s),initial=E.corporateStatus(s);
 A.equal(initial.stage,'founder');A.equal(initial.board,null);A.throws(()=>E.boardVote(s,'expansion',5000),/incorporat|corporation/i);
 A.throws(()=>E.launchIPO(s,0.15),/incorporat|corporation/i);A.equal(c.corporate.stage,'founder');check(s);
 return {stage:c.corporate.stage,board:c.corporate.board};
});
test('corporation readiness creates board, rejects disproportionate spending without approving the cash',()=>{
 const s=init('corp-vote46'),c=E.player(s),before=E.corporateReadiness(s);A(before.eligible);
 E.incorporateStudio(s);A.equal(E.corporateStatus(s).stage,'private-corporation');A.equal(E.corporateStatus(s).board.length,3);
 const rejected=E.boardVote(s,'expansion',950000);A(!rejected.approved);A.equal(rejected.votes.filter(v=>v.vote==='yes').length,1);
 const cash=c.finance.cash;A.equal(E.corporateRisk(s).warning,false);A.deepEqual(E.audit(s),[]);
 A.throws(()=>E.borrowLoan(s,20000),/authorization/i);A.equal(c.finance.cash,cash);
 const approved=E.boardVote(s,'financing',20000);A(approved.approved);const loan=E.borrowLoan(s,20000);A.equal(c.finance.cash,cash+20000);A.equal(loan.originalPrincipal,20000);
 A(c.corporate.resolutions.find(r=>r.id===approved.id).used);check(s);return {rejected:rejected.votes.map(v=>v.vote),loan:loan.originalPrincipal};
});
test('IPO is optional and separate; external capital and founder personal share proceeds never count as sales',()=>{
 const s=init('ipo-safety46'),c=E.player(s),p=E.createProject(s,{title:'Corporate owned original',sector:'publishing',route:'original',size:.65});
 const owner=s.ips.find(i=>i.id===p.ipId).ownerId;E.incorporateStudio(s);const revenue=c.finance.revenue;
 const listing=E.launchIPO(s,0.15);A.equal(listing.stage,'public-corporation');A.equal(E.corporateStatus(s).stage,'public-corporation');
 A.equal(c.finance.revenue,revenue);A.equal(s.ips.find(i=>i.id===p.ipId).ownerId,owner);
 const money=c.finance.cash,founderMoney=s.founderFunds;const v=E.sellFounderShares(s,15);A(v.proceeds>0);
 A.equal(c.finance.cash,money);A.equal(c.finance.revenue,revenue);A(s.founderFunds>founderMoney);A.equal(s.ips.find(i=>i.id===p.ipId).ownerId,owner);
 A.throws(()=>E.launchIPO(s,0.15),/already/i);check(s);
 return {founderShare:E.corporateStatus(s).ownership.founderShare,personalProceeds:v.proceeds};
});
test('corporate successor receives management role without acquiring founder shares or IP',()=>{
 const s=init('corp-succ46');E.incorporateStudio(s);
 const p=E.createProject(s,{sector:'publishing',route:'original',title:'Continuity Story',size:.65});const oldOwner=s.ips.find(i=>i.id===p.ipId).ownerId,shares=JSON.stringify(E.corporateStatus(s).ownership);
 const candidate=s.employees.find(e=>e.employerId===s.playerId&&e.status==='employed');A(candidate);
 E.planLeadership(s,candidate.id);E.stepDown(s);E.chooseLeader(s,candidate.id);
 A.equal(s.management.personId,candidate.id);A.equal(s.management.status,'active');A.equal(JSON.stringify(E.corporateStatus(s).ownership),shares);
 A.equal(s.ips.find(i=>i.id===p.ipId).ownerId,oldOwner);check(s);
 return {appointed:candidate.id,legalIPowner:oldOwner};
});
console.log(`Update46 governance ${n}/4`);if(n!==4)process.exitCode=1;
