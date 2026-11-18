
function gameDemandMultiplier(p,week,region){const g=p.videoGame;if(!g)return 1;
 if(!g.launchRegions?.includes(region)||week<p.releaseWeek||g.exclusiveStoreId&&g.exclusiveUntil>week&&g.storeId!==g.exclusiveStoreId)return 0;
 const technical=clamp(1-g.bugs/CFG.tuning_engine.technical__001,CFG.tuning_engine.technical__002,CFG.tuning_engine.technical__003),platformFit=g.platform==='pc'?1:g.platform==='mobile'?CFG.tuning_engine.platformFit__001:g.platform==='handheld'?CFG.tuning_engine.platformFit__002:CFG.tuning_engine.platformFit__003;
 return clamp(technical*platformFit*(1+g.community*CFG.tuning_engine.gameDemandMultiplier__001+g.dlc.length*CFG.tuning_engine.gameDemandMultiplier__002)*(g.model==='free-to-play'?CFG.tuning_engine.gameDemandMultiplier__003:1),0,CFG.tuning_engine.gameDemandMultiplier__004);}
function gameReadiness(s,projectId){const {p,g}=gameProject(s,projectId,false);return {phase:g.stages.at(-1)?.phase,
  estimate:g.beta?.estimatedAppeal??null,bugs:g.bugs,platform:g.platform,generation:g.generation,
  launchRegions:g.certification?.regions||[],criticScore:p.status==='released'?g.criticRating:null,userScore:p.status==='released'?g.userRating:null,
  sales:g.regionalGross,units:g.salesUnits,observedWeeks:g.weeklySales.slice(-CFG.tuning_engine.gameReadiness__001),historyComplete:g.historyComplete,
  note:'Technical defects, critics and players are tracked separately. Beta appeal is an estimate; sales and cash are observed.'};}
// Late-era digital distribution is a CONTRACTED SERVICE, not a fifth industry.
function openGameStore(s,{name='Arcade Exchange'}={}){requireExecutiveControl(s);const c=player(s);
 if(yearAt(s.week)<CFG.tuning_engine.openGameStore__001||!c.capabilities.games)throw new Error('Game storefronts require Year 19 and a game-company capability.');
 if(s.gameStores.some(x=>x.companyId===c.id))throw new Error('Your company already operates a storefront.');
 const cost=CFG.tuning_engine.cost__048;if(c.finance.cash<cost+CFG.tuning_engine.openGameStore__002)throw new Error('Funded store launch and cash reserve required.');
 expense(s,c,cost,'game-store-setup','Game distribution store launch');
 const store={id:id(s,'gamestore'),companyId:c.id,name:String(name||'Arcade Exchange').trim().slice(0,CFG.tuning_engine.store__001),startedWeek:s.week,active:true,monthlyCost:CFG.tuning_engine.store__002,
  subscribed:false,tier:CFG.tuning_engine.store__003,regionSubs:{},subscriptionGross:0,grossStoreFees:0,history:[],historyComplete:true};s.gameStores.push(store);return store;}
function gameStoreById(s,storeId){const store=s.gameStores.find(x=>x.id===storeId);if(!store||!store.active)throw new Error('Store unavailable.');return store;}
function gameStoreAvailable(s,p,store){return p?.sector==='games'&&p.status==='released'&&p.route!=='contract'&&
 gameDistributionAllowed(s,p,s.week)&&yearAt(s.week)>=CFG.tuning_engine.gameStoreAvailable__001&&(!p.videoGame?.exclusiveUntil||p.videoGame.exclusiveUntil<=s.week);}
