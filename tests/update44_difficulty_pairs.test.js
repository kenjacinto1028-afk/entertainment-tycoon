'use strict';
const E=require('../dist/engine.js'),assert=require('node:assert/strict'),fs=require('node:fs');
const rows=[];let audits=0;
for(const [era,origin] of [[1,'publisher'],[4,'film'],[25,'games']])for(const idx of [1,2]){
 const seed=`paired-balance44-${era}-${idx}`;
 for(const difficulty of ['casual','standard','challenging']){
  const s=E.createGame({seed,era,origin,difficulty,worldScale:2,aiCount:5,regionCount:2});
  const opening=E.player(s).finance.cash;let launched=0;
  for(let yr=0;yr<10;yr++){
   const c=E.player(s);
   if(c.finance.cash>20000&&!c.operating44.furloughed&&s.management.status==='active'&&!s.projects.some(p=>p.companyId===c.id&&p.status==='active')){
    try{E.createProject(s,{title:`${seed} New IP ${yr}`,sector:c.sector,route:'original',size:.75,genre:'Fantasy'});launched++;}catch(_){}
   }
   for(let w=0;w<52;w++)E.advance(s,1);
   const bad=E.audit(s);assert.deepEqual(bad,[],`${seed}/${difficulty}/${yr}: ${bad.slice(0,5)}`);audits++;
  }
  const c=E.player(s);rows.push({seed,era,difficulty,opening,cash:c.finance.cash,payable:c.finance.payable,
   playerRevenue:c.finance.revenue,playerExpense:c.finance.expense,launched,playerReleased:s.projects.filter(p=>p.companyId===c.id&&p.status==='released').length,
   rivalsClosed:s.companies.filter(x=>!x.isPlayer&&x.bankrupt).length,worldCompanies:s.companies.length});
  console.log('PASS',seed,difficulty,'open',opening,'close',c.finance.cash,'launches',launched);
 }
}
fs.writeFileSync('reports/UPDATE_44_DIFFICULTY_PAIRS.json',JSON.stringify({audits,rows},null,2));
console.log(`UPDATE44 paired difficulty ${rows.length} worlds ${audits} yearly audits`);
