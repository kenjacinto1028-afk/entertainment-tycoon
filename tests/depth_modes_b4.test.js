'use strict';
// Depth modes step 2 B4: title levels (Hit/Smash/Legendary), studio milestones, legends list.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const R=E.CONFIG.depth.REPUTATION;
const game=(seed,depth='standard')=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8,depth});
const mk=(s,title,cost,rev,q)=>{const p=E.createProject(s,{title,sector:'publishing',route:'original',size:.6});p.status='released';p.releaseWeek=s.week;p.directCost=cost;p.directRevenue=rev;p.quality=q;p.criticScore=null;return p;};
const lv=k=>R.TITLE_LEVELS.find(l=>l.key===k);

check('Config has Hit 3x, Smash 6x, Legendary 8x with quality 85',()=>{assert.deepEqual(R.TITLE_LEVELS.map(l=>l.multiple),[3,6,8]);assert.equal(lv('legendary').minScore,85);});
for(const depth of ['simple','standard','veryComplex'])check('Levels award reputation once, in every mode: '+depth,()=>{
 const s=game('b4-'+depth,depth),c=E.player(s);c.reputation=40;const p=mk(s,'Big one',1e6,3.5e6,70);
 E.advance(s,1);assert.equal(c.reputation,40+lv('hit').reputation);E.advance(s,3);assert.equal(c.reputation,40+lv('hit').reputation);
 p.directRevenue=6.5e6;E.advance(s,1);assert.equal(c.reputation,40+2+3);assert.equal(s.legends.length,0);
 p.directRevenue=9e6;E.advance(s,1);assert.equal(c.reputation,40+2+3);// quality 70 < 85: no legend
 assert.deepEqual(E.audit(s),[]);
});
check('Legendary needs 8x and quality 85; adds news, legends entry, +5 and first-Legendary milestone',()=>{
 const s=game('b4-leg'),c=E.player(s);c.reputation=40;const p=mk(s,'Immortal',1e6,9e6,90);
 E.advance(s,1);assert.equal(s.legends.length,1);assert.equal(s.legends[0].projectId,p.id);
 assert.equal(c.reputation,40+2+3+5+R.STUDIO_MILESTONE_REPUTATION);assert(s.studioMilestones.firstLegendary);
 assert(s.news.some(n=>/Legendary/.test(n.title)));E.advance(s,3);assert.equal(s.legends.length,1);assert.deepEqual(E.audit(s),[]);
});
check('Critic score can satisfy the quality rule',()=>{const s=game('b4-crit');const p=mk(s,'Critics love it',1e6,9e6,60);p.criticScore=88;E.advance(s,1);assert.equal(s.legends.length,1);});
check('Contract jobs and AI titles do not count',()=>{
 const s=game('b4-job'),c=E.player(s);c.reputation=40;const j=E.createProject(s,{title:'Job',sector:'publishing',route:'contract',size:.6,clientId:'auto'});
 j.status='released';j.releaseWeek=s.week;j.directCost=1e6;j.directRevenue=9e6;j.quality=95;E.advance(s,1);assert.equal(c.reputation,40);assert.equal(s.legends.length,0);
});
check('Studio milestones at release counts, once each, reputation capped',()=>{
 const s=game('b4-count'),c=E.player(s);c.reputation=60;
 for(let i=0;i<10;i++)mk(s,'T'+i,1e6,100,50);E.advance(s,1);assert(s.studioMilestones.releases10);assert.equal(c.reputation,60+R.STUDIO_MILESTONE_REPUTATION);
 E.advance(s,2);assert.equal(c.reputation,60+R.STUDIO_MILESTONE_REPUTATION);
 c.reputation=97;const p=mk(s,'Cap',1e6,9e6,95);E.advance(s,1);assert(c.reputation<=98);assert.deepEqual(E.audit(s),[]);
});
check('Save round trip keeps legends and milestones',()=>{
 const s=game('b4-save');mk(s,'Immortal',1e6,9e6,90);E.advance(s,1);
 const t=E.loadState(JSON.stringify(s));assert.equal(t.legends.length,1);assert.deepEqual(t.studioMilestones,s.studioMilestones);E.advance(t,2);assert.equal(t.legends.length,1);
});
