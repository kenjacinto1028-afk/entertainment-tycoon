'use strict'; const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{const r=fn();console.log('PASS',name,JSON.stringify(r||{}));n++;}catch(e){console.log('FAIL',name,e.stack);process.exitCode=1;}}
test('real TV release supports funded streaming growth, price change, expiry and subscriber loss',()=>{
 const s=E.createGame({seed:'churn46',era:25,origin:'tv',startingCapital:'funded',regionCount:3,aiCount:8});
 const p=E.createProject(s,{sector:'tv',route:'original',title:'A Brief Streaming Exclusive',size:.65});
 for(let i=0;i<55&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 const svc=E.launchStreamingService(s,{name:'Rights Window TV',tier:'standard'});const window=E.licenseStreamingTitle(s,svc.id,p.id,13);A.equal(window.fee,0);
 const grossBefore=svc.grossReceipts;
 for(let i=0;i<6;i++)E.advance(s,1);
 const maxSubs=Math.max(...Object.values(svc.regions).map(r=>r.subscribers));A(maxSubs>0);A(svc.grossReceipts>grossBefore);A(E.streamingCatalog(s,svc.id).length===1);
 const oldPrice=svc.price;E.setStreamingTier(s,svc.id,'premium');A.notEqual(svc.price,oldPrice);
 for(let i=0;i<15;i++)E.advance(s,1);
 A.equal(E.streamingCatalog(s,svc.id).length,0);A(Object.values(svc.regions).every(r=>r.subscribers<maxSubs));A(Object.values(svc.regions).some(r=>r.churned>0));
 for(let i=0;i<70;i++)E.advance(s,1);A(Object.values(svc.regions).every(r=>r.subscribers===0),"Subscribers should fully exit a service with no catalog after sufficient time");
 A.throws(()=>E.licenseStreamingTitle(s,svc.id,p.id,12),/13/);A.deepEqual(E.audit(s),[]);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
 return {maxSubs,gross:svc.grossReceipts,churn:Object.values(svc.regions).reduce((sum,r)=>sum+r.churned,0)};
});
test('streaming cannot debut early, grant unauthorized third party title or charge subscribers twice',()=>{
 const s=E.createGame({seed:'stream-before46',era:10,origin:'tv',startingCapital:'funded'});
 A(!E.streamingReady(s));A.throws(()=>E.launchStreamingService(s),/technology|later/i);
 const mature=E.createGame({seed:'stream-contract46',era:25,origin:'tv',startingCapital:'funded',aiCount:10});
 const service=E.launchStreamingService(mature,{name:'Paid Rights'});
 const outsider=mature.companies.find(c=>c.id!==mature.playerId&&c.capabilities.tv&&!c.bankrupt);A(outsider);
 const proj=E.createProject(mature,{companyId:outsider.id,sector:'tv',route:'original',title:'Real External Season',size:.65});
 for(let i=0;i<60&&proj.status==='active';i++)E.advance(mature,1);A.equal(proj.status,'released');
 A.throws(()=>E.licenseStreamingTitle(mature,service.id,proj.id,52),/willing|owner|offer/i);
 const offer=E.requestStreamingLicense(mature,service.id,proj.id,52,200);A.equal(offer.status,'counter');
 E.answerStreamingLicense(mature,offer.id,true);const win=E.licenseStreamingTitle(mature,service.id,proj.id,52,offer.id);
 A(win.fee>0);A.throws(()=>E.licenseStreamingTitle(mature,service.id,proj.id,52,offer.id),/already/);
 A.deepEqual(E.audit(mature),[]);return {paidFee:win.fee,title:proj.title};
});
console.log(`Update46 streaming ${n}/2`);if(n!==2)process.exitCode=1;
