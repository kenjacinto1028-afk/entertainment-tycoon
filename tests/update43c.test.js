'use strict';
const assert=require('node:assert/strict'),E=require('../dist/engine.js');let n=0;
function check(label,fn){try{fn();console.log('PASS',label);n++;}catch(e){console.error('FAIL',label,e);process.exitCode=1;}}
check('Scoped rights authorize only contracted territory and preserve creator identity',()=>{
 const s=E.createGame({era:25,seed:'right43',origin:'publisher',aiCount:12});
 const ip=E.createProject(s,{title:'Avid Sky',route:'original',sector:'publishing',genre:'Fantasy',size:.7}).ipId;
 const holder=s.companies.find(c=>c.id!==s.playerId&&c.capabilities.movie&&c.finance.cash>8000);
 const g=E.grantRightsPackage43(s,{ipId:ip,holderId:holder.id,media:'movie',territories:['North Coast'],exclusive:true,fee:1500});
 assert.deepEqual(E.rightsPackageReport43(s,ip).filter(x=>x.id===g.id)[0].regions,['North Coast']);
 assert.equal(E.canUseIp(s,holder,ip,'movie',s.week,'North Coast').ok,true);
 assert.equal(E.canUseIp(s,holder,ip,'movie',s.week,'Central Reach').ok,false);
 assert.equal(E.canUseIp(s,E.player(s),ip,'movie',s.week,'North Coast').ok,false);
 assert.equal(E.canUseIp(s,E.player(s),ip,'movie',s.week,'Central Reach').ok,true);
 assert.equal(E.audit(s).length,0);
});
check('Independent overlaps rejected, disjoint exclusive licensed territory permitted',()=>{
 const s=E.createGame({era:25,seed:'rights2',origin:'publisher',aiCount:12});const ip=E.createProject(s,{title:'Work of Sea',route:'original',sector:'publishing',genre:'Fantasy',size:.7}).ipId;
 const rivals=s.companies.filter(c=>c.id!==s.playerId&&c.finance.cash>10000);
 E.grantRightsPackage43(s,{ipId:ip,holderId:rivals[0].id,media:'movie',territories:['North Coast'],exclusive:true});
 assert.throws(()=>E.grantRightsPackage43(s,{ipId:ip,holderId:rivals[1].id,media:'movie',territories:['North Coast'],exclusive:true}),/overlapping exclusive rights/i);
 E.grantRightsPackage43(s,{ipId:ip,holderId:rivals[1].id,media:'movie',territories:['Central Reach'],exclusive:true});assert.equal(E.audit(s).length,0);
});
check('Funded game publisher transfer keeps IP, prepaid and deferred entries balanced',()=>{
 const s=E.createGame({era:25,seed:'publisher43',origin:'games',aiCount:12});
 const p=E.createProject(s,{title:'Tidal Arcade',route:'original',sector:'games',genre:'Fantasy',size:.7});
 const pub=s.companies.find(c=>!c.isPlayer&&c.capabilities.games&&E.gamePublisherQuote43(s,p.id,c.id).willAccept);
 const own=E.player(s),pre=pub.finance.cash,was=own.finance.cash,q=E.gamePublisherQuote43(s,p.id,pub.id);
 const d=E.signGamePublisher43(s,p.id,pub.id);
 assert.equal(pub.finance.cash,pre-q.advance);assert.equal(own.finance.cash,was+q.advance);
 assert.equal(own.finance.deferred,q.advance);assert.equal(pub.finance.prepaid,q.advance);
 assert.equal(s.ips.find(x=>x.id===p.ipId).ownerId,s.playerId);
 assert.equal(E.audit(s).length,0);assert.equal(d.status,'active');
});
check('Publisher delivery recognizes earned cash only once; live share payable',()=>{
 const s=E.createGame({era:25,seed:'publong43',origin:'games',aiCount:12});
 const p=E.createProject(s,{title:'Tidal Arcade',route:'original',sector:'games',genre:'Fantasy',size:.7});
 const pub=s.companies.find(c=>!c.isPlayer&&c.capabilities.games&&E.gamePublisherQuote43(s,p.id,c.id).willAccept);
 const deal=E.signGamePublisher43(s,p.id,pub.id),advance=deal.advance;
 for(let i=0;i<65;i++)E.advance(s,1);
 assert.equal(p.status,'released');assert.equal(deal.status,'delivered');assert.equal(deal.paidAdvance,true);
 assert.equal(s.gamePublisherDeals43.length,1);assert.equal(deal.royaltyAccrued,Number((deal.royaltyPaid+deal.royaltyOpen).toFixed(2)));
 assert(deal.royaltyAccrued>0,'publisher should share external consumer receipts');
 assert.equal(E.audit(s).length,0);assert.equal(E.audit(E.loadState(JSON.stringify(s))).length,0);
});
check('Game publisher cancellation preserves unpaid refund obligations',()=>{
 const s=E.createGame({era:25,seed:'pubcancel43',origin:'games',aiCount:12});
 const p=E.createProject(s,{title:'Cancel Arcade',route:'original',sector:'games',genre:'Fantasy',size:.7});
 const pub=s.companies.find(c=>!c.isPlayer&&c.capabilities.games&&E.gamePublisherQuote43(s,p.id,c.id).willAccept);
 const d=E.signGamePublisher43(s,p.id,pub.id);
 p.status='cancelled'; E.advance(s,1);
 assert.equal(d.status,'cancelled');assert.equal(E.audit(s).length,0);
});
check('Technology transfer actually pays a funded independent seller and preserves history',()=>{
 const s=E.createGame({era:25,seed:'tech43',origin:'games',aiCount:12}),buyer=E.player(s);
 const seller=s.companies.find(c=>!c.isPlayer&&c.capabilities.games&&c.finance.cash>12000);
 seller.aiPlan={goal:'technology'};
 // Seller research must be paid for through its actual company account.
 // Normally it occurs on world year boundaries; here the test invokes it there.
 const prior=seller.finance.cash;E.rivalResearch43(s);assert(seller.finance.cash<prior);
 const old=seller.research.games;
 const preBuyer=buyer.finance.cash,preSeller=seller.finance.cash;
 const offer=E.technologyOffer43(s,seller.id,'games');assert.equal(offer.status,'accepted');
 const trade=E.acquireTechnology43(s,offer.id);
 assert.equal(buyer.finance.cash,preBuyer-offer.price);assert.equal(seller.finance.cash,preSeller+offer.price);
 assert.equal(buyer.research.games.level,old.level);assert.equal(seller.research.games.level,0);
 assert(trade.price>0);assert.equal(E.audit(s).length,0);
});
check('No sector-before-debut right or technology trade; versioned save intact',()=>{
 const s=E.createGame({era:1,seed:'premature43',origin:'publisher'}),p=E.createProject(s,{title:'History',sector:'publishing',route:'original'});
 assert.throws(()=>E.grantRightsPackage43(s,{ipId:p.ipId,holderId:s.companies[1].id,media:'movie'}),/sector debut/);
 assert.throws(()=>E.technologyOffer43(s,s.companies[1].id,'games'),/debuted sector/);
 assert.equal(E.loadState(JSON.stringify(s)).version,E.SAVE_VERSION);
 assert.equal(E.audit(s).length,0);
});
console.log(`UPDATE43C ${n}/7`);if(n!==7)process.exitCode=1;
