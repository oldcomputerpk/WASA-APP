/* pages.js — data loading, Consumers, Export centre and Data centre pages. */
const PERSONAL=['CNIC','CONTACT_NO','EMAIL','FATHER_NAME'];
function saveZO(){try{localStorage.setItem('wk-zon',JSON.stringify(ZON))}catch(e){}}
function recZ(){for(let i=0;i<N;i++){const o=ZO[R.a[i]];R.z[i]=o!==undefined?o:Z0[i]}for(const c of CON){const o=ZO[c.a];c.z=o!==undefined?o:c.z0}}
function applyData(res){
  D=res.D;CON=res.CON;DERIVED=res.derived;R=D.rows;N=R.t.length;M=D.meta;ALL=[...Array(N).keys()];
  CMAP=new Map(CON.map(c=>[c.no,c]));
  const cnt=D.areas.map(()=>[0,0,0,0]);for(let i=0;i<N;i++)cnt[R.a[i]][R.z[i]]++;
  AZ=cnt.map((x,a)=>a==D.areas.length-1?3:x.slice(0,3).indexOf(Math.max(...x.slice(0,3))));
  Z0=R.z.slice();ZO={};try{ZON=JSON.parse(localStorage.getItem('wk-zon')||'{}')}catch(e){ZON={}}
  D.areas.forEach((n,i)=>{if(ZON[n]!==undefined){ZO[i]=ZON[n];AZ[i]=ZON[n]}});
  recZ();HAS=CON.length>0;
  const pl=$('#perLbl');if(pl)pl.textContent=M.period;const fp=$('#fP');if(fp)fp.innerHTML='<option>'+M.period+'</option>';
  fillSel('#fT',D.types,'All types');fillSel('#fZ',D.zones,'All zones');F.t='';F.z='';
  ST.cons.zone='';ST.cons.area='';ST.cons.page=1;ST.cons.sel.clear();ST.exp.cols=null;ST.exp.areas=new Set();ST.exp.zone='';ST.exp.cf=[];
  colIndexCache=null}
async function rebuild(){
  MG=Engine.merge(FILES);applyData(Engine.build(MG,FILES));rerender()}
async function boot(){
  try{FILES=await Store.all()}catch(e){FILES=[]}
  if(FILES.length){try{await rebuild()}catch(e){console.error(e);toast('Saved data could not be read: '+e.message)}}
  route()}
/* ================= CONSUMERS ================= */
const payOf=c=>c.b<=0?['No bill','']:c.p<=0?['Not paid','r']:c.p>=c.b?['Paid','g']:['Part paid','y'];
function consList(){const s=ST.cons,q=s.q.trim().toLowerCase();let l=CON;
  if(s.zone!=='')l=l.filter(c=>c.z==s.zone);
  if(s.area!=='')l=l.filter(c=>c.a==s.area);
  if(q)l=l.filter(c=>{if(!c.hay)c.hay=(c.no+' '+c.name+' '+c.addr+' '+D.areas[c.a]+' '+c.ph).toLowerCase();return c.hay.includes(q)});
  if(s.sort){const k=s.sort;l=l.slice().sort((a,b)=>(typeof a[k]=='string'?a[k].localeCompare(b[k]):a[k]-b[k])*s.dir)}
  return l}
