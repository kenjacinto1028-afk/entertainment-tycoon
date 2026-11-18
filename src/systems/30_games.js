
function gameBookExclusive(s,offerId){const o=s.gameExclusiveOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId),
 p=s.projects.find(x=>x.id===o?.projectId),store=s.gameStores.find(x=>x.id===o?.storeId),operator=store&&company(s,store.companyId),owner=p&&company(s,p.companyId);
 if(!o||o.status!=='accepted'||s.week>o.expiresWeek||!operator||!owner||!p||p.status!=='released'||
 !gameWindows(s,o.storeId).some(w=>w.projectId===p.id&&w.endWeek>=s.week+o.weeks)||
 s.gameStoreWindows.some(w=>w.projectId===p.id&&w.storeId!==o.storeId&&w.endWeek>s.week)||p.videoGame.exclusiveUntil>s.week)
  throw new Error('Agreement no longer permits exclusive distribution.');
 if(operator.finance.cash<o.acceptedGrant+CFG.tuning_engine.gameBookExclusive__001)throw new Error('Store cannot fund the agreed marketing grant.');
 expense(s,operator,o.acceptedGrant,'game-exclusive-marketing','Time-limited marketing rights '+p.title,p.id);
 revenue(s,owner,o.acceptedGrant,'game-exclusive-grant','Contracted exclusive marketing support '+p.title,p.id);
 p.videoGame.exclusiveStoreId=o.storeId;p.videoGame.exclusiveUntil=s.week+o.weeks;p.videoGame.storeId=o.storeId;
 o.activatedWeek=s.week;o.status='booked';return {projectId:p.id,storeId:o.storeId,grant:o.acceptedGrant,endWeek:p.videoGame.exclusiveUntil};
}

const GAME_PLATFORMS=Object.freeze(CFG.games.GAME_PLATFORMS);
const GAME_MECHANICS=Object.freeze(CFG.games.GAME_MECHANICS);
const GAME_MODELS=Object.freeze(CFG.games.GAME_MODELS);
const GAME_STAGES=Object.freeze(CFG.games.GAME_STAGES);
function gameGeneration(week,platform){return 1+Math.floor((yearAt(week)-GAME_PLATFORMS[platform])/CFG.tuning_engine.gameGeneration__001);}
function gameDefault(p,week){return {mechanic:'strategy',platform:'pc',generation:gameGeneration(Math.max((CFG.tuning_engine.gameDefault__001-1)*CFG.tuning_engine.gameDefault__002,week),'pc'),
  scope:'balanced',engine:'licensed',engineFee:0,prototype:null,designHistory:[],stages:[{week,phase:'concept'}],
  bugs:Math.max(0,Math.round(CFG.tuning_engine.gameDefault__003+(CFG.tuning_engine.gameDefault__004-p.technicalQuality)*CFG.tuning_engine.gameDefault__005)),qaHistory:[],beta:null,certification:null,
  model:'premium',exclusiveUntil:0,exclusivePlatform:null,exclusivePromotion:0,community:0,communityActions:[],
  support:[],dlc:[],esports:[],regionalGross:{},salesUnits:{},platformFees:0,platformGross:0,
  weeklySales:[],historyComplete:true,storeId:null,lastStoreOwnerId:null};}
function gameProject(s,projectId,needsActive=true){const p=s.projects.find(x=>x.id===projectId),c=p&&company(s,p.companyId);
 if(!p||!c||p.sector!=='games'||!controlledCompanies(s).some(x=>x.id===c.id)||needsActive&&p.status!=='active'||p.route==='contract')throw new Error('Choose an eligible owned game project.');
 if(!available('games',s.week))throw new Error('Worldwide games debut in Year 10.');
 if(!p.videoGame)p.videoGame=gameDefault(p,p.startWeek);return {p,c,g:p.videoGame};}
function gameSpend(s,p,c,amount,kind){amount=money(amount);if(c.finance.cash<amount+CFG.tuning_engine.gameSpend__001)throw new Error('Game decision requires funded cash with operating buffer.');
 expense(s,c,amount,'game-'+kind,kind+' development: '+p.title,p.id);p.directCost=money(p.directCost+amount);
 p.productionSpend=money((p.productionSpend||0)+amount);p.periodProductionSpend=money((p.periodProductionSpend||0)+amount);return amount;}
