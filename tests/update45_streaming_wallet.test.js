'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');
// Independent companies are given player-facing operator privileges only while
// signing their own funded title + service setup; the test returns original
// executive control immediately. No synthetic money or catalog title is added.
const s=E.createGame({seed:'stream-four45',era:25,origin:'tv',startingCapital:'funded',aiCount:12,regionCount:2});
const original=s.playerId, firms=[E.player(s),...s.companies.filter(x=>!x.isPlayer&&x.capabilities.tv).sort((a,b)=>b.finance.cash-a.finance.cash).slice(0,3)];
A(firms.length>=3);
const ps=firms.map((c,i)=>E.createProject(s,{sector:'tv',companyId:c.id,route:'original',title:'Funded Streaming '+i,size:.7}));
for(let i=0;i<60;i++)E.advance(s,1);
for(let i=0;i<firms.length;i++){
 s.playerId=firms[i].id;
 const service=E.launchStreamingService(s,{name:'Service '+i}); E.licenseStreamingTitle(s,service.id,ps[i].id,52);
}
s.playerId=original;
let peak=0,checks=0;
for(let i=0;i<40;i++){
 E.advance(s,1);
 for(const region of E.activeRegions(s)){
  const budget=E.worldMarketBudget(s,'tv',region.name),reserved=s.streamingWeeklyReserved[region.name]||0;
  const fraction=reserved/Math.max(1,budget*.22);peak=Math.max(peak,fraction);checks++;
  A(reserved<=budget*.22+.06,`Service receipts exceeded 22% TV subscription budget: ${region.name} week ${s.week}, ${reserved} > ${budget*.22}`);
 }
 A.deepEqual(E.audit(s),[]);
}
A(s.streamingServices.length>=3);A(peak>0.60,'Test must exercise meaningfully full subscriber wallets');
const resumed=E.loadState(JSON.stringify(s));A.deepEqual(E.audit(resumed),[]);
console.log(`PASS ${s.streamingServices.length} independent funded services share TV subscription budget across ${checks} region-weeks; peak ${peak.toFixed(3)}; save v${resumed.version}`);
