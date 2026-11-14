/* cloud.js — optional private cloud copy of your uploaded files (Firebase Auth + Storage). */
const CL={user:null,mods:null,msg:'',busy:false};
async function cloudInit(){if(CL.mods)return CL.mods;
  if(!window.FIREBASE_CONFIG||!FIREBASE_CONFIG.apiKey)throw new Error('firebase-config.js is empty');
  const b='https://www.gstatic.com/firebasejs/10.12.2/';
  const [app,auth,st]=await Promise.all([import(b+'firebase-app.js'),import(b+'firebase-auth.js'),import(b+'firebase-storage.js')]);
  const a=app.initializeApp(FIREBASE_CONFIG),au=auth.getAuth(a),sto=st.getStorage(a);
  CL.mods={app,auth,st,au,sto};auth.onAuthStateChanged(au,u=>{CL.user=u;const m=$('.me b');if(m)m.textContent=u?(u.email||'Signed in').split('@')[0]:'Profile Name';if(typeof CUR!='undefined'&&CUR=='upload')rerender()});
  return CL.mods}
function cloudErr(e){const c=e&&e.code||'';
  if(c.includes('unauthorized'))return 'Cloud storage rules do not allow this yet. Publish storage.rules from the Firebase console (see README).';
  if(c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found'))return 'Email or password is not correct.';
  if(c.includes('email-already-in-use'))return 'This email already has an account. Use Sign in.';
  if(c.includes('weak-password'))return 'Password needs at least 6 characters.';
  if(c.includes('operation-not-allowed'))return 'Turn on Email/Password sign-in in Firebase console → Authentication → Sign-in method.';
  if(c.includes('network'))return 'No internet connection to Firebase.';
  return (e&&e.message)||'Cloud request failed'}
function cmsg(m){CL.msg=m;const e=$('#clmsg');if(e){e.textContent=m;e.style.display=m?'':'none'}}
async function cloudAuth(kind){const em=$('#cle').value.trim(),pw=$('#clp').value;if(!em||!pw){cmsg('Enter email and password');return}
  try{cmsg('Please wait …');const {auth,au}=await cloudInit();kind=='up'?await auth.createUserWithEmailAndPassword(au,em,pw):await auth.signInWithEmailAndPassword(au,em,pw);cmsg('Signed in as '+em)}catch(e){cmsg(cloudErr(e))}}
async function cloudOut(){try{const {auth,au}=await cloudInit();await auth.signOut(au);cmsg('Signed out')}catch(e){cmsg(cloudErr(e))}}
async function gz(str){const cs=new CompressionStream('gzip'),w=cs.writable.getWriter();w.write(new TextEncoder().encode(str));w.close();return new Uint8Array(await new Response(cs.readable).arrayBuffer())}
async function gunz(buf){const ds=new DecompressionStream('gzip'),w=ds.writable.getWriter();w.write(buf);w.close();return new Response(ds.readable).text()}
async function cloudPush(){if(!FILES.length){cmsg('Upload a file first');return}
  try{const {st,sto}=await cloudInit();const uid=CL.user.uid;
    let old=[];try{old=JSON.parse(new TextDecoder().decode(await st.getBytes(st.ref(sto,`datasets/${uid}/manifest.json`)))).files||[]}catch(e){}
    for(const [i,f] of FILES.entries()){cmsg(`Saving ${f.name} (${i+1} of ${FILES.length}) …`);
      const bytes=await gz(JSON.stringify({cols:f.cols,rows:f.rows}));
      await st.uploadBytes(st.ref(sto,`datasets/${uid}/${f.id}.json.gz`),bytes,{contentType:'application/gzip'})}
    const man={saved:new Date().toISOString(),files:FILES.map(f=>({id:f.id,order:f.order,name:f.name,kind:f.kind,at:f.at,size:f.size,rows:f.rows.length,cols:f.cols.length}))};
    await st.uploadBytes(st.ref(sto,`datasets/${uid}/manifest.json`),new TextEncoder().encode(JSON.stringify(man)),{contentType:'application/json'});
    for(const o of old)if(!FILES.some(f=>f.id==o.id))try{await st.deleteObject(st.ref(sto,`datasets/${uid}/${o.id}.json.gz`))}catch(e){}
    logAct('upload','saved data to cloud',FILES.length+' files');cmsg('Saved '+FILES.length+' files to your private cloud folder.');toast('Saved to cloud')}catch(e){console.error(e);cmsg(cloudErr(e))}}
async function cloudPull(){
  try{const {st,sto}=await cloudInit();const uid=CL.user.uid;cmsg('Looking for saved data …');
    let man;try{man=JSON.parse(new TextDecoder().decode(await st.getBytes(st.ref(sto,`datasets/${uid}/manifest.json`))))}catch(e){if((e.code||'').includes('object-not-found')){cmsg('Nothing has been saved to the cloud yet.');return}throw e}
    if(FILES.length&&!confirm('This replaces the data now in this browser with the cloud copy. Continue?'))return;
    const recs=[];for(const [i,m] of man.files.entries()){cmsg(`Loading ${m.name} (${i+1} of ${man.files.length}) …`);
      const d=JSON.parse(await gunz(await st.getBytes(st.ref(sto,`datasets/${uid}/${m.id}.json.gz`))));recs.push({id:m.id,order:m.order,name:m.name,kind:m.kind,at:m.at,size:m.size,cols:d.cols,rows:d.rows})}
    await Store.clear();for(const r of recs)await Store.put(r);FILES=recs.sort((a,b)=>a.order-b.order);await rebuild();
    cmsg('Loaded '+recs.length+' files from the cloud.');toast('Loaded from cloud')}catch(e){console.error(e);cmsg(cloudErr(e))}}
function cloudCard(){
  const ok=window.FIREBASE_CONFIG&&FIREBASE_CONFIG.apiKey;
  if(ok&&!CL.mods)cloudInit().catch(()=>{});
  return `<div class="card s12"><div class="ch"><div><h3>Cloud copy (optional)</h3><div class="sub">Keep a private copy in your Firebase project so the same data opens on any device. Only your own signed-in account can read it.</div></div><div class="r">${pill(CL.user?'Signed in':ok?'Signed out':'Not set up',CL.user?'g':'y')}</div></div>
  ${!ok?'<div class="note">Fill firebase-config.js to turn this on.</div>':CL.user?`<div class="tb"><span>${CL.user.email||''}</span><span class="sp"></span><button class="btn pri" onclick="cloudPush()">Save my files to cloud</button><button class="btn" onclick="cloudPull()">Load from cloud</button><button class="btn" onclick="cloudOut()">Sign out</button></div>`:`<div class="tb"><input type="email" id="cle" placeholder="Email"><input type="password" id="clp" placeholder="Password" onkeydown="if(event.key=='Enter')cloudAuth('in')"><button class="btn pri" onclick="cloudAuth('in')">Sign in</button><button class="btn" onclick="cloudAuth('up')">Create account</button></div>`}
  <div class="note" id="clmsg" style="margin-top:10px;${CL.msg?'':'display:none'}">${CL.msg}</div></div>`}
