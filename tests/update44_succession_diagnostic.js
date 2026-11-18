'use strict';
const E=require('../dist/engine.js');
for(const setup of [{seed:'succession-short-44',era:1,aiCount:3,regionCount:2,age:54},{seed:'succession-mature-44',era:25,origin:'games',aiCount:3,regionCount:2,age:65}]){
 const s=E.createGame(setup),initial=E.player(s).id;
 const leader=s.employees.find(x=>x.employerId===s.playerId&&x.status==='employed'&&x.skill>=45);
 console.log('INITIAL',setup.seed,'cash',E.player(s).finance.cash,'leaders',s.employees.filter(x=>x.employerId===s.playerId).length,'leader',!!leader,'founderAge',s.founder.age);
 E.planLeadership(s,leader.id);
 for(let y=1;y<=30;y++){
  for(let w=0;w<52;w++){
   E.advance(s,1);
   if(s.management.status==='transition'){
    const leaders=s.employees.filter(e=>e.employerId===s.playerId&&e.status==='employed'&&e.skill>=45&&e.age<75&&E.player(s).teams.some(t=>t.leaderId===e.id));
    if(leaders.length){try{E.chooseLeader(s,leaders[0].id);console.log('APPOINT',y,s.founder.age,leaders[0].age);}catch(e){console.log('APPOINT_FAIL',e.message);}}
   }
  }
  if(y%5===0||s.management.status!=='active'){
   const c=E.player(s);
   console.log('STATUS',setup.seed,'year',y,'age',s.founder.age,'cash',c.finance.cash,'bankrupt',c.bankrupt,'status',s.management.status,'staff',s.employees.filter(e=>e.employerId===c.id&&e.status==='employed').length,'vacancies',c.teams.filter(t=>!t.leaderId).length,'candidates',s.candidates.length,'founderFunds',s.founderFunds);
  }
 }
 console.log('FINAL_AUDIT',E.audit(s).slice(0,3));
}
