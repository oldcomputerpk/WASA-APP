/* store.js — keeps uploaded files in this browser (IndexedDB), in upload order. */
(function(g){
const DB='wasa-kasur',ST='files';let db;
const open=()=>db?Promise.resolve(db):new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(ST,{keyPath:'id'});r.onsuccess=()=>{db=r.result;res(db)};r.onerror=()=>rej(r.error)});
const tx=(m,fn)=>open().then(d=>new Promise((res,rej)=>{const t=d.transaction(ST,m),s=t.objectStore(ST),q=fn(s);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)}));
g.Store={
  put:f=>tx('readwrite',s=>s.put(f)),
  del:id=>tx('readwrite',s=>s.delete(id)),
  clear:()=>tx('readwrite',s=>s.clear()),
  all:()=>tx('readonly',s=>s.getAll()).then(a=>(a||[]).sort((x,y)=>x.order-y.order))};
})(window);
