'use strict';
const assert=require('node:assert/strict'), E=require('../dist/engine.js');
let count=0;
function check(name,fn){fn();console.log('PASS',name);count++;}
check('Legacy version 32 migrates to v33 without changing cash or IP ownership',()=>{
 const fresh=E.createGame({seed:'migrate44',era:25,origin:'games'}),copy=JSON.parse(JSON.stringify(fresh));
 copy.version=32;delete copy.hardening44;delete copy.debutFundings44;
 for(const c of copy.companies)delete c.operating44;
 const cash=copy.companies.map(x=>x.finance.cash),ownership=copy.ips.map(x=>[x.id,x.ownerId]);
 const s=E.loadState(JSON.stringify(copy));
 assert.equal(s.version,E.SAVE_VERSION);assert.deepEqual(s.companies.map(x=>x.finance.cash),cash);
 assert.deepEqual(s.ips.map(x=>[x.id,x.ownerId]),ownership);assert.deepEqual(E.audit(s),[]);
});
check('Founder-manager may step down and hire a lawful replacement without asset transfer',()=>{
 const s=E.createGame({seed:'legal-succession-44',era:25,origin:'games'}),c=E.player(s);
 const originalIP=E.createProject(s,{title:'Succession Archive',sector:'games',route:'original',genre:'Fantasy',size:.5}).ipId;
 const employee=s.employees.find(e=>e.employerId===c.id&&e.status==='employed');
 const shares=JSON.stringify(E.corporateStatus(s).ownership),cash=c.finance.cash,originalCompany=c.id;
 const nomination=E.planLeadership(s,employee.id);assert.equal(nomination.nomineeId,employee.id);
 E.stepDown(s);assert.equal(s.management.status,'transition');
 assert.throws(()=>E.setManagement43(s,{scope:'corporate',mode:'manual'}),/authority/);
 E.chooseLeader(s,employee.id);assert.equal(s.management.status,'active');
 assert.equal(s.management.personId,employee.id);assert.equal(E.player(s).id,originalCompany);
 assert.equal(s.ips.find(i=>i.id===originalIP).ownerId,c.id);
 assert.equal(JSON.stringify(E.corporateStatus(s).ownership),shares);assert.equal(c.finance.cash,cash);
 assert.deepEqual(E.audit(s),[]);
});
check('Eligibility rejects unrelated staff and unpaid/new-company asset grabs',()=>{
 const s=E.createGame({seed:'no-magic-succession-44',era:1});const owner=E.player(s),before=owner.finance.cash;
 E.stepDown(s);assert.throws(()=>E.chooseLeader(s,'fictional-person'),/eligible/);
 assert.throws(()=>E.startFreshCompany(s,{name:'Stolen Assets LLC',capital:100000,sector:'publishing'}),/funds/);
 assert.equal(owner.finance.cash,before);assert.deepEqual(E.audit(s),[]);
});
check('Mid-game movie/TV/game entrants draw finite entrepreneur funds',()=>{
 const s=E.createGame({seed:'finite-debuts44',era:1,aiCount:3,regionCount:2});
 const initial=s.entrepreneurPool;const companies=s.companies.length;
 for(let i=0;i<52*10;i++)E.advance(s,1);
 assert(s.companies.length>=companies);
 const entries=s.debutFundings44;
 assert(entries.length>0,'At least one new industry firm should be financed');
 const spent=entries.reduce((n,r)=>n+r.capital,0);
 assert(Math.abs(spent-s.hardening44.debutCommitted)<.05);
 assert(s.entrepreneurPool<=initial-spent+.05,'Cannot mint sector debut startup capital');
 assert(entries.every(r=>E.yearAt(r.week)>=E.SECTORS[r.sector].year));
 assert.deepEqual(E.audit(s),[]);
});
check('Unfunded labor suspends production without erasing payroll debt',()=>{
 const s=E.createGame({seed:'furlough44',era:25,origin:'games',startingCapital:'lean',aiCount:2,regionCount:2}),c=E.player(s);
 const p=E.createProject(s,{title:'Unfunded Blockbuster',sector:'games',route:'original',size:2,genre:'Fantasy'});
 for(let n=0;n<600&&!c.operating44.furloughed;n++)E.advance(s,1);
 assert.equal(c.operating44.furloughed,true,'Insufficient liquidity should suspend work rather than generating unlimited unpaid production');
 const work=p.weeksDone,priorPayable=c.finance.payable,week=s.week;
 for(let n=0;n<8;n++)E.advance(s,1);
 assert.equal(p.weeksDone,work,'Project cannot progress through unfunded teams');
 const payroll=s.ledger.filter(x=>x.week>week&&x.companyId===c.id&&x.kind==='payroll-overhead');
 assert.equal(payroll.length,0,'Furloughed weeks cannot accumulate endless new wages');
 assert(c.finance.payable>=priorPayable-.05,'Existing liabilities may not vanish');
 assert.deepEqual(E.audit(s),[]);
});
check('Tampering with finite founder capital is caught by integrity audit',()=>{
 const s=E.createGame({seed:'audit44',era:1});
 s.hardening44.debutCommitted=999999999;
 assert(E.audit(s).some(x=>x.includes('unfunded industry entrant')));
});
console.log(`UPDATE44A ${count}/6 focused checks passed`);