function gameStoreOffer(s,storeId,projectId,fee=CFG.tuning_engine.gameStoreOffer__001){const store=gameStoreById(s,storeId),p=s.projects.find(x=>x.id===projectId),operator=company(s,store.companyId),owner=company(s,p?.companyId);
 if(!p||!owner||!operator||owner.id===operator.id||!gameStoreAvailable(s,p,store))throw new Error('Only independent, authorized completed games may be negotiated.');
 if(!Number.isFinite(fee)||fee<CFG.tuning_engine.gameStoreOffer__002||fee>CFG.tuning_engine.gameStoreOffer__003)throw new Error('Invalid fixed rights license fee.');
 if(s.gameStoreOffers.some(o=>o.storeId===storeId&&o.projectId===projectId&&['counter','accepted','booked'].includes(o.status)))throw new Error('Offer already exists.');
 const counter=money(Math.max(fee,Math.min(CFG.tuning_engine.counter__003,CFG.tuning_engine.counter__004+p.quality*CFG.tuning_engine.counter__005)));const row={id:id(s,'gamestoreoffer'),storeId,operatorId:operator.id,ownerId:owner.id,
  projectId,proposedFee:money(fee),counterFee:counter,acceptedFee:null,status:fee>=counter?'accepted':'counter',createdWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.row__010,windowId:null};
 if(row.status==='accepted')row.acceptedFee=row.proposedFee;s.gameStoreOffers.push(row);return row;}
function gameAnswerStoreOffer(s,offerId,accept){const o=s.gameStoreOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId);
 if(!o||o.status!=='counter'||s.week>o.expiresWeek||typeof accept!=='boolean')throw new Error('No valid pending store counteroffer.');
 o.status=accept?'accepted':'declined';if(accept)o.acceptedFee=o.counterFee;return o;}
function gameListStore(s,storeId,projectId,offerId=null){const store=gameStoreById(s,storeId),p=s.projects.find(x=>x.id===projectId),c=company(s,store.companyId);
 if(!p||!gameStoreAvailable(s,p,store)||!c||s.gameStoreWindows.some(w=>w.storeId===storeId&&w.projectId===projectId&&w.endWeek>s.week))throw new Error('Store title is unavailable or already listed.');
 const external=p.companyId!==c.id,o=external?s.gameStoreOffers.find(x=>x.id===offerId):null;
 if(external&&(!o||o.storeId!==storeId||o.projectId!==p.id||o.status!=='accepted'||s.week>o.expiresWeek||o.ownerId!==p.companyId))throw new Error('Independent owner must accept valid matching terms.');
 const fee=external?o.acceptedFee:0;if(c.finance.cash<fee+CFG.tuning_engine.gameListStore__001)throw new Error('Insufficient cash to book catalog rights.');
 if(fee){expense(s,c,fee,'game-store-license','Lawful fixed fee for '+p.title,p.id);revenue(s,company(s,p.companyId),fee,'game-store-license-income','Store license earned: '+p.title,p.id);}
 const window={id:id(s,'gamestorewindow'),storeId,projectId:p.id,ownerId:p.companyId,offerId:o?.id||null,fee,
  startWeek:s.week,endWeek:s.week+CFG.tuning_engine.window__001,share:CFG.tuning_engine.window__002,subscription:true,grantId:p.grantId||null};
 if(p.grantId){const grant=s.grants.find(g=>g.id===p.grantId);window.endWeek=Math.min(window.endWeek,grant.endWeek+(grant.continuationWeeks||0));}
 s.gameStoreWindows.push(window);if(external&&p.videoGame)p.videoGame.storeId=store.id;if(o){o.status='booked';o.windowId=window.id;}return window;}
function gameWindows(s,storeId,atWeek=s.week){return s.gameStoreWindows.filter(w=>w.storeId===storeId&&w.startWeek<=atWeek&&w.endWeek>atWeek&&
 s.projects.some(p=>p.id===w.projectId&&p.companyId===w.ownerId&&gameDistributionAllowed(s,p,atWeek)));}
function gameSelectStore(s,projectId,storeId){const {p,g}=gameProject(s,projectId,false);if(p.status!=='released'||!gameWindows(s,storeId).some(x=>x.projectId===p.id)||g.exclusiveStoreId&&g.exclusiveUntil>s.week&&g.exclusiveStoreId!==storeId)throw new Error('Only actually licensed, nonconflicting stores may sell this game.');
 g.storeId=storeId;return {storeId};}