function sortBy(k){const s=ST.cons;if(s.sort==k){if(s.dir==1)s.dir=-1;else{s.sort='';s.dir=1}}else{s.sort=k;s.dir=1}s.page=1;rerender()}
function togSel(no){const s=ST.cons.sel;s.has(no)?s.delete(no):s.add(no);rerender()}
function togPage(on){const s=ST.cons;const l=consList().slice((s.page-1)*s.per,s.page*s.per);l.forEach(r=>on?s.sel.add(r.no):s.sel.delete(r.no));rerender()}
function areasInZone(z){const m=new Map();for(const c of CON){if(z!==''&&c.z!=z)continue;m.set(c.a,(m.get(c.a)||0)+1)}const O=D.areas.length-1;return [...m.entries()].sort((a,b)=>(a[0]==O)-(b[0]==O)||b[1]-a[1])}
function renderConsumers(){
  const s=ST.cons,l=consList(),pages=Math.max(1,Math.ceil(l.length/s.per));if(s.page>pages)s.page=pages;const pg=l.slice((s.page-1)*s.per,s.page*s.per);
  const th=(k,t,n)=>`<th class="${n?'n':''}" style="cursor:pointer" onclick="sortBy('${k}')">${t}${s.sort==k?(s.dir>0?' ↑':' ↓'):''}</th>`;
  const zopt=D.zones.map((z,i)=>`<option value="${i}" ${s.zone===String(i)||s.zone===i?'selected':''}>${z}</option>`).join('');
  const aopt=areasInZone(s.zone).map(([a,n])=>`<option value="${a}" ${String(s.area)===String(a)?'selected':''}>${D.areas[a]} (${fN(n)})</option>`).join('');
  $('#p-consumers').innerHTML=hd('Consumers','Every consumer in the order the files were uploaded. Search, or narrow by zone and area.',`<button class="btn" onclick="toast('Opens the Consumer registration form from Form builder')">Add consumer</button><button class="btn pri" onclick="ST.exp.scope='view';go('export')">Export</button>`)+
  dn('Consumers',['Rows keep the sequence of your uploaded file; click a column title to sort and click again to go back to the file order.','Zone and area narrow the list. Area choices only show areas that exist in the chosen zone.','Export opens its own page where you pick zone, areas, filters and exactly which columns to download.'],L('table','saved'))+
  `<div class="grid" style="margin-bottom:16px">${kpi('In consumer master',fN(M.master),'Consumer data file','users')}${kpi('Active',fN(M.active),pc(M.active,M.master)+' of master','users')}${kpi('Inactive',fN(M.inactive),'Stopped or deactivated','due')}${kpi('Billed in '+M.period,fN(M.billrows),fN(M.billonly)+' not in master','bill')}</div>`+
  `<div class="card"><div class="tb">
   <input type="text" id="cq" placeholder="Search name, number, phone or address" value="${s.q.replace(/"/g,'&quot;')}" oninput="ST.cons.q=this.value;ST.cons.page=1;rr()" style="min-width:280px">
   <select id="czs" onchange="ST.cons.zone=this.value;ST.cons.area='';ST.cons.page=1;rerender()"><option value="">All zones</option>${zopt}</select>
   <select id="cas" onchange="ST.cons.area=this.value;ST.cons.page=1;rerender()"><option value="">All areas</option>${aopt}</select>
   <span class="sp"></span><label class="chk"><input type="checkbox" ${s.dense?'checked':''} onchange="setST('cons.dense',this.checked)"> Compact</label></div>
   ${s.sel.size?`<div class="bulk">${s.sel.size} selected<span class="sp" style="flex:1"></span><button class="btn sm" onclick="toast('Reminders queued for ${s.sel.size} consumers (sample)')">Send reminder</button><button class="btn sm" onclick="ST.exp.scope='selected';go('export')">Export selected</button><button class="btn sm" onclick="ST.cons.sel.clear();rerender()">Clear</button></div>`:''}
   <div class="tw free"><table class="${s.dense?'dense':''}"><thead><tr><th style="width:34px"><input type="checkbox" aria-label="Select page" onchange="togPage(this.checked)"></th>${th('name','Consumer')}<th>Area</th><th>Zone</th>${th('cat','Category')}<th>Service</th>${th('b','Billed',1)}${th('p','Paid',1)}${th('bal','Balance',1)}<th>Payment</th><th>Status</th></tr></thead><tbody>
   ${pg.length?pg.map(r=>{const p=payOf(r);return `<tr class="clk ${s.sel.has(r.no)?'sel':''}" onclick="openCons('${r.no}')"><td onclick="event.stopPropagation()"><input type="checkbox" ${s.sel.has(r.no)?'checked':''} onchange="togSel('${r.no}')" aria-label="Select ${r.name.replace(/"/g,'')}"></td><td><b>${r.name}</b><br><span style="color:var(--mu);font-size:11.5px">${r.no}</span></td><td>${D.areas[r.a]}</td><td>${D.zones[r.z]}</td><td>${r.cat}</td><td>${r.svc}</td><td class="n">${r.hb?fN(r.b):'—'}</td><td class="n">${r.hb?fN(r.p):'—'}</td><td class="n"><b>${r.hb?fN(r.bal):'—'}</b></td><td>${r.hb?pill(p[0],p[1]):pill('Not billed','')}</td><td>${pill(r.st,r.st=='Active'?'g':'r')}</td></tr>`}).join(''):`<tr><td colspan="11" class="empty">No consumer matches these filters. Clear a filter or search for another name.</td></tr>`}
   </tbody></table></div>
   <div class="pager"><span>${l.length?`${(s.page-1)*s.per+1}–${Math.min(l.length,s.page*s.per)} of ${fN(l.length)}`:'0 results'} consumers</span><select onchange="ST.cons.per=+this.value;ST.cons.page=1;rerender()">${[15,25,50,100].map(n=>`<option ${n==s.per?'selected':''} value="${n}">${n} per page</option>`).join('')}</select><button class="btn sm" ${s.page<=1?'disabled':''} onclick="setST('cons.page',1)">First</button><button class="btn sm" ${s.page<=1?'disabled':''} onclick="setST('cons.page',${s.page-1})">Previous</button><span>Page ${s.page} of ${fN(pages)}</span><button class="btn sm" ${s.page>=pages?'disabled':''} onclick="setST('cons.page',${s.page+1})">Next</button></div></div>`}
function openCons(no){const r=CMAP.get(no);if(!r)return;const p=payOf(r);const row=MG.rows[r.ri];
  const esc=v=>String(v).replace(/</g,'&lt;');
  $('#drawer').innerHTML=`<div style="display:flex;gap:12px;align-items:center"><div class="av" style="width:48px;height:48px">${ini(r.name)}</div><div style="flex:1"><h3 style="font-size:18px">${esc(r.name)}</h3><span style="color:var(--mu)">Consumer ${r.no}</span></div><button class="ibtn" onclick="closeAll()" aria-label="Close">×</button></div>
  <div style="margin:16px 0">${pill(r.st,r.st=='Active'?'g':'r')} ${r.hb?pill(p[0],p[1]):''} ${pill(r.cat)}</div>
  ${r.hb?`<div class="card" style="margin-bottom:14px"><div class="kv"><div><span>Billed ${M.period}</span><b class="big">${fN(r.b)}</b></div><div><span>Paid</span><b class="big">${fN(r.p)}</b></div><div><span>Balance</span><b class="big" style="color:${r.bal>0?'var(--bad)':'var(--good)'}">${fN(r.bal)}</b></div><div><span>Paid share</span><b class="big">${r.b>0?Math.round(100*r.p/r.b):0}%</b></div></div><div class="meter ${r.p<=0?'b':''}"><i style="width:${r.b>0?Math.min(100,100*r.p/r.b):0}%"></i></div></div>`:''}
  <div class="card" style="margin-bottom:14px"><h3 style="margin-bottom:12px">Details</h3><div class="kv"><div><span>Address</span><b>${esc(r.addr||'—')}</b></div><div><span>Area</span><b>${D.areas[r.a]}</b></div><div><span>Zone</span><b>${D.zones[r.z]}</b></div><div><span>Plot size</span><b>${r.marla!=null?r.marla+' marla':'Not recorded'}</b></div><div><span>Service</span><b>${r.svc}</b></div><div><span>Sub-category</span><b>${esc(r.sub)}</b></div><div><span>Phone</span><b>${esc(r.ph)}</b></div></div></div>
  <div class="card" style="margin-bottom:14px"><h3 style="margin-bottom:12px">All columns</h3><div class="kv">${MG.cols.map((c,j)=>row[j]===''?'':`<div><span>${esc(c)}</span><b>${esc(row[j])}</b></div>`).join('')}</div></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" onclick="toast('Reminder queued (sample)')">Send reminder</button><button class="btn" onclick="reqChange('${r.no}')">Request a change</button><button class="btn" onclick="toast('Bill print is part of the full build')">Print bill</button></div>`;openDr()}
