'use strict';
const assert=require('node:assert/strict'),E=require('../dist/engine.js');let count=0;
function check(name,fn){fn();console.log('PASS',name);count++;}
check('tutorial disabled by default, player can start and dismiss it',()=>{
 const s=E.createGame({seed:'tutorial'});assert.equal(E.tutorialStatus43(s).enabled,false);
 E.beginTutorial43(s);assert.equal(E.tutorialStatus43(s).enabled,true);
 E.endTutorial43(s);assert.equal(E.tutorialStatus43(s).enabled,false);
});
check('optional tutorial uses real dashboard, project, finance, rights and week actions',()=>{
 const s=E.createGame({seed:'tutorial-flow'});E.beginTutorial43(s);
 E.visitTutorial43(s,'dashboard');assert.equal(E.tutorialStatus43(s).step,1);
 const p=E.createProject(s,{title:'First Book',sector:'publishing',route:'original',size:.75});
 assert.equal(E.tutorialStatus43(s).step,2);
 E.visitTutorial43(s,'library');E.visitTutorial43(s,'finance');assert.equal(E.tutorialStatus43(s).step,3);
 E.advance(s,1);assert.equal(E.tutorialStatus43(s).completed,true);assert.equal(E.audit(s).length,0);
});
check('selected goals track true completed releases without cash gifts',()=>{
 const s=E.createGame({seed:'goal'});E.chooseObjective43(s,'first_release');const cash=E.player(s).finance.cash;
 const p=E.createProject(s,{title:'Work A',sector:'publishing',route:'original',size:.75});
 for(let i=0;i<30;i++){E.advance(s,1);if(p.status==='released')break;}
 E.syncWorldEvents43(s);assert.equal(E.objectiveStatus43(s).find(o=>o.key==='first_release').complete,true);
 assert(E.player(s).finance.cash!==cash);assert.equal(E.audit(s).length,0);
});
check('goals can be deselected and not claimed before actual milestones',()=>{
 const s=E.createGame({seed:'goals-c'});E.chooseObjective43(s,'industry_reach');
 assert.equal(E.objectiveStatus43(s).find(o=>o.key==='industry_reach').complete,false);
 E.chooseObjective43(s,'industry_reach',false);
 assert.equal(E.objectiveStatus43(s).find(o=>o.key==='industry_reach').selected,false);
});
check('adviser reflects real cash and rights without changing the world',()=>{
 const s=E.createGame({seed:'advice'});const raw=JSON.stringify(s);
 const a=E.adviser43(s);assert(a.screen);assert.equal(JSON.stringify(s),raw);
});
check('cartoon identity stays stable across generations, save and load',()=>{
 const s=E.createGame({seed:'portrait'}),id=s.employees[0].id;
 const a=E.portraitTraits43(s,id);const b=E.portraitTraits43(E.loadState(JSON.stringify(s)),id);
 assert.deepEqual(a,b);assert(a.style==='original-vector-cartoon');
 assert.throws(()=>E.portraitTraits43(s,'fictional-unknown'),/known named person/);
});
check('actual project release and grant generate unique linked story records',()=>{
 const s=E.createGame({era:10,seed:'events'});const p=E.createProject(s,{title:'A True Fiction',sector:'publishing',route:'original',size:.75});
 for(let i=0;i<35;i++){E.advance(s,1);if(p.status==='released')break;}
 E.syncWorldEvents43(s);const one=E.worldEvents43(s).filter(x=>x.kind==='release'&&x.entityId===p.id);
 assert.equal(one.length,1);E.syncWorldEvents43(s);assert.equal(E.worldEvents43(s).filter(x=>x.entityId===p.id).length,1);
 assert.equal(E.audit(s).length,0);
});
check('audit rejects fabricated release events',()=>{
 const s=E.createGame({seed:'tamper'});s.events43=[{key:'release:ghost',kind:'release',entityId:'ghost',week:0,source:'played-entity'}];s.events43Keys={'release:ghost':true};
 assert(E.audit(s).some(x=>x.includes('source-linked')));
});
console.log(`UPDATE43B ${count}/${count}`);