function gameQuality(p){p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.gameQuality__001+p.technicalQuality*CFG.tuning_engine.gameQuality__002-p.videoGame.bugs*CFG.tuning_engine.gameQuality__003,CFG.tuning_engine.gameQuality__004,CFG.tuning_engine.gameQuality__005));return p.quality;}
function gameDesign(s,projectId,{mechanic='strategy',platform='pc',scope='balanced'}={}){
 const {p,g}=gameProject(s,projectId);if(p.weeksDone>0||g.designHistory.length)throw new Error('Core design locks after development starts.');
 if(!GAME_MECHANICS.includes(mechanic)||!GAME_PLATFORMS[platform]||!['focused','balanced','ambitious'].includes(scope))throw new Error('Invalid game design.');
 if(yearAt(s.week)<GAME_PLATFORMS[platform])throw new Error('That platform ecosystem has not appeared yet.');
 if(p.grantId&&s.grants.some(x=>x.id===p.grantId&&x.approvalRequired))throw new Error('Creator approval restricts changed design.');
 g.mechanic=mechanic;g.platform=platform;g.generation=gameGeneration(s.week,platform);g.scope=scope;
 g.designHistory.push({week:s.week,mechanic,platform,scope});if(scope==='ambitious'){p.weeksTotal+=CFG.tuning_engine.gameDesign__001;g.bugs+=CFG.tuning_engine.gameDesign__002;p.creativeQuality=Math.min(CFG.tuning_engine.gameDesign__003,p.creativeQuality+CFG.tuning_engine.gameDesign__004);}
 if(scope==='focused'){p.weeksTotal=Math.max(CFG.tuning_engine.gameDesign__005,p.weeksTotal-CFG.tuning_engine.gameDesign__006);g.bugs=Math.max(CFG.tuning_engine.gameDesign__007,g.bugs-CFG.tuning_engine.gameDesign__008);}gameQuality(p);
 return {mechanic,platform,scope,generation:g.generation,plannedWeeks:p.weeksTotal};}
function gamePrototype(s,projectId,approach='balanced'){
 const {p,c,g}=gameProject(s,projectId);if(g.prototype||p.weeksDone>p.weeksTotal*CFG.tuning_engine.gamePrototype__001||!['balanced','technical','creative'].includes(approach))throw new Error('Prototype must be commissioned early, once per game.');
 const cost=gameSpend(s,p,c,Math.max(CFG.tuning_engine.cost__027,p.budget*CFG.tuning_engine.cost__028),'prototype');g.prototype={week:s.week,approach,cost,riskEstimate:Math.round(clamp(CFG.tuning_engine.gamePrototype__002+g.bugs-(p.technicalQuality-CFG.tuning_engine.gamePrototype__003)*CFG.tuning_engine.gamePrototype__004,CFG.tuning_engine.gamePrototype__005,CFG.tuning_engine.gamePrototype__006))};
 if(approach==='technical'){g.bugs=Math.max(1,g.bugs-CFG.tuning_engine.gamePrototype__007);p.technicalQuality=Math.min(CFG.tuning_engine.gamePrototype__008,p.technicalQuality+CFG.tuning_engine.gamePrototype__009);}
 else {p.creativeQuality=Math.min(CFG.tuning_engine.gamePrototype__010,p.creativeQuality+(approach==='creative'?CFG.tuning_engine.gamePrototype__011:CFG.tuning_engine.gamePrototype__012));}
 gameQuality(p);return {...g.prototype};}
function gameBuildEngine(s){const c=player(s);if(!available('games',s.week)||!c.capabilities.games)throw new Error('Game studio technology unavailable.');
 if(c.gameEngine)throw new Error('Company already maintains a proprietary game engine.');
 const cost=CFG.tuning_engine.cost__029;if(c.finance.cash<cost+CFG.tuning_engine.gameBuildEngine__001)throw new Error('Not enough funds for engine R&D and operating reserve.');
 expense(s,c,cost,'game-engine-rnd','Fund proprietary reusable game engine R&D');
 c.gameEngine={createdWeek:s.week,maintenance:CFG.tuning_engine.gameBuildEngine__002,version:1,quality:CFG.tuning_engine.gameBuildEngine__003};return c.gameEngine;}