/* ================= EXPORT ================= */
let colIndexCache=null;
function colIdx(c){if(!colIndexCache){colIndexCache=new Map(MG.cols.map((x,i)=>[x,i]))}return colIndexCache.get(c)}
const payKey=c=>!c.hb||c.b<=0?'nobill':c.p<=0?'unpaid':c.p>=c.b?'paid':'part';
const PAYTXT={nobill:'No bill',unpaid:'Not paid',part:'Part paid',paid:'Paid'};
function cellOf(c,col){
  if(col=='Zone')return D.zones[c.z];if(col=='Area Name')return D.areas[c.a];if(col=='Consumer Type')return c.t?'Commercial':'Residential';if(col=='Payment Status')return PAYTXT[payKey(c)];
  const j=colIdx(col);return j===undefined?'':MG.rows[c.ri][j]}
const OPS=[['contains','contains'],['eq','is equal to'],['ne','is not'],['starts','starts with'],['empty','is empty'],['filled','is not empty'],['gt','is more than'],['lt','is less than'],['between','is between']];
function passCF(c,f){if(!f.col)return true;const v=cellOf(c,f.col),sv=String(v).toLowerCase(),a=String(f.v||'').toLowerCase().trim();
  switch(f.op){case 'contains':return a===''||sv.includes(a);case 'eq':return sv===a||(!isNaN(+v)&&v!==''&&a!==''&&+v===+a);case 'ne':return !(sv===a);case 'starts':return sv.startsWith(a);
    case 'empty':return v==='';case 'filled':return v!=='';
    case 'gt':return a===''||(v!==''&&(isNaN(+v)?sv>a:+v>+a));case 'lt':return a===''||(v!==''&&(isNaN(+v)?sv<a:+v<+a));
    case 'between':{const b=String(f.v2||'').toLowerCase().trim();if(a===''||b==='')return true;if(v==='')return false;return isNaN(+v)?(sv>=a&&sv<=b):(+v>=+a&&+v<=+b)}}return true}
