'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let passed=0;
function test(name,fn){try{let x=fn();console.log('PASS',name,JSON.stringify(x||{}));passed++}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1}}
const audit=s=>{A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032)};
function world(seed){return E.createGame({era:25,origin:'games',seed,startingCapital:'funded',aiCount:7,regionCount:2})}
test('18 games: design, funded proprietary vs licensed tool decisions, ongoing engine maintenance',()=>{
 const s=world('update48-engine'),p=E.createProject(s,{sector:'games',route:'original',title:'Invented Worlds',size:.6}),q=E.createProject(s,{sector:'games',route:'original',title:'Licensed Worlds',size:.6});
 const cash=E.player(s).finance.cash;E.gameDesign(s,p.id,{mechanic:'strategy',platform:'console',scope:'ambitious'});A(p.videoGame.generation>=1);A(p.weeksTotal>q.weeksTotal);
 A.throws(()=>E.gameChooseEngine(s,p.id,'proprietary'),/not funded/i);
 const engine=E.gameBuildEngine(s);A(engine.maintenance>0);E.gameChooseEngine(s,p.id,'proprietary');E.gamePrototype(s,p.id,'technical');E.gameChooseEngine(s,q.id,'licensed');
 A(p.videoGame.engineFee<q.videoGame.engineFee);A(E.player(s).finance.cash<cash);for(let i=0;i<8;i++)E.advance(s,1);
 A(E.player(s).gameEngine.version===1);A(E.player(s).filmBacklot===null);audit(s);
 return {engineInvestment:19000,maintenance:engine.maintenance,proprietaryFee:p.videoGame.engineFee,licensedFee:q.videoGame.engineFee};
});
test('18 games: failed regional cert never authorizes launch; paid QA enables later certification',()=>{
 const s=world('update48-cert'),p=E.createProject(s,{sector:'games',route:'original',title:'Certification Gate',size:.7});E.gameDesign(s,p.id,{mechanic:'action',platform:'pc',scope:'ambitious'});
 for(let i=0;i<75&&p.weeksDone/p.weeksTotal<.65;i++)E.advance(s,1);
 A.equal(p.status,'active');const failed=E.gameCertify(s,p.id,'North Coast');A.equal(failed.passed,false,'deliberately buggy game should fail certification');
 // It must remain held even after the development progress bar reaches 100%.
 for(let i=0;i<55&&p.weeksDone<p.weeksTotal;i++)E.advance(s,1);A.equal(p.status,'active');A.equal(p.stats.totalSales,0);
 E.gameQA(s,p.id,'intensive');E.gameQA(s,p.id,'intensive');A(p.videoGame.bugs<=22);
 const ok=E.gameCertify(s,p.id,'North Coast');A.equal(ok.passed,true);
 for(let i=0;i<85&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');A.deepEqual(p.videoGame.launchRegions,['North Coast']);
 for(let i=0;i<5;i++)E.advance(s,1);A((p.videoGame.regionalGross['North Coast']||0)>0);A.equal(p.videoGame.regionalGross['Central Reach']||0,0);audit(s);
 return {failedInitially:failed.passed,certified:p.videoGame.launchRegions,gross:p.stats.totalSales};
});
test('19 games: platform debut gates, paid community/esports/patch/DLC and evolving monetization',()=>{
 const s=E.createGame({era:10,origin:'games',seed:'update48-game-clock',startingCapital:'funded'}),p=E.createProject(s,{sector:'games',route:'original',title:'Generations',size:.65});
 A.throws(()=>E.gameDesign(s,p.id,{platform:'mobile'}),/not appeared/i);A.throws(()=>E.gameSetModel(s,p.id,'free-to-play'),/not yet supported/i);
 E.gameDesign(s,p.id,{mechanic:'strategy',platform:'pc',scope:'focused'});A.equal(p.videoGame.generation,1);E.gamePrototype(s,p.id,'creative');
 for(let i=0;i<90&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 const before=p.videoGame.bugs;E.gameCommunity(s,p.id,'community');E.gameSupport(s,p.id,'patch');A(p.videoGame.bugs<before);E.gameSupport(s,p.id,'dlc');A(p.videoGame.dlc.length===1);
 E.gameCommunity(s,p.id,'esports');A(p.videoGame.communityActions.some(x=>x.kind==='esports'));audit(s);
 return {platform:p.videoGame.platform,bugs:p.videoGame.bugs,esports:p.videoGame.communityActions.length};
});
test('19 games: independent store exclusive has funded term and no longer blocks after expiry',()=>{
 const s=E.createGame({era:25,origin:'games',seed:'exclusive-2',startingCapital:'funded',aiCount:12,regionCount:2}),rival=s.companies.find(c=>!c.isPlayer&&c.capabilities.games&&c.finance.cash>14000);A(rival);
 const p=E.createProject(s,{companyId:rival.id,sector:'games',route:'original',title:'Exclusive Concept',size:.6});
 for(let i=0;i<80&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 const st=E.openGameStore(s,{name:'Exclusive Games'}),offer=E.gameStoreOffer(s,st.id,p.id,10000);A.equal(offer.status,'accepted');E.gameListStore(s,st.id,p.id,offer.id);
 const exclusive=E.gameOfferExclusive(s,st.id,p.id,20000,26);A.equal(exclusive.status,'accepted');const before=rival.finance.cash;
 const deal=E.gameBookExclusive(s,exclusive.id);A.equal(deal.grant,20000);A(rival.finance.cash>before);A.equal(p.videoGame.exclusiveStoreId,st.id);
 for(let i=0;i<27;i++)E.advance(s,1);A(s.week>=deal.endWeek);A(!s.gameExclusiveOffers.some(x=>x.status==='booked'&&x.acceptedGrant<=0));audit(s);
 return {grant:deal.grant,week:s.week,expires:deal.endWeek};
});
console.log(`UPDATE48 GAMES ${passed}/4`);if(passed!==4)process.exitCode=1;
