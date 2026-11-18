'use strict';
// Hall of Fame: ranking, filters, creators, franchises, rival privacy, Simple mode, audit.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const game=(seed,depth='standard')=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8,depth});
const mk=(s,title,rev,q=80)=>{const p=E.createProject(s,{title,sector:'publishing',route:'original',size:.6});p.status='released';p.releaseWeek=s.week;p.directCost=1e6;p.directRevenue=rev;p.quality=q;p.genre='Fantasy';return p;};
check('Titles ranked by multiple; levels and filters',()=>{
 const s=game('hof-1');mk(s,'Low',7e6);const b=mk(s,'Big',13e6),l=mk(s,'Legend',17e6,90);mk(s,'Flop',1e6);
 const h=E.hallOfFame(s,{});const mine=h.titles.filter(t=>['Low','Big','Legend','Flop'].includes(t.title));
 assert.deepEqual(mine.map(t=>t.title),['Legend','Big','Low']);assert.equal(mine[0].tier,'legendary');assert.equal(mine[1].tier,'smash');
 assert(h.titles.every(t=>t.tier),'only Hit or better');
 assert.equal(E.hallOfFame(s,{tier:'legendary'}).titles.find(t=>t.title==='Legend').tier,'legendary');
 assert(E.hallOfFame(s,{tier:'legendary'}).titles.every(t=>t.tier==='legendary'));
 assert.equal(E.hallOfFame(s,{sector:'games'}).titles.filter(t=>t.title==='Big').length,0);
 assert(E.hallOfFame(s,{page:999}).page>=1);
 for(const t of h.titles.filter(t=>!t.mine))assert(t.revenue===null&&t.profit===null,'rival money private');});
check('Creators and franchises score',()=>{
 const s=game('hof-2');const person=s.employees[0];
 const a=mk(s,'Alpha',17e6,90),b=mk(s,'Beta',7e6);
 for(const p of [a,b])p.creatorCredits=[{personId:person.id,role:'team lead'}];
 const h=E.hallOfFame(s,{});const c=h.creators.find(x=>x.id===person.id);
 assert(c&&c.points>=5&&c.hits>=2&&c.best==='Alpha');
 const f=h.franchises.find(x=>x.name==='Alpha');assert(f&&f.points>=4);
 assert.equal(E.hallOfFame(s,{top:1}).creators.length,1);});
check('Simple mode has no franchises; others do',()=>{
 assert.equal(E.hallOfFame(game('hof-s','simple'),{}).franchises,null);
 assert(Array.isArray(E.hallOfFame(game('hof-v','veryComplex'),{}).franchises));});
check('Works on a long run and leaves save clean',()=>{
 const s=game('hof-3');E.advance(s,520);const before=JSON.stringify(s),h=E.hallOfFame(s,{});
 assert.equal(JSON.stringify(s),before,'read-only');assert.deepEqual(E.audit(s),[]);return {titles:h.total,creators:h.creators.length};});