function expList(){const e=ST.exp;let l=e.scope=='selected'?CON.filter(c=>ST.cons.sel.has(c.no)):e.scope=='view'?consList():CON;
  if(e.zone!=='')l=l.filter(c=>c.z==e.zone);
  if(e.areas.size)l=l.filter(c=>e.areas.has(c.a));
  if(e.type!=='')l=l.filter(c=>c.t==e.type);
  if(e.status!=='')l=l.filter(c=>c.sti==e.status);
  if(e.pay!=='')l=l.filter(c=>payKey(c)==e.pay);
  if(e.minBal!==''&&!isNaN(+e.minBal))l=l.filter(c=>c.hb&&c.bal>=+e.minBal);
  for(const f of e.cf)if(f.col)l=l.filter(c=>passCF(c,f));
  if(e.mode=='def'){l=l.filter(c=>c.hb&&c.bal>0).sort((a,b)=>b.bal-a.bal);if(+e.topN>0)l=l.slice(0,+e.topN)}
  return l}
function allCols(){return MG.cols.concat(DERIVED)}
function defCols(){const want=['CONSUMER_NO','CONSUMER_NAME','CONTACT_NO','ADDRESS','CATEGORY','COMM_CATEGORY','AREA','SERVICE_NAME','STATUS','BILL_AMOUNT','PAID_AMOUNT','BALANCE'];const have=new Set(allCols());return want.filter(c=>have.has(c)).concat(['Zone','Area Name'])}
function xs(path,v,rer){const p=path.split('.');let o=ST.exp;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=v;if(rer!==false)rerender()}
function expToggleArea(a){const s=ST.exp.areas;s.has(a)?s.delete(a):s.add(a);rerender()}
function expColToggle(c){const a=ST.exp.cols,i=a.indexOf(c);i<0?a.push(c):a.splice(i,1);rerender()}
function expColMove(i,d){const a=ST.exp.cols,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];rerender()}
function expColsSet(w){const e=ST.exp;if(w=='all')e.cols=allCols().slice();else if(w=='none')e.cols=[];else e.cols=defCols();rerender()}
function expAddCF(){ST.exp.cf.push({col:allCols()[0],op:'contains',v:'',v2:''});rerender()}
function expCF(i,k,v,rer){ST.exp.cf[i][k]=v;if(rer)rerender();else renderExportPreview()}
function expDelCF(i){ST.exp.cf.splice(i,1);rerender()}
function renderExport(){
  const e=ST.exp;if(!e.cols)e.cols=defCols();
  const cols=allCols();
  const l=expList();let B=0,P=0,BAL=0;for(const c of l)if(c.hb){B+=c.b;P+=c.p;BAL+=c.bal}
  const zopt=D.zones.map((z,i)=>`<option value="${i}" ${String(e.zone)===String(i)?'selected':''}>${z}</option>`).join('');
  const aq=e.areaq.toLowerCase();const ar=areasInZone(e.zone).filter(([a])=>!aq||D.areas[a].toLowerCase().includes(aq));
  const cq=e.colq.toLowerCase();const clist=cols.filter(c=>!cq||c.toLowerCase().includes(cq));
  const src=c=>DERIVED.includes(c)?'Derived':MG.colSrc[colIdx(c)]||'';
  const scopeTxt={all:'All consumers',view:'Consumers list as filtered',selected:ST.cons.sel.size+' selected consumers'}[e.scope];
  $('#p-export').innerHTML=hd('Export data','Choose the records, then the columns. Download as Excel or CSV in file order.',`<button class="btn" onclick="go('consumers')">Back to consumers</button>`)+
  dn('Export',['Step 1 picks which consumers (zone, areas, type, payment). Step 2 adds any column from any uploaded file as a filter. Step 3 picks the columns and their order.','Top defaulters lists the highest outstanding balances inside the same zone and area choices.','The Excel file has a Data sheet with a header row, filters and frozen panes, plus a Report info sheet with the choices and totals.'],L('table'))+
  `<div class="grid">
  <div class="card s5"><h3>1 · Which consumers</h3><div class="sub" style="margin-bottom:12px">Start from: ${scopeTxt}</div>
   <div class="fg" style="grid-template-columns:1fr 1fr">
    <label>Start from<select onchange="xs('scope',this.value)"><option value="all" ${e.scope=='all'?'selected':''}>All consumers</option><option value="view" ${e.scope=='view'?'selected':''}>Consumers list filter</option><option value="selected" ${e.scope=='selected'?'selected':''}>Selected consumers (${ST.cons.sel.size})</option></select></label>
    <label>Report<select onchange="xs('mode',this.value)"><option value="list" ${e.mode=='list'?'selected':''}>Consumer list</option><option value="def" ${e.mode=='def'?'selected':''}>Top defaulters</option></select></label>
    <label>Zone<select onchange="ST.exp.zone=this.value;ST.exp.areas=new Set();rerender()"><option value="">All zones</option>${zopt}</select></label>
    <label>Consumer type<select onchange="xs('type',this.value)"><option value="">Total (both)</option><option value="0" ${e.type==='0'?'selected':''}>Residential</option><option value="1" ${e.type==='1'?'selected':''}>Commercial</option></select></label>
    <label>Status<select onchange="xs('status',this.value)"><option value="">All</option><option value="0" ${e.status==='0'?'selected':''}>Active</option><option value="1" ${e.status==='1'?'selected':''}>Inactive</option><option value="2" ${e.status==='2'?'selected':''}>Not in master</option></select></label>
    <label>Payment<select onchange="xs('pay',this.value)"><option value="">All</option>${Object.entries(PAYTXT).map(([k,v])=>`<option value="${k}" ${e.pay==k?'selected':''}>${v}</option>`).join('')}</select></label>
    <label>Minimum balance (Rs)<input type="number" value="${e.minBal}" placeholder="0" onchange="xs('minBal',this.value)"></label>
    ${e.mode=='def'?`<label>How many top defaulters<input type="number" min="0" value="${e.topN}" onchange="xs('topN',this.value)"><span style="font-weight:500">0 means all with a balance</span></label>`:'<span></span>'}
   </div>
   <h3 style="margin:18px 0 6px">Areas${e.zone!==''?' in '+D.zones[e.zone]:''}</h3><div class="sub" style="margin-bottom:8px">${e.areas.size?e.areas.size+' areas chosen':'No area chosen means every area'}</div>
   <div class="tb" style="margin-bottom:8px"><input type="text" id="eaq" placeholder="Find an area" value="${e.areaq}" oninput="ST.exp.areaq=this.value;rr()"><button class="btn sm" onclick="ar_all()">Choose shown</button><button class="btn sm" onclick="ST.exp.areas=new Set();rerender()">Clear</button></div>
   <div class="tw" style="max-height:300px">${ar.map(([a,n])=>`<label class="chk" style="padding:5px 4px;border-bottom:1px solid var(--bd)"><input type="checkbox" ${e.areas.has(a)?'checked':''} onchange="expToggleArea(${a})"><span style="flex:1;color:var(--tx)">${D.areas[a]}</span><span>${fN(n)}</span></label>`).join('')||'<div class="empty">No areas</div>'}</div>
  </div>
  <div class="card s7"><h3>2 · Filter by any column</h3><div class="sub" style="margin-bottom:12px">All ${cols.length} columns from your files can be used here</div>
   ${e.cf.map((f,i)=>`<div class="tb" style="margin-bottom:8px"><select onchange="expCF(${i},'col',this.value,1)" style="max-width:200px">${cols.map(c=>`<option ${c==f.col?'selected':''}>${c}</option>`).join('')}</select><select onchange="expCF(${i},'op',this.value,1)">${OPS.map(o=>`<option value="${o[0]}" ${o[0]==f.op?'selected':''}>${o[1]}</option>`).join('')}</select>${f.op=='empty'||f.op=='filled'?'':`<input type="text" value="${String(f.v).replace(/"/g,'&quot;')}" placeholder="Value" onchange="expCF(${i},'v',this.value,1)" style="min-width:100px;max-width:150px">`}${f.op=='between'?`<input type="text" value="${String(f.v2).replace(/"/g,'&quot;')}" placeholder="and" onchange="expCF(${i},'v2',this.value,1)" style="min-width:100px;max-width:150px">`:''}<button class="btn sm bad" onclick="expDelCF(${i})">Remove</button></div>`).join('')||'<div class="empty" style="padding:8px 0">No column filters yet.</div>'}
   <button class="btn sm" onclick="expAddCF()">+ Add filter</button>
   <h3 style="margin:22px 0 6px">3 · Columns to download</h3><div class="sub" style="margin-bottom:8px">${e.cols.length} of ${cols.length} columns chosen</div>
   <div class="tb" style="margin-bottom:8px"><input type="text" id="ecq" placeholder="Find a column" value="${e.colq}" oninput="ST.exp.colq=this.value;rr()"><button class="btn sm" onclick="expColsSet('all')">All columns</button><button class="btn sm" onclick="expColsSet('def')">Standard</button><button class="btn sm" onclick="expColsSet('none')">None</button></div>
   <div class="fbw" style="grid-template-columns:1fr 1fr;gap:12px">
    <div class="tw" style="max-height:300px">${clist.map(c=>`<label class="chk" style="padding:5px 4px;border-bottom:1px solid var(--bd)"><input type="checkbox" ${e.cols.includes(c)?'checked':''} onchange="expColToggle('${c.replace(/'/g,"\\'")}')"><span style="flex:1;color:var(--tx)">${c}</span><span style="font-size:11px">${src(c).slice(0,18)}</span></label>`).join('')}</div>
    <div class="tw" style="max-height:300px">${e.cols.map((c,i)=>`<div class="tb" style="gap:4px;margin:0;padding:4px 0;border-bottom:1px solid var(--bd)"><span style="flex:1;font-size:12.5px">${i+1}. ${c}</span><button class="btn sm" onclick="expColMove(${i},-1)" aria-label="Move up">↑</button><button class="btn sm" onclick="expColMove(${i},1)" aria-label="Move down">↓</button><button class="btn sm bad" onclick="expColToggle('${c.replace(/'/g,"\\'")}')" aria-label="Remove">×</button></div>`).join('')||'<div class="empty">Choose at least one column</div>'}</div>
   </div>
   <label class="chk" style="margin-top:12px"><input type="checkbox" ${e.noPersonal?'checked':''} onchange="xs('noPersonal',this.checked)"> Leave out CNIC, phone, email and father name</label>
  </div>
  <div class="card s12"><div class="ch"><div><h3>Result</h3><div class="sub" id="expSum"></div></div><div class="r"><select onchange="xs('fmt',this.value,false)"><option value="xlsx" ${e.fmt=='xlsx'?'selected':''}>Excel (.xlsx)</option><option value="csv" ${e.fmt=='csv'?'selected':''}>CSV (.csv)</option></select><button class="btn pri" onclick="doExport()">Download</button></div></div><div id="expPrev"></div></div></div>`;
  renderExportPreview(l,B,P,BAL)}
function ar_all(){const e=ST.exp,aq=e.areaq.toLowerCase();areasInZone(e.zone).filter(([a])=>!aq||D.areas[a].toLowerCase().includes(aq)).forEach(([a])=>e.areas.add(a));rerender()}
function expCols(){const e=ST.exp;return e.cols.filter(c=>!(e.noPersonal&&PERSONAL.includes(c)))}
function renderExportPreview(l,B,P,BAL){const e=ST.exp;if(!l){l=expList();B=P=BAL=0;for(const c of l)if(c.hb){B+=c.b;P+=c.p;BAL+=c.bal}}
  const cols=expCols();const s=$('#expSum');if(s)s.textContent=`${fN(l.length)} consumers · billed ${fM(B)} · paid ${fM(P)} · balance ${fM(BAL)}`;
  const t=$('#expPrev');if(!t)return;
  t.innerHTML=cols.length?`<div class="tw" style="max-height:340px"><table class="dense"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${l.slice(0,10).map(c=>`<tr>${cols.map(k=>{const v=cellOf(c,k);return `<td${typeof v=='number'?' class="n"':''}>${String(v).replace(/</g,'&lt;')}</td>`}).join('')}</tr>`).join('')}</tbody></table></div><div class="note" style="margin-top:8px">Preview shows the first 10 of ${fN(l.length)} rows.</div>`:'<div class="empty">Choose at least one column to download.</div>'}
function describeFilters(){const e=ST.exp,o=[];o.push(['Start from',{all:'All consumers',view:'Consumers list filter',selected:'Selected consumers'}[e.scope]]);
  o.push(['Report',e.mode=='def'?'Top defaulters'+(+e.topN>0?' (top '+e.topN+')':' (all with balance)'):'Consumer list']);
  o.push(['Zone',e.zone===''?'All':D.zones[e.zone]]);o.push(['Areas',e.areas.size?[...e.areas].map(a=>D.areas[a]).join(', '):'All']);
  o.push(['Type',e.type===''?'Total':e.type=='0'?'Residential':'Commercial']);o.push(['Status',e.status===''?'All':['Active','Inactive','Not in master'][e.status]]);
  o.push(['Payment',e.pay===''?'All':PAYTXT[e.pay]]);if(e.minBal!=='')o.push(['Minimum balance',e.minBal]);
  e.cf.filter(f=>f.col).forEach(f=>o.push(['Column filter',f.col+' '+(OPS.find(x=>x[0]==f.op)||[])[1]+' '+(f.op=='empty'||f.op=='filled'?'':f.v+(f.op=='between'?' and '+f.v2:''))]));return o}
async function doExport(){const e=ST.exp,cols=expCols();if(!cols.length){toast('Choose at least one column');return}
  const l=expList();if(!l.length){toast('No consumers match these choices');return}
  toast('Preparing '+fN(l.length)+' rows…');await new Promise(r=>setTimeout(r,30));
  const rows=l.map(c=>cols.map(k=>cellOf(c,k)));
  const parts=[e.zone===''?'AllZones':D.zones[e.zone].replace(' ',''),e.areas.size==1?[...e.areas].map(a=>D.areas[a].replace(/\s+/g,'')).join(''):e.areas.size>1?e.areas.size+'Areas':'',e.type===''?'':e.type=='0'?'Residential':'Commercial',e.mode=='def'?'TopDefaulters':'Consumers'].filter(Boolean);
  const name='WASA_Kasur_'+parts.join('_')+'_'+new Date().toISOString().slice(0,10);let blob,ext;
  try{
    if(e.fmt=='csv'){blob=XLSXIO.toCSV(cols,rows);ext='csv'}
    else{let B=0,P=0,BAL=0;for(const c of l)if(c.hb){B+=c.b;P+=c.p;BAL+=c.bal}
      const info=[['Report','WASA Kasur · '+(e.mode=='def'?'Top defaulters':'Consumer export')],['Generated',new Date().toLocaleString('en-GB')],['Billing period',M.period],['Records',l.length],...describeFilters(),['Total billed',B],['Total paid',P],['Total balance',BAL],['Columns',cols.join(', ')],['Source files',FILES.map(f=>f.name).join(', ')]];
      blob=await XLSXIO.writeXlsx([{name:'Data',cols,rows},{name:'Report info',cols:['Item','Value'],rows:info,noFreeze:true,noFilter:true}]);ext='xlsx'}
  }catch(err){console.error(err);toast('Export failed: '+err.message);return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.'+ext;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);
  logAct('upload','exported data',name+'.'+ext,fN(l.length)+' rows · '+cols.length+' columns');toast('Downloaded '+name+'.'+ext)}
/* ================= DATA CENTRE ================= */
const KIND={bill:['Bill collection','y'],master:['Consumer master','g'],other:['Other data','']};
let UPMSG='';
function setUpMsg(m){UPMSG=m;const e=$('#upst');if(e)e.textContent=m}
async function handleFiles(list){const arr=[...list];if(!arr.length)return;
  for(const f of arr){
    try{setUpMsg('Reading '+f.name+' …');await new Promise(r=>setTimeout(r,30));
      const d=await XLSXIO.readFile(f);const kind=Engine.kind(d.cols);
      if(kind=='invalid'){toast(f.name+': a CONSUMER_NO column is needed');setUpMsg(f.name+' was not added: no CONSUMER_NO column');continue}
      const rec={id:Date.now()+'-'+Math.random().toString(36).slice(2,6),order:(FILES.reduce((m,x)=>Math.max(m,x.order),0))+1,name:f.name,kind,cols:d.cols,rows:d.rows,at:new Date().toISOString(),size:f.size};
      await Store.put(rec);FILES.push(rec);logAct('upload','uploaded a file',f.name,fN(d.rows.length)+' rows · '+d.cols.length+' columns');
      setUpMsg('Joining '+f.name+' with the other files …');await new Promise(r=>setTimeout(r,30))
    }catch(err){console.error(err);toast(f.name+': '+err.message);setUpMsg(f.name+' could not be read: '+err.message)}}
  try{await rebuild();setUpMsg('Done. '+fN(CON.length)+' consumers and '+MG.cols.length+' columns are ready.');toast('Data ready')}catch(err){console.error(err);toast('Could not join the files: '+err.message)}}
async function removeFile(id){const f=FILES.find(x=>x.id==id);if(!f||!confirm('Remove '+f.name+'? Columns that only this file has will disappear.'))return;
  await Store.del(id);FILES=FILES.filter(x=>x.id!=id);logAct('upload','removed a file',f.name);if(FILES.length)await rebuild();else{await clearAll(true)}toast('File removed')}
async function clearAll(silent){if(!silent&&!confirm('Delete all uploaded data from this browser?'))return;
  await Store.clear();FILES=[];MG={cols:[],colSrc:[],rows:[]};applyData(Engine.build(MG,FILES));HAS=false;rerender();if(!silent)toast('All data removed from this browser')}
function reviewItems(){const o=[];
  if(M.billonly)o.push([fN(M.billonly)+' billed consumers are missing from the master','They show as “Not in master” on the dashboard.','r']);
  if(M.hasMaster&&M.hasBill&&M.masteronlyActive>0||M.masteronly_active)o.push([fN(M.masteronly_active)+' active consumers were not billed in '+M.period,'Check whether they are new connections or missed in billing.','y']);
  if(M.neg)o.push([fN(M.neg)+' consumers have a credit balance','Advance payments of '+fM(-M.negsum)+' lower the total due.','y']);
  if(!M.hasBill)o.push(['No bill collection file yet','Upload the bill report to see billed and collected amounts.','y']);
  if(!M.hasMaster)o.push(['No consumer master file yet','Upload the consumer file to see category, area, address and status.','y']);
  return o}
function renderUpload(){
  const fl=FILES;
  $('#p-upload').innerHTML=hd('Data center','Upload Excel (.xlsx) or CSV files. They are joined on consumer number, in the order you upload them.',HAS?`<button class="btn bad" onclick="clearAll()">Remove all data</button>`:'')+
  `<div class="grid"><div class="card s7"><div class="ch"><div><h3>Upload files</h3><div class="sub">Choose several files at once. A new file with new columns adds those columns to the system.</div></div></div>
   <div class="drop" data-udrop><b style="color:var(--tx)">Drop files here</b><br>or <u>browse</u><input type="file" id="upin" accept=".xlsx,.xlsm,.csv" multiple hidden></div>
   <div class="note" id="upst" style="margin-top:12px">${UPMSG||'Your files stay in this browser. Nothing is sent anywhere unless you turn on cloud sync below.'}</div></div>
  <div class="card s5"><h3>Things to review</h3>${reviewItems().map(x=>`<div class="row"><span class="pill ${x[2]}">${x[2]=='r'?'Fix':'Check'}</span><div class="tx"><b>${x[0]}</b><span>${x[1]}</span></div></div>`).join('')||'<div class="empty">Upload a file to see checks here.</div>'}</div>
  <div class="card s12"><h3>Uploaded files</h3><div class="sub" style="margin-bottom:10px">Rows follow this order. A later file fills in or refreshes columns for consumers it shares with earlier files.</div>
   ${fl.length?`<div class="tw free"><table><thead><tr><th>#</th><th>File</th><th>Type</th><th class="n">Rows</th><th class="n">Columns</th><th>Uploaded</th><th></th></tr></thead><tbody>${fl.map((f,i)=>`<tr><td>${i+1}</td><td><b>${f.name}</b></td><td>${pill(KIND[f.kind][0],KIND[f.kind][1])}</td><td class="n">${fN(f.rows.length)}</td><td class="n">${f.cols.length}</td><td>${new Date(f.at).toLocaleString('en-GB')}</td><td><button class="btn sm bad" onclick="removeFile('${f.id}')">Remove</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No files yet.</div>'}</div>
  ${HAS?`<div class="card s7"><h3>How the files match on consumer number</h3><div class="sub" style="margin-bottom:16px">${fN(CON.length)} consumers in total</div>${bars([{n:'Matched',v:M.matched,c:'var(--good)',x:fN(M.matched),s:pc(M.matched,M.billrows)+' of billed'},{n:'Billed, not in master',v:M.billonly,c:'var(--bad)',x:fN(M.billonly),s:'need a master record'},{n:'In master, not billed',v:M.masteronly,c:'var(--a4)',x:fN(M.masteronly),s:fN(M.masteronly_active)+' of them active'}])}</div>
  <div class="card s5"><h3>System columns</h3><div class="sub" style="margin-bottom:10px">${MG.cols.length} from files · ${DERIVED.length} derived</div><div class="tw" style="max-height:260px"><table class="dense"><tbody>${MG.cols.map((c,i)=>`<tr><td>${c}</td><td style="color:var(--mu)">${(MG.colSrc[i]||'').slice(0,26)}</td></tr>`).join('')}${DERIVED.map(c=>`<tr><td>${c}</td><td style="color:var(--mu)">Derived</td></tr>`).join('')}</tbody></table></div></div>`:''}
  ${cloudCard()}</div>`}
/* drag and drop for the data centre */
document.addEventListener('change',e=>{if(e.target.id=='upin'){handleFiles(e.target.files);e.target.value=''}});
document.addEventListener('click',e=>{const d=e.target.closest('[data-udrop]');if(d&&e.target.tagName!='INPUT')d.querySelector('input').click()});
['dragover','drop','dragleave'].forEach(ev=>document.addEventListener(ev,e=>{const d=e.target.closest('[data-udrop]');if(!d)return;e.preventDefault();d.classList.toggle('over',ev=='dragover');if(ev=='drop')handleFiles(e.dataTransfer.files)}));
