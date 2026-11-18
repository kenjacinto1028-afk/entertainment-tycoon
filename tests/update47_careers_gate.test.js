'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(label,fn){try{console.log('PASS',label,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const make=x=>E.createGame({seed:x,era:25,origin:'established',startingCapital:'funded',aiCount:7});
test('named leader recruitment and dismissal preserves stable identity and real cash payments',()=>{
 const s=make('careers-47-a'),c=E.player(s),old=c.teams[0].leaderId,start=c.finance.cash;
 E.configureStaffDelegation(s,{autoFill:false,maxSalary:190});
 E.releaseEmployee(s,old);A.equal(c.teams[0].leaderId,null);A(c.finance.cash<start);
 for(let k=0;k<16;k++)E.advance(s,1);A.equal(c.teams[0].leaderId,null,'opted-out manager retains vacancy');
 const candidate=E.candidatePool(s)[0],newLead=E.hireCandidate(s,candidate.id,c.teams[0].id);
 A.equal(newLead.id,c.teams[0].leaderId);A.notEqual(old,newLead.id);A.equal(s.employees.find(e=>e.id===old).status,'departed');
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);return {retiredId:old,newLead:newLead.id};
});
test('mentorship and consensual renewal change future team performance and paid salary',()=>{
 const s=make('careers-47-b'),c=E.player(s),t=c.teams[0],e=s.employees.find(x=>x.id===t.leaderId);
 const oldSkill=t.skill,oldCash=c.finance.cash,oldEnd=e.contractEndWeek;
 E.trainTeam(s,t.id,'mentorship');A.equal(t.skill,oldSkill+3);A(c.finance.cash<oldCash);
 E.renewEmployee(s,e.id,e.weeklySalary+10);A(e.contractEndWeek>=oldEnd);A(e.weeklySalary>0);
 const p=E.createProject(s,{sector:'publishing',route:'original',title:'Team Leader Work',size:.55,teamId:t.id});
 for(let i=0;i<60&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');A(s.employees.find(x=>x.id===e.id).completed>=1);A(E.teamPerformance(s,t.id).trackedProjects>=1);
 A.deepEqual(E.audit(s),[]);return {mentorSkill:t.skill,leadCompleted:e.completed,weeklySalary:e.weeklySalary};
});
test('culture impacts annual morale and exits while keeping payroll and team identity coherent',()=>{
 const supporting=make('careers-culture'),leaning=make('careers-culture');
 E.setCompanyCulture(supporting,'supportive');E.setCompanyCulture(leaning,'lean');
 const before=supporting.employees.find(e=>e.employerId===supporting.playerId).id;
 for(let i=0;i<53;i++){E.advance(supporting,1);E.advance(leaning,1);}
 const positive=supporting.employees.find(e=>e.id===before),negative=leaning.employees.find(e=>e.id===before);
 A(positive.morale>negative.morale);A.deepEqual(E.audit(supporting),[]);A.deepEqual(E.audit(leaning),[]);
 return {supportiveMorale:positive.morale,leanMorale:negative.morale};
});
test('aging, director appointment and retirement do not conjure shares or studio-owned IP',()=>{
 const s=E.createGame({seed:'careers-succession',era:25,origin:'established',age:69,startingCapital:'funded'}),c=E.player(s);
 const p=E.createProject(s,{sector:'publishing',route:'original',title:'Ownership stays with legal entity',size:.55});
 for(let i=0;i<40&&p.status==='active';i++)E.advance(s,1);
 const ip=s.ips.find(x=>x.id===p.ipId),owner=ip.ownerId,founderShares=c.corporate.shares.founder;
 E.planLeadership(s,s.employees.find(x=>x.employerId===c.id).id);
 for(let i=0;i<55;i++)E.advance(s,1);
 A(s.founder.age>=70);A.equal(ip.ownerId,owner);A.equal(c.corporate.shares.founder,founderShares);
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);return {founderAge:s.founder.age,studioOwner:owner};
});
console.log('Update47 careers '+n+'/4');if(n!==4)process.exitCode=1;