function gameChooseEngine(s,projectId,engine='licensed'){
 const {p,c,g}=gameProject(s,projectId);if(!['licensed','proprietary'].includes(engine)||g.engineFee||p.weeksDone>p.weeksTotal*CFG.tuning_engine.gameChooseEngine__001)throw new Error('Choose game tools early and only once.');
 if(engine==='proprietary'&&!c.gameEngine)throw new Error('This studio has not funded a proprietary engine.');
 const cost=gameSpend(s,p,c,engine==='licensed'?Math.max(CFG.tuning_engine.cost__030,p.budget*CFG.tuning_engine.cost__031):Math.max(CFG.tuning_engine.cost__032,p.budget*CFG.tuning_engine.cost__033),'engine-license');
 g.engine=engine;g.engineFee=cost;g.bugs=Math.max(0,g.bugs-(engine==='proprietary'?CFG.tuning_engine.gameChooseEngine__002:CFG.tuning_engine.gameChooseEngine__003));p.technicalQuality=Math.min(CFG.tuning_engine.gameChooseEngine__004,p.technicalQuality+(engine==='proprietary'?CFG.tuning_engine.gameChooseEngine__005:CFG.tuning_engine.gameChooseEngine__006));gameQuality(p);
 return {engine,cost,defects:g.bugs};}
function gameQA(s,projectId,level='standard'){
 const {p,c,g}=gameProject(s,projectId);if(!['standard','intensive','crunch'].includes(level)||g.qaHistory.length>=CFG.tuning_engine.gameQA__001)throw new Error('Invalid QA order or team already stretched.');
 const cost=gameSpend(s,p,c,Math.max(CFG.tuning_engine.cost__034,p.budget*(level==='intensive'?CFG.tuning_engine.cost__035:level==='crunch'?CFG.tuning_engine.cost__036:CFG.tuning_engine.cost__037)),'qa');
 const reduction=level==='intensive'?CFG.tuning_engine.reduction__001:level==='crunch'?CFG.tuning_engine.reduction__002:CFG.tuning_engine.reduction__003;g.bugs=Math.max(0,g.bugs-reduction);p.technicalQuality=Math.min(CFG.tuning_engine.gameQA__002,p.technicalQuality+(level==='intensive'?CFG.tuning_engine.gameQA__003:CFG.tuning_engine.gameQA__004));
 if(level==='intensive')p.weeksTotal+=CFG.tuning_engine.gameQA__005;if(level==='crunch')p.creativeQuality=Math.max(CFG.tuning_engine.gameQA__006,p.creativeQuality-CFG.tuning_engine.gameQA__007);
 const row={week:s.week,level,cost,defectsAfter:g.bugs};g.qaHistory.push(row);gameQuality(p);return row;}
function gameMilestone(s,p){const g=p.videoGame;if(!g)return;const ratio=p.weeksDone/Math.max(1,p.weeksTotal);
 const next=ratio>=CFG.tuning_engine.next__003?'certification':ratio>=CFG.tuning_engine.next__004?'beta':ratio>=CFG.tuning_engine.next__005?'alpha':ratio>=CFG.tuning_engine.next__006?'build':ratio>=CFG.tuning_engine.next__007?'prototype':'concept';
 if(g.stages.at(-1)?.phase!==next)g.stages.push({week:s.week,phase:next});}
function gameBeta(s,projectId){const {p,c,g}=gameProject(s,projectId);if(g.beta||p.weeksDone<p.weeksTotal*CFG.tuning_engine.gameBeta__001)throw new Error('Beta requires a developed playable build.');
 const cost=gameSpend(s,p,c,Math.max(CFG.tuning_engine.cost__038,p.budget*CFG.tuning_engine.cost__039),'beta');g.beta={week:s.week,cost,estimatedAppeal:Math.round(clamp(p.creativeQuality-g.bugs*CFG.tuning_engine.gameBeta__002,1,CFG.tuning_engine.gameBeta__003)),estimatedBugs:g.bugs};
 return {...g.beta};}
function gameCertify(s,projectId,region){const {p,c,g}=gameProject(s,projectId);
 if(!activeRegions(s).some(r=>r.name===region)||g.certification?.regions?.includes(region))throw new Error('Invalid or already certified region.');
 if(p.weeksDone<p.weeksTotal*CFG.tuning_engine.gameCertify__001)throw new Error('Certification requires sufficiently developed content.');
 const cost=gameSpend(s,p,c,CFG.tuning_engine.cost__040,'certification');if(!g.certification)g.certification={regions:[],failures:[],cost:0};g.certification.cost=money(g.certification.cost+cost);
 if(g.bugs>CFG.tuning_engine.gameCertify__002){g.certification.failures.push({week:s.week,region,bugs:g.bugs});return {region,passed:false,bugs:g.bugs,cost};}
 g.certification.regions.push(region);return {region,passed:true,cost};}
