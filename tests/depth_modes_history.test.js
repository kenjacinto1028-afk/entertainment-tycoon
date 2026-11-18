'use strict';
// Release history: filters, sorting, paging, rival privacy, prehistory rows.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const game=(seed,depth='standard')=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8,depth});
const mk=(s,title,genre,q,rev)=>{const p=E.createProject(s,{title,sector:'publishing',route:'original',size:.6});p.status='released';p.releaseWeek=s.week;p.directCost=1e6;p.directRevenue=rev;p.quality=q;p.genre=genre;return p;};
for(const depth of ['simple','standard','veryComplex'])check('Player and industry views work in '+depth,()=>{
 const s=game('rh-'+depth,depth);mk(s,'Alpha','Fantasy',80,2e6);mk(s,'Beta','Mystery',60,1e6);
 E.advance(s,26);
 const me=E.releaseHistory(s,{scope:'player'}),all=E.releaseHistory(s,{scope:'industry'});
 assert(me.rows.some(r=>r.title==='Alpha')&&me.rows.every(r=>r.mine&&r.revenue!==null));
 assert(all.total>=me.total);assert(all.rows.filter(r=>!r.mine).every(r=>r.revenue===null&&r.profit===null),'rival money stays private');
 assert.deepEqual(E.audit(s),[]);});
check('Filters, sorting and paging',()=>{
 const s=game('rh-filter');for(let i=0;i<30;i++)mk(s,'T'+String(i).padStart(2,'0'),i%2?'Fantasy':'Mystery',50+i,1e6+i);
 const a=E.releaseHistory(s,{scope:'player',pageSize:10,sort:'title',dir:'asc'});
 assert.equal(a.rows.length,10);assert(a.pages>=3);assert.equal(a.rows[0].title<=a.rows[1].title,true);
 const g=E.releaseHistory(s,{scope:'player',genre:'Fantasy',pageSize:100});assert(g.rows.every(r=>r.genre==='Fantasy')&&g.total===15);
 const q=E.releaseHistory(s,{scope:'player',sort:'quality',dir:'desc',pageSize:5});assert.equal(q.rows[0].quality,79);
 assert.equal(E.releaseHistory(s,{scope:'player',query:'t07',pageSize:100}).total,1);
 assert.equal(E.releaseHistory(s,{scope:'player',page:999,pageSize:10}).page,a.pages);
 assert.equal(E.releaseHistory(s,{scope:'player',yearFrom:9999}).total,0);});
check('Tier filter and prehistory rows',()=>{
 const s=game('rh-tier');const p=mk(s,'Big','Fantasy',70,8e6);
 assert.equal(E.releaseHistory(s,{scope:'player',tier:'any'}).rows.find(r=>r.title==='Big').tier,'hit');
 const h=E.releaseHistory(s,{scope:'industry',pageSize:100}).total,n=E.releaseHistory(s,{scope:'industry',includeHistoric:false,pageSize:100}).total;
 assert(h>=n);});
