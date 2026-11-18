/* Update51 atomic autosave and transient storage-failure regression.
   A transactional IndexedDB test double validates request ordering and rollback.
   This is not a genuine browser-origin restart test. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/persistence50.js'),'utf8');
let failures=0;
let failOpenOnce=false,failCommitOnce=false;
const records=new Map();
const fakeDB={
  objectStoreNames:{contains:()=>true},
  createObjectStore(){},close(){},
  transaction(store,mode){
    assert.equal(store,'campaigns');
    const tx={error:null,aborted:false,completed:false};
    let staged=[];
    const maybeCommit=()=>queueMicrotask(()=>{
      if(tx.aborted||tx.completed)return;
      tx.completed=true;
      if(failCommitOnce){failCommitOnce=false;tx.error=new Error('simulated aborted commit');tx.onabort?.();return;}
      for(const [k,v] of staged)records.set(k,v);
      tx.oncomplete?.();
    });
    tx.abort=()=>{if(tx.completed||tx.aborted)return;tx.aborted=true;tx.error=new Error('simulated abort');queueMicrotask(()=>tx.onabort?.())};
    tx.objectStore=()=>({
      get(key){const r={result:undefined,error:null};queueMicrotask(()=>{r.result=records.get(key);r.onsuccess?.();if(mode==='readwrite')maybeCommit();});return r;},
      put(value,key){assert.equal(mode,'readwrite');staged.push([key,value]);if(staged.length===1)maybeCommit();return {};}
    });
    return tx;
  }
};
const idb={open(){if(failOpenOnce){failOpenOnce=false;throw Error('temporarily disabled IDB');}const req={result:fakeDB};queueMicrotask(()=>{req.onsuccess?.();});return req;}};
const sandbox={console,Blob,Response,CompressionStream,DecompressionStream,Promise,queueMicrotask,indexedDB:idb};sandbox.globalThis=sandbox;
vm.runInNewContext(source,sandbox);
const store=sandbox.StudioPersistence50;
(async()=>{
  failOpenOnce=true;
  await assert.rejects(()=>store.saveAutosave('snapshot A','legacy A'),/temporarily disabled/);
  assert.equal(await store.get('autosave'),null,'open retry baseline must remain empty');
  await store.saveAutosave('snapshot A','legacy A');
  assert.equal(await store.get('autosave'),'snapshot A');
  assert.equal(await store.get('recovery'),'legacy A');
  failures++;
  failCommitOnce=true;
  await assert.rejects(()=>store.saveAutosave('incomplete B',null),/simulated aborted commit/);
  assert.equal(await store.get('autosave'),'snapshot A','failed overwrite must keep prior current');
  assert.equal(await store.get('recovery'),'legacy A','failed overwrite must keep prior recovery');
  failures++;
  await store.saveAutosave('snapshot C');
  assert.equal(await store.get('autosave'),'snapshot C');
  assert.equal(await store.get('recovery'),'snapshot A');
  failures++;
  const centuryLike='CENTURY'+('x'.repeat(1_500_000));
  await store.save('slot-1',centuryLike);
  const encoded=records.get('slot-1');
  assert.equal(encoded.format,'gzip');
  assert.equal(await store.get('slot-1'),centuryLike);
  failures++;
  console.log(`PASS ${failures}/4: open retries, atomic rollback, recovery previous, compressed slot roundtrip (simulated IndexedDB)`);
})().catch(err=>{console.error(err);process.exitCode=1});
