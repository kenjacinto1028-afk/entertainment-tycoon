/* Studio Syndicate Update 50 — loss-averse, large-campaign browser storage.
   Browser IndexedDB is preferred for large snapshots; never confuse shim tests with native origin validation. */
(function(){'use strict';
 const DB='studio-syndicate-local-v50',STORE='campaigns';
 let dbPromise;
 function open(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
   if(!globalThis.indexedDB){reject(new Error('IndexedDB not available'));return;}
   let r;try{r=indexedDB.open(DB,1);}catch(e){reject(e);return;}
   r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};
   r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();dbPromise=null;};db.onclose=()=>{dbPromise=null;};resolve(db);};
   r.onerror=()=>reject(r.error||new Error('IndexedDB unavailable'));
  }).catch(err=>{dbPromise=null;throw err;});
  return dbPromise;
 }
 async function pack(raw){
  if(raw.length<1200000||typeof CompressionStream!=='function')return {format:'plain',data:raw};
  const stream=new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
  return {format:'gzip',data:await new Response(stream).blob()};
 }
 async function unpack(value){
  if(!value)return null;
  if(typeof value==='string')return value; // earlier test/format compatibility
  if(value.format==='plain')return value.data;
  if(value.format==='gzip'){
   if(typeof DecompressionStream!=='function')throw new Error('Compressed save requires a modern browser');
   return new Response(value.data.stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }
  throw new Error('Unknown browser save encoding');
 }
 async function read(key){const db=await open();return new Promise((resolve,reject)=>{
  const t=db.transaction(STORE,'readonly'),req=t.objectStore(STORE).get(key);
  req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||new Error('Browser read failed'));
 });}
 async function put(key,value){const db=await open();return new Promise((resolve,reject)=>{
  const t=db.transaction(STORE,'readwrite');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error||new Error('Browser write failed'));
  t.onabort=()=>reject(t.error||new Error('Browser write cancelled'));t.objectStore(STORE).put(value,key);
 });}
 async function get(key){return unpack(await read(key));}
 async function save(key,raw){await put(key,await pack(raw));}
 async function saveAutosave(raw,legacyPrevious){
  // Stage compression before opening a transaction: IndexedDB auto-closes
  // transactions across unrelated awaits. Move prior snapshot into recovery
  // and replace the active snapshot in ONE atomic readwrite transaction.
  const current=await pack(raw);
  const legacy=legacyPrevious?await pack(legacyPrevious):null;
  const db=await open();
  return new Promise((resolve,reject)=>{
   let t;
   try{
    t=db.transaction(STORE,'readwrite');
    t.oncomplete=()=>resolve();
    t.onerror=()=>reject(t.error||new Error('Autosave transaction failed'));
    t.onabort=()=>reject(t.error||new Error('Autosave transaction cancelled'));
    const store=t.objectStore(STORE),req=store.get('autosave');
    req.onsuccess=()=>{
     try{
      const previous=req.result||legacy;
      if(previous)store.put(previous,'recovery');
      store.put(current,'autosave');
     }catch(e){try{t.abort();}catch(_){}reject(e);}
    };
    req.onerror=()=>{try{t.abort();}catch(_){}reject(req.error||new Error('Cannot inspect previous autosave'));};
   }catch(e){if(t)try{t.abort();}catch(_){}reject(e);}
  });
 }
 globalThis.StudioPersistence50={get,save,saveAutosave,pack,unpack};
})();