function gameSetModel(s,projectId,model='premium'){
 const {p,g}=gameProject(s,projectId);if(!GAME_MODELS.includes(model)||p.weeksDone>p.weeksTotal*CFG.tuning_engine.gameSetModel__001)throw new Error('Business model locks before the final build.');
 if(model==='subscription'&&yearAt(s.week)<CFG.tuning_engine.gameSetModel__002||model==='free-to-play'&&yearAt(s.week)<CFG.tuning_engine.gameSetModel__003)throw new Error('Selected business model is not yet supported by this world technology.');
 g.model=model;return {model};}
function gameCommunity(s,projectId,kind='community'){
 const {p,c,g}=gameProject(s,projectId,false);if(p.status==='cancelled'||!['community','modding','demo','esports'].includes(kind))throw new Error('Invalid game community support.');
 if(kind==='esports'&&(p.status!=='released'||!['strategy','action','simulation'].includes(g.mechanic)))throw new Error('Organized esports requires an eligible released game.');
 if(kind==='modding'&&yearAt(s.week)<CFG.tuning_engine.gameCommunity__001)throw new Error('Modding tools are not yet available.');
 if(g.communityActions.filter(x=>x.kind===kind).length>=CFG.tuning_engine.gameCommunity__002)throw new Error('Already supported this initiative twice.');
 const cost=gameSpend(s,p,c,kind==='esports'?CFG.tuning_engine.cost__041:kind==='modding'?CFG.tuning_engine.cost__042:kind==='demo'?CFG.tuning_engine.cost__043:CFG.tuning_engine.cost__044,'community');
 g.community=Math.min(CFG.tuning_engine.gameCommunity__003,g.community+(kind==='esports'?CFG.tuning_engine.gameCommunity__004:kind==='modding'?CFG.tuning_engine.gameCommunity__005:CFG.tuning_engine.gameCommunity__006));const row={week:s.week,kind,cost,bonus:g.community};g.communityActions.push(row);return row;}
function gameSupport(s,projectId,kind='patch'){
 const {p,c,g}=gameProject(s,projectId,false);if(p.status!=='released'||!['patch','dlc','port'].includes(kind))throw new Error('Only finished games receive postlaunch support.');
 if(!gameDistributionAllowed(s,p,s.week))throw new Error('Publishing rights have expired; no new paid distribution is permitted.');
 if(kind==='dlc'&&g.dlc.length>=CFG.tuning_engine.gameSupport__001||kind==='port'&&g.support.some(x=>x.kind==='port'))throw new Error('Expansion or port already completed.');
 const cost=gameSpend(s,p,c,kind==='dlc'?CFG.tuning_engine.cost__045:kind==='port'?CFG.tuning_engine.cost__046:CFG.tuning_engine.cost__047,'postlaunch');
 if(kind==='patch'){g.bugs=Math.max(0,g.bugs-CFG.tuning_engine.gameSupport__002);p.technicalQuality=Math.min(CFG.tuning_engine.gameSupport__003,p.technicalQuality+CFG.tuning_engine.gameSupport__004);}
 if(kind==='dlc')g.dlc.push({week:s.week,cost});if(kind==='port')g.platform='pc';
 const row={week:s.week,kind,cost};g.support.push(row);gameQuality(p);return row;}
function gameDistributionAllowed(s,p,week){return !p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=week&&g.endWeek+(g.continuationWeeks||0)>week);}
function gameAtRelease(s,p){const g=p.videoGame;if(!g)return;
 g.stages.push({week:s.week,phase:'released'});g.releaseDefects=g.bugs;
 // A failed certification cannot be bypassed by silently selling in that region.
 g.launchRegions=g.certification?.regions?.length?[...g.certification.regions]:activeRegions(s).map(r=>r.name);
 g.criticRating=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.gameAtRelease__001+p.technicalQuality*CFG.tuning_engine.gameAtRelease__002,1,CFG.tuning_engine.gameAtRelease__003));
 g.userRating=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.gameAtRelease__004+p.technicalQuality*CFG.tuning_engine.gameAtRelease__005-g.bugs*CFG.tuning_engine.gameAtRelease__006+g.community*CFG.tuning_engine.gameAtRelease__007,1,CFG.tuning_engine.gameAtRelease__008));
 p.criticScore=g.criticRating;p.audienceScore=g.userRating;}