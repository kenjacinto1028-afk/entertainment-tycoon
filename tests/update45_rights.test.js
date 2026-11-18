'use strict';
const A=require('node:assert/strict'), E=require('../dist/engine.js');let n=0;
function check(title,fn){try{const result=fn();n++;console.log('PASS',title,JSON.stringify(result||{}));}catch(error){console.error('FAIL',title,error.stack);process.exitCode=1;}}
const checkAudit=(s)=>A.deepEqual(E.audit(s),[]);
function setup(seed='rights45'){
 const s=E.createGame({seed,era:25,origin:'games',startingCapital:'funded',aiCount:12,regionCount:4});
 const p=E.createProject(s,{title:'Rights Original',sector:'games',route:'original',size:.7});
 const rivals=s.companies.filter(c=>c.id!==s.playerId&&!c.bankrupt&&c.finance.cash>10000);
 return {s,p,rivals};
}
check('Exclusive grant blocks owner distribution only in its media and regions, and expires',()=>{
 const {s,p,rivals}=setup('licensed-original45');
 for(let n=0;n<50&&p.status==='active';n++)E.advance(s,1);
 A.equal(p.status,'released');const owner=E.player(s),before=owner.finance.cash;
 const g=E.grantRightsPackage43(s,{ipId:p.ipId,holderId:rivals[0].id,media:'games',territories:['North Coast'],weeks:13,fee:1800,exclusive:true,continuationWeeks:0});
 A.equal(owner.finance.cash,before+1800);A.equal(E.canDistribute43(s,p,'North Coast'),false);
 A.equal(E.canDistribute43(s,p,'Central Reach'),true);
 A.equal(E.canUseIp(s,owner,p.ipId,'games',s.week,'North Coast').ok,false);
 A.equal(E.canUseIp(s,owner,p.ipId,'games',s.week,'Central Reach').ok,true);
 A.equal(E.canDistribute43(s,p,'North Coast',g.endWeek),true);
 checkAudit(s);checkAudit(E.loadState(JSON.stringify(s)));
 return {sourceOwner:owner.id,holder:g.holderId};
});
check('Exclusive grant cannot strand already active same-medium production',()=>{
 const {s,p,rivals}=setup('active-licensed45');
 const initial=p.weeksDone;A.throws(()=>E.grantRightsPackage43(s,{ipId:p.ipId,holderId:rivals[0].id,media:'games',exclusive:true,fee:1500}),/active productions/i);
 A.equal(p.weeksDone,initial);checkAudit(s);
});
check('Creative approval veto remains binding for scoped adaptation',()=>{
 const {s,p,rivals}=setup('veto45');const holder=rivals.find(x=>x.capabilities.games);
 const g=E.grantRightsPackage43(s,{ipId:p.ipId,holderId:holder.id,media:'games',exclusive:false,approvalRequired:true,territories:['Central Reach'],weeks:52,fee:1500});
 A.throws(()=>E.createProject(s,{companyId:holder.id,sector:'games',route:'adaptation',ipId:p.ipId,title:'Blocked Adaptation',releaseTerritories:['Central Reach']}),/approval/i);
 const approval=E.requestCreativeApproval(s,g.id,{title:'Approved Adaptation',genre:'Fantasy'});
 E.decideCreativeApproval(s,approval.id,false);
 A.throws(()=>E.createProject(s,{companyId:holder.id,sector:'games',route:'adaptation',ipId:p.ipId,title:'Approved Adaptation',approvalId:approval.id,releaseTerritories:['Central Reach']}),/approval/i);
 checkAudit(s);
 return {veto:approval.id};
});
check('Sublicensing cannot widen geography and requires parent permission',()=>{
 const {s,rivals}=setup('sub45');
 const owner=rivals.find(x=>x.capabilities.games),ipProject=E.createProject(s,{companyId:owner.id,sector:'games',route:'original',title:'Other Studio IP',size:.7});
 const p=E.player(s),to=rivals.find(x=>x.id!==owner.id&&x.finance.cash>15000);
 const g=E.grantRightsPackage43(s,{ipId:ipProject.ipId,holderId:p.id,media:'games',territories:['North Coast'],weeks:52,fee:1500,sublicensable:true});
 A.throws(()=>E.grantRightsPackage43(s,{ipId:ipProject.ipId,holderId:to.id,media:'games',parentGrantId:g.id,territories:['Central Reach'],weeks:13,fee:1200}),/territories|title|sublicense/i);
 const sub=E.grantRightsPackage43(s,{ipId:ipProject.ipId,holderId:to.id,media:'games',parentGrantId:g.id,territories:['North Coast'],weeks:13,fee:1200});
 A.equal(sub.parentGrantId,g.id);A.equal(E.canUseIp(s,to,ipProject.ipId,'games',s.week,'North Coast').ok,true);
 A.equal(E.canUseIp(s,to,ipProject.ipId,'games',s.week,'Central Reach').ok,false);checkAudit(s);
 return {sub:sub.id};
});
check('Sublicense renewal requires consent and cannot run beyond parent end date',()=>{
 const {s,rivals}=setup('sub-renew45'),original=E.player(s);
 const seller=rivals.find(c=>c.capabilities.games);A(seller);
 const source=E.createProject(s,{companyId:seller.id,sector:'games',route:'original',title:'Original Independent'});
 const parent=E.grantRightsPackage43(s,{ipId:source.ipId,holderId:original.id,media:'games',territories:['North Coast'],weeks:104,fee:1500,sublicensable:true});
 const child=E.grantRightsPackage43(s,{ipId:source.ipId,holderId:rivals.find(c=>c.id!==seller.id).id,media:'games',territories:['North Coast'],weeks:13,fee:1200,parentGrantId:parent.id});
 const initial=child.endWeek,ownerIncome=s.ips.find(i=>i.id===source.ipId).rightsIncome;
 const result=E.offerRenewal(s,child.id,{fee:1300,extensionWeeks:52});
 A.equal(result.status,'accepted');A.equal(child.endWeek,initial+52);
 A.equal(s.ips.find(i=>i.id===source.ipId).rightsIncome,ownerIncome,'Third-party sublicense revenue must not be falsely credited to underlying owner');
 A.throws(()=>E.offerRenewal(s,child.id,{fee:1300,extensionWeeks:52}),/parties|fund|rights|term/i);
 A.equal(child.endWeek,initial+52);checkAudit(s);return {parentExpiry:parent.endWeek,childExpiry:child.endWeek};
});
check('Contested renewal does not extend a rights window without mutual acceptance',()=>{
 const {s,p,rivals}=setup('renegotiate45');
 const g=E.grantRightsPackage43(s,{ipId:p.ipId,holderId:rivals[0].id,media:'movie',territories:['North Coast'],weeks:52,fee:1200});
 const before=g.endWeek,offer=E.offerRenewal(s,g.id,{fee:100000,extensionWeeks:52});
 A.equal(offer.status,'counter');A.equal(g.endWeek,before);
 E.answerRightsOffer(s,offer.id,false);A.equal(g.endWeek,before);checkAudit(s);
 return {expires:before};
});
console.log(`UPDATE45 RIGHTS ${n}/6 checks`);if(n!==6)process.exitCode=1;
