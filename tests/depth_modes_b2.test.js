'use strict';
// Depth modes step 2 B2: board blocks and overrides (Simple never, Standard rule, Very Complex unchanged), pressure card.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const B=E.CONFIG.depth.BOARD;
const game=(seed,depth)=>{const s=E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8,depth});E.incorporateStudio(s);return s;};
const rep=s=>E.player(s).corporate.boardRep;
const big=s=>E.corporateValuation(s).expected*(B.BLOCK_SPEND_SHARE+0.1);
const cards=s=>s.inbox.filter(a=>a.boardBlock);
const tryLoan=(s,amt)=>E.borrowLoan(s,amt);
function blocked(fn){try{fn();return false;}catch(e){return /board has blocked/.test(e.message);}}
function loanTry(s){const v=Math.min(E.loanLimit(s)||0,big(s));return v;}

check('Config values exist',()=>{assert.equal(B.BLOCK_SPEND_SHARE,0.25);assert.equal(B.BLOCK_BELOW,40);assert.equal(B.FLOOR,15);assert(B.OVERRIDE_BASE>0&&B.OVERRIDE_SCALE>0);});
check('Override cost scales with spend',()=>{assert.equal(E.boardOverrideCost(0,100),10);assert.equal(E.boardOverrideCost(30,100),16);assert(E.boardOverrideCost(60,100)>E.boardOverrideCost(30,100));});
check('Simple never blocks, even at Board Reputation 0 and a huge spend',()=>{
 const s=game('b2-simple','simple');rep(s).value=0;const g=E.boardGate(s,'greenlight',1e9,true);assert.equal(g,null);assert.equal(cards(s).length,0);return {blocks:rep(s).blocks};});
check('Standard: no block when Board Reputation is 40+ or spend is small',()=>{
 const s=game('b2-std-ok','standard');rep(s).value=B.BLOCK_BELOW;assert.equal(E.boardGate(s,'greenlight',big(s)*10,true),null);
 rep(s).value=10;assert.equal(E.boardGate(s,'greenlight',1000,true),null);assert.equal(cards(s).length,0);});
check('Standard: big spend with low reputation is blocked, card appears; Accept cancels at no cost',()=>{
 const s=game('b2-std-block','standard');rep(s).value=30;const spend=Math.round(big(s));
 assert(blocked(()=>E.boardGate(s,'greenlight',spend,true)));assert.equal(cards(s).length,1);assert.equal(rep(s).blocks,1);
 assert(blocked(()=>E.boardGate(s,'greenlight',spend,true)));assert.equal(cards(s).length,1,'same spend reuses the card');
 const card=cards(s)[0];assert.equal(card.open,true);const v=rep(s).value;
 assert.equal(E.boardBlockAnswer(s,card.id,false).status,'accepted');assert.equal(rep(s).value,v);assert.equal(card.open,false);
 assert.throws(()=>E.boardBlockAnswer(s,card.id,true),/no longer open/);assert.deepEqual(E.audit(s),[]);});
check('Standard: override costs reputation, allows exactly one retry of that spend',()=>{
 const s=game('b2-std-override','standard');rep(s).value=35;const spend=Math.round(big(s));
 assert(blocked(()=>E.boardGate(s,'acquisition',spend,true)));const card=cards(s)[0],cost=card.boardBlock.cost;
 const r=E.boardBlockAnswer(s,card.id,true);assert.equal(r.status,'overridden');assert.equal(rep(s).value,35-cost);assert.equal(rep(s).overrides,1);
 assert(E.boardGate(s,'acquisition',spend,false).permit,'permit visible');assert(E.boardGate(s,'acquisition',spend,true).permit,'permit used');
 assert(blocked(()=>E.boardGate(s,'acquisition',spend,true)),'second try blocked again');
 assert.deepEqual(E.audit(s),[]);return {cost};});
check('Standard: at the floor the block stands',()=>{
 const s=game('b2-std-floor','standard');rep(s).value=B.FLOOR+3;const spend=Math.round(big(s));
 assert(blocked(()=>E.boardGate(s,'greenlight',spend,true)));const card=cards(s)[0];
 assert.throws(()=>E.boardBlockAnswer(s,card.id,true),/block stands/);assert.equal(rep(s).value,B.FLOOR+3);
 assert.equal(card.boardBlock.status,'stands');assert(blocked(()=>E.boardGate(s,'greenlight',spend,true)));});
check('Standard: expired override no longer works',()=>{
 const s=game('b2-std-expire','standard');rep(s).value=35;const spend=Math.round(big(s));blocked(()=>E.boardGate(s,'greenlight',spend,true));
 E.boardBlockAnswer(s,cards(s)[0].id,true);E.advance(s,B.PERMIT_WEEKS+2);rep(s).value=35;
 assert(blocked(()=>E.boardGate(s,'greenlight',spend,true)));});