function gameMarketSplit(s,p,gross,region){const g=p.videoGame;g.lastStoreOwnerId=null;
 const win=g.storeId?gameWindows(s,g.storeId).find(x=>x.projectId===p.id):null;
 if(!win){if(g.exclusiveStoreId&&g.exclusiveUntil>s.week)return {fee:0,net:0,channel:'exclusive-blocked'};return {fee:money(gross*CFG.tuning_engine.gameMarketSplit__001),net:money(gross*CFG.tuning_engine.gameMarketSplit__002),channel:'external'};}
 g.lastStoreOwnerId=s.gameStores.find(x=>x.id===win.storeId)?.companyId||null;if(g.lastStoreOwnerId===p.companyId)return {fee:0,net:money(gross),channel:'first-party'};return {fee:money(gross*win.share),net:money(gross*(1-win.share)),channel:'licensed-store'};}
function gameSubscribeStore(s,storeId,enabled){const store=gameStoreById(s,storeId);if(store.companyId!==s.playerId||typeof enabled!=='boolean')throw new Error('Invalid subscription operator or setting.');
 if(enabled&&yearAt(s.week)<CFG.tuning_engine.gameSubscribeStore__001)throw new Error('Game subscriptions require mature digital infrastructure in Year 23.');
 if(enabled&&!gameWindows(s,storeId).length)throw new Error('Subscription launch requires lawfully licensed catalog titles.');
 store.subscribed=enabled;return store;}
function gameStoreWeek(s){
 // Proprietary game technology is an ongoing supported capability, not a free perpetual bonus.
 if(s.week%CFG.tuning_engine.gameStoreWeek__001===0)for(const c of s.companies||[])if(c.gameEngine&&!c.bankrupt){
  expense(s,c,c.gameEngine.maintenance||CFG.tuning_engine.gameStoreWeek__002,'game-engine-upkeep','Maintain in-house production engine and tools');
 }
 s.gameMarketReserved={};for(const store of s.gameStores||[])if(store.active){
 const c=company(s,store.companyId);if(!c||c.bankrupt)continue;
 if(s.week>store.startedWeek&&s.week%CFG.tuning_engine.gameStoreWeek__003===0)expense(s,c,store.monthlyCost,'game-store-upkeep','Customer support, bandwidth and store discovery');
 if(!store.subscribed)continue;const licensed=gameWindows(s,store.id);
 for(const region of activeRegions(s)){const budget=worldMarketBudget(s,'games',region.name),w=store.regionSubs[region.name]||{subscribers:0,gross:0,churn:0};store.regionSubs[region.name]=w;
 const ceiling=Math.floor(Math.max(0,budget*CFG.tuning_engine.ceiling__001-(s.gameMarketReserved[region.name]||0))/(store.tier/CFG.tuning_engine.ceiling__002));const target=licensed.length?Math.floor(ceiling*clamp(CFG.tuning_engine.target__008+licensed.length*CFG.tuning_engine.target__009,CFG.tuning_engine.target__010,CFG.tuning_engine.target__011)):0;
 const next=w.subscribers<target?Math.min(target,w.subscribers+Math.ceil((target-w.subscribers)*CFG.tuning_engine.next__008)):Math.max(target,w.subscribers-Math.ceil((w.subscribers-target)*CFG.tuning_engine.next__009));
 w.churn+=Math.max(0,w.subscribers-next);w.subscribers=next;const gross=money(Math.min(Math.max(0,budget*CFG.tuning_engine.gross__001-(s.gameMarketReserved[region.name]||0)),next*store.tier/CFG.tuning_engine.gross__002));if(!gross)continue;
 bookConsumerReceipt(s,c,gross,'game-subscriptions','Paid game catalog subscriptions in '+region.name);
 w.gross=money(w.gross+gross);store.subscriptionGross=money(store.subscriptionGross+gross);
 s.gameMarketReserved[region.name]=money((s.gameMarketReserved[region.name]||0)+gross);
 store.history.push({week:s.week,region:region.name,subscribers:next,gross,licensed:licensed.length});if(store.history.length>CFG.tuning_engine.gameStoreWeek__004){store.history.shift();store.historyComplete=false;}
 }
 }}
function gameStoreReport(s,storeId){const store=gameStoreById(s,storeId);if(store.companyId!==s.playerId)throw new Error('Not your game storefront.');
 return {...store,licenses:gameWindows(s,storeId).map(w=>({...w,title:s.projects.find(x=>x.id===w.projectId)?.title||''})),
  note:'Subscription payments reserve real game audience budgets before other game purchases. Licensed games are not sold outside their effective rights.'};}