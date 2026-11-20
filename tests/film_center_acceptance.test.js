'use strict';
const A=require('node:assert/strict');
const FS=require('node:fs');
const path=require('node:path');
const E=require('../dist/engine.js');
const label=week=>'Y'+E.yearAt(week)+' · W'+E.yearWeek(week);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>E.shortMoney(n||0);
const stub={addEventListener(){}};
const filmJs=FS.readFileSync(path.join(__dirname,'../src/interface/24_film_production_center.js'),'utf8');
const createPanel=new Function('E','S','esc','fmt','weekLabel','document','btn',filmJs+'\nreturn filmProductionCenter;');
let tests=0;
function test(title,fn){try{const result=fn();console.log('PASS',title,JSON.stringify(result||{}));tests++;}catch(e){console.error('FAIL',title,e.stack);process.exitCode=1;}}
function movie(seed){
 const s=E.createGame({era:25,origin:'film',seed,startingCapital:'funded',aiCount:5,regionCount:2});
 const p=E.createProject(s,{sector:'movie',route:'original',title:'Cinema Check',size:.65});
 return {s,p};
}
const audit=s=>A.deepEqual(E.audit(s),[]);
test('movie progression, truthful estimates, and optional decisions',()=>{
 const {s,p}=movie('film-center-1'),ui=createPanel(E,s,esc,fmt,label,stub,()=>'<button></button>');
 let page=ui([p]);
 A(page.includes('Cinema Check'));
 A(page.includes('Estimated quality'));
 A(page.includes('Production milestones'));
 A(page.includes('OPTIONAL DIRECTOR'));
 const before=p.weeksTotal;
 E.filmDecision(s,p.id,'script');
 A(p.weeksTotal>before);
 let elapsed=0;
 while(p.status==='active'&&elapsed<90){E.advance(s,1);elapsed++;}
 A.equal(p.status,'released');
 page=ui([p]);
 A(page.includes('In theaters'));
 A(page.includes('THEATRICAL PERFORMANCE'));
 audit(s);
 return {elapsed,releaseWeek:p.releaseWeek,run:E.filmTheatricalRunWeeks(p)};
});
test('multiweek theatrical window and authentic rental/catalog transitions',()=>{
 const {s,p}=movie('film-center-2');
 for(let i=0;i<100&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');
 const theatrical=E.filmTheatricalRunWeeks(p),first=p.releaseWeek;
 A(theatrical>=2&&theatrical<=16);
 A.equal(E.filmWindowChannel(p,first),'theatrical');
 A.equal(E.filmWindowChannel(p,first+theatrical-1),'theatrical');
 A.equal(E.filmWindowChannel(p,first+theatrical),'premium-rental');
 A.equal(E.filmWindowChannel(p,first+Math.max(20,theatrical+10)),'catalog');
 const dateBefore=s.week;
 for(let k=0;k<theatrical+31;k++)E.advance(s,1);
 const report=E.filmBoxOffice(s,p.id);
 A(report.channelGross.theatrical>0);
 A(report.channelGross['premium-rental']>0);
 A(report.channelGross.catalog>0);
 const ui=createPanel(E,s,esc,fmt,label,stub,()=>'<button></button>');
 A(ui([p]).includes('Catalog'));
 A(s.week>dateBefore);
 audit(s);
 const roundtrip=E.loadState(JSON.stringify(s));
 audit(roundtrip);
 A.equal(roundtrip.version,s.version);
 return {theatrical,earnings:report.totalGross,saveVersion:s.version};
});
test('reception-based theatrical duration stays bounded without mutating RNG',()=>{
 const {s,p}=movie('film-center-3'),old=s.rng;
 const a=E.filmTheatricalRunWeeks({...p,audienceScore:10,criticScore:13});
 const b=E.filmTheatricalRunWeeks({...p,audienceScore:99,criticScore:96});
 A(a>=2&&b<=16);A(b>=a);
 A.equal(s.rng,old);audit(s);
 return {weakRun:a,strongRun:b};
});
console.log('FILM CENTER '+tests+'/3');
if(tests!==3)process.exitCode=1;