check('Real greenlight in Standard is blocked then goes ahead after override',()=>{
 const s=game('b2-std-real','standard');const c=E.player(s);rep(s).value=30;
 // shrink company value so an ordinary project exceeds 25% of it
 const spend=E.previewProject?E.previewProject(s,{sector:'publishing',route:'original',size:1}):null;
 const est=spend?.budget!==undefined?spend.budget+(spend.marketing||0):0;
 const v=E.corporateValuation(s).expected;
 if(est<=v*B.BLOCK_SPEND_SHARE){B.BLOCK_SPEND_SHARE=Math.max(0.001,est/v/2);}
 try{assert(blocked(()=>E.createProject(s,{title:'Big',sector:'publishing',route:'original',size:1})));
  const card=cards(s)[0];assert.equal(s.projects.filter(p=>p.title==='Big').length,0);
  E.boardBlockAnswer(s,card.id,true);const p=E.createProject(s,{title:'Big',sector:'publishing',route:'original',size:1});assert(p&&p.id);
 }finally{B.BLOCK_SPEND_SHARE=0.25;}
 assert.deepEqual(E.audit(s),[]);});
check('Contract jobs are never blocked',()=>{const s=game('b2-contract','standard');rep(s).value=0;
 assert.doesNotThrow(()=>E.createProject(s,{title:'Job',sector:'publishing',route:'contract',size:.6,clientId:'auto'}));});
check('Very Complex: old board votes unchanged (no Board Reputation block)',()=>{
 const s=game('b2-vc','veryComplex');rep(s).value=0;assert.equal(E.boardGate(s,'greenlight',1e9,true),null);assert.equal(cards(s).length,0);});
check('Standard/Simple skip the old board vote for loans; Very Complex still requires it',()=>{
 for(const [mode,expectThrow] of [['simple',false],['standard',false],['veryComplex',true]]){
  const s=game('b2-loan-'+mode,mode);rep(s).value=80;
  let threw=false;try{E.borrowLoan(s,Math.min(E.loanLimit(s),40000));}catch(e){threw=/Board authorization/.test(e.message);}
  assert.equal(threw,expectThrow,mode);}});
check('Pressure card: Standard, reputation under 20 at yearly review; promise doubles next target; dividend path',()=>{
 const s=game('b2-pressure','standard');const r=rep(s);const y=Math.floor(s.week/52)+1;
 r.target={year:y,minRevenue:0};E.advance(s,y*52-s.week-1);r.value=10;E.advance(s,1);
 const card=s.inbox.find(a=>a.boardPressure==='open');assert(card,'card shown');
 E.boardPressureAnswer(s,card.id,'promise');assert.equal(r.promise,true);assert.equal(card.open,false);
 const s2=game('b2-pressure2','simple');const r2=rep(s2);const y2=Math.floor(s2.week/52)+1;E.advance(s2,y2*52-s2.week-1);r2.value=10;E.advance(s2,1);
 assert(!s2.inbox.some(a=>a.boardPressure),'no card in Simple');
 assert.deepEqual(E.audit(s),[]);});
check('Save round trip keeps a blocked card and override permit',()=>{
 const s=game('b2-save','standard');rep(s).value=35;const spend=Math.round(big(s));blocked(()=>E.boardGate(s,'greenlight',spend,true));E.boardBlockAnswer(s,cards(s)[0].id,true);
 const t=E.loadState(JSON.stringify(s));assert(E.boardGate(t,'greenlight',spend,false).permit);assert.deepEqual(E.audit(t),[]);});
check('Block counter: a Standard studio greenlighting 6 projects a year for 10 years sees only a few blocks',()=>{
 const out={};
 for(const seed of ['b2-run-1','b2-run-2']){
  const s=game(seed,'standard');let attempts=0;const r=rep(s);
  for(let y=0;y<10;y++){
   for(let k=0;k<6;k++){attempts++;try{E.createProject(s,{title:'R'+y+k,sector:'publishing',route:'original',size:.8});}catch(e){}
    for(const a of s.inbox.filter(a=>a.boardBlock&&a.boardBlock.status==='open'))a.boardBlock.status='accepted';
    try{E.advance(s,8);}catch(e){}}
  }
  out[seed]={attempts,blocks:r.blocks,rep:r.value};assert(r.blocks<=5,'too many blocks: '+r.blocks);assert.deepEqual(E.audit(s),[]);}
 return out;});
console.log(total+' checks passed');
