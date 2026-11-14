/* engine.js — merges uploaded files on CONSUMER_NO (in upload order) and builds dashboard data. */
(function(g){
const nk=s=>String(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
const ALIAS={no:['CONSUMERNO','CONSUMERNUMBER','CONSUMERNUM'],name:['CONSUMERNAME'],cat:['CATEGORY'],comm:['COMMCATEGORY','COMMERCIALCATEGORY'],sub:['SUBCATEGORY'],svc:['SERVICENAME','SERVICE'],marla:['AREA'],addr:['ADDRESS'],bill:['BILLAMOUNT'],paid:['PAIDAMOUNT'],bal:['BALANCE'],status:['STATUS'],walk:['WALKSORT'],phone:['CONTACTNO','PHONE','MOBILE'],period:['PERIODNAME','PERIOD']};
const CATS=['Residential','A1','A','B','C','D','E','F','G','H','Govt'];
const SVCS=['Water & Sewer','Aquifer Water & Sewer','Sewer','Aquifer Sewer','Aquifer Water','Water','Other / unmapped'];
const MARLAS=['Up to 1','1–2','2–3','3–4','4–5','5–6','6 and above','Not recorded'];
const ZONES=['Zone 1','Zone 2','Zone 3','Unassigned'];
const MAX_AREAS=200;
function kind(cols){const s=new Set(cols.map(nk));
  const has=k=>ALIAS[k].some(a=>s.has(a));
  if(!has('no'))return 'invalid';
  if(has('bill')||has('paid'))return 'bill';
  if(has('status')||has('name'))return 'master';
  return 'other'}
function normArea(a){a=String(a==null?'':a).toUpperCase().replace(/[^A-Z0-9 ]/g,' ').replace(/\bKASUR\b/g,' ').replace(/\s+/g,' ').trim();
  const R=[[/^BHASS?AR PURA.*/,'BHASSAR PURA'],[/^PEER[UO] WALA ROAD.*/,'PEERU WALA ROAD'],[/^KOT ALI G[AH][AR]H?$/,'KOT ALI GARH'],[/^(QADIRABAD|QADAR ABAD|BASTI QADRA ABAD).*/,'QADIRABAD'],[/^RU?KA?N PURA.*/,'RUKN PURA'],[/^BASTI CH[AI]RAGH SHAH.*/,'BASTI CHIRAGH SHAH'],[/^RASOOL PUR.*/,'RASOOL PURA']];
  for(const [p,r] of R)if(p.test(a))return r;return a||'UNKNOWN'}
const title=s=>s.toLowerCase().replace(/(^|\s)([a-z])/g,(_,a,b)=>a+b.toUpperCase());
function shortSub(s){s=String(s).replace('Private Schools/Colleges/Educational/Institutions/Academies','Private schools & colleges').replace('Any other activity having one wash room only','Other activity · 1 washroom').replace('Any other activity having two wash rooms','Other activity · 2 washrooms').replace('Chargha Houses/ Dhabas/ Eateries shops','Chargha houses / dhabas').replace('Shoe Shop etc. (with hand washing facility)','Shoe shops').replace('Restaurants/ Café/ Eateries (200 to 400 sq. feet covered area)','Restaurants / cafés (200–400 sq ft)').replace('Offices including Government (Federal / Provincial / Attached / Autonomous Bodies)','Offices incl. government');
  return s.length<=36?s:s.slice(0,34)+'…'}
const num=v=>typeof v==='number'?v:(v===''||v==null?NaN:parseFloat(String(v).replace(/,/g,'')));
/* ---- merge files in upload order ---- */
function merge(files){
  const cols=[],colSrc=[],reg=new Map(),keyMap=new Map(),rows=[];const issues=[];
  for(const f of files){
    const kj=f.cols.findIndex(c=>ALIAS.no.includes(nk(c)));
    if(kj<0){issues.push(f.name+': no CONSUMER_NO column, skipped');continue}
    const map=f.cols.map((c,j)=>{const k=nk(c);if(!reg.has(k)){reg.set(k,cols.length);cols.push(c);colSrc.push(f.name)}return reg.get(k)});
    let dup=0;
    for(const r of f.rows){const key=String(r[kj]).trim();if(!key)continue;
      let ri=keyMap.get(key);let row;
      if(ri===undefined){row=[];ri=rows.length;keyMap.set(key,ri);rows.push(row)}else{row=rows[ri];dup++}
      for(let j=0;j<r.length;j++){const v=r[j];if(v!==''&&v!=null)row[map[j]]=v}}
    if(dup)issues.push(f.name+': '+dup+' rows matched an earlier row and updated it')}
  for(const r of rows){for(let j=0;j<cols.length;j++)if(r[j]===undefined)r[j]=''}
  return {cols,colSrc,rows,issues}}
/* ---- build dashboard data ---- */
function build(mg,files,opts){
  opts=opts||{};const ci={};for(const k in ALIAS){ci[k]=mg.cols.findIndex(c=>ALIAS[k].includes(nk(c)))}
  const get=(r,k)=>ci[k]<0?'':r[ci[k]];
  const hasBillCol=ci.bill>=0;
  const n=mg.rows.length;
  /* categories present */
  const commSet=new Set();for(const r of mg.rows){if(String(get(r,'cat')).toLowerCase()==='commercial'){let k=String(get(r,'comm')).trim();if(k)commSet.add(/^gov/i.test(k)?'Govt':k)}}
  const extraCats=[...commSet].filter(k=>!CATS.includes(k)).sort();
  const cats=[...CATS.filter((k,i)=>i==0||commSet.has(k)||true),...extraCats];
  const catIdx=k=>{const i=cats.indexOf(k);return i<0?cats.indexOf('Govt'):i};
  /* sub-categories */
  const subCnt=new Map();for(const r of mg.rows)if(String(get(r,'cat')).toLowerCase()==='commercial'){const s=String(get(r,'sub')).trim();if(s)subCnt.set(s,(subCnt.get(s)||0)+1)}
  const topsub=[...subCnt.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(x=>x[0]);
  /* areas */
  const arN=new Array(n),arCnt=new Map();
  for(let i=0;i<n;i++){const a=normArea(get(mg.rows[i],'addr'));arN[i]=a;arCnt.set(a,(arCnt.get(a)||0)+1)}
  const topAr=[...arCnt.entries()].sort((a,b)=>b[1]-a[1]).slice(0,MAX_AREAS).map(x=>x[0]);
  const areaIdx=new Map(topAr.map((a,i)=>[a,i]));
  const areas=topAr.map(title).concat(['Other areas']);const OTH=areas.length-1;
  /* master / status presence */
  const CON=new Array(n);
  let master=0,active=0,inactive=0,billrows=0,matched=0,billonly=0,masteronly=0,masteronlyActive=0,neg=0,negsum=0;const perCnt=new Map();
  for(let i=0;i<n;i++){const r=mg.rows[i];
    const stRaw=String(get(r,'status')).trim().toUpperCase();const stI=stRaw==='ACTIVE'?0:stRaw==='INACTIVE'?1:2;
    const bv=num(get(r,'bill')),pv=num(get(r,'paid')),hb=hasBillCol&&!isNaN(bv);
    const b=hb?Math.round(bv):0,p=isNaN(pv)?0:Math.round(pv);let bal=num(get(r,'bal'));bal=isNaN(bal)?b-p:Math.round(bal);
    const isCom=String(get(r,'cat')).toLowerCase()==='commercial';
    let cname='Residential';if(isCom){let k=String(get(r,'comm')).trim();k=/^gov/i.test(k)?'Govt':k;cname=cats.includes(k)?k:'Govt'}
    const sub=isCom?String(get(r,'sub')).trim():'';const si=!isCom?-1:(topsub.indexOf(sub)>=0?topsub.indexOf(sub):12);
    const sv=String(get(r,'svc')).trim();const vi=SVCS.indexOf(sv)>=0&&SVCS.indexOf(sv)<6?SVCS.indexOf(sv):6;
    const mv=num(get(r,'marla'));let mi=7;if(!isNaN(mv)){mi=6;[1,2,3,4,5,6].some((u,k)=>{if(mv<=u){mi=k;return true}return false})}
    const ws=num(get(r,'walk'));const z0=isNaN(ws)?3:ws<=21000?0:ws<=35000?1:2;
    const ai=areaIdx.has(arN[i])?areaIdx.get(arN[i]):OTH;
    CON[i]={ri:i,no:String(get(r,'no')),name:String(get(r,'name')||'—'),ph:String(get(r,'phone')||'—'),addr:String(get(r,'addr')),a:ai,z0,z:z0,t:isCom?1:0,c:catIdx(cname),cat:cname,s:si,sub:isCom?(si>=0&&si<12?topsub[si]:'Other commercial'):'—',v:vi,svc:SVCS[vi],mi,marla:isNaN(mv)?null:mv,st:['Active','Inactive','Not in master'][stI],sti:stI,b,p,bal,hb,hay:null};
    if(stRaw!==''){master++;stI==0?active++:stI==1&&inactive++}
    if(hb){billrows++;if(stRaw!=='')matched++;else billonly++;if(bal<0){neg++;negsum+=bal}const pn=String(get(r,'period')).trim();if(pn)perCnt.set(pn,(perCnt.get(pn)||0)+1)}
    else if(stRaw!==''){masteronly++;if(stI==0)masteronlyActive++}}
  const period=[...perCnt.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0])[0]||'—';
  const dash=hasBillCol?CON.filter(c=>c.hb):CON;
  const rows={t:[],c:[],s:[],v:[],m:[],a:[],z:[],st:[],b:[],p:[]};
  for(const c of dash){rows.t.push(c.t);rows.c.push(c.c);rows.s.push(c.s);rows.v.push(c.v);rows.m.push(c.mi);rows.a.push(c.a);rows.z.push(c.z0);rows.st.push(c.sti);rows.b.push(c.b);rows.p.push(c.p)}
  const top=dash.filter(c=>c.bal>0).sort((a,b)=>b.bal-a.bal).slice(0,40).map(c=>({no:c.no,name:c.name,area:areas[c.a],cat:c.cat,svc:c.svc,bill:c.b,paid:c.p,bal:c.bal,st:c.st}));
  const bf=files.filter(f=>f.kind=='bill').map(f=>f.name),mf=files.filter(f=>f.kind=='master').map(f=>f.name);
  const D={types:['Residential','Commercial'],cats,subs:topsub.map(shortSub).concat(['Other commercial']),subfull:topsub.concat(['Other commercial']),svcs:SVCS,marlas:MARLAS,areas,zones:ZONES,rows,top,
    meta:{master,active,inactive,billrows:hasBillCol?billrows:dash.length,matched,billonly,masteronly,masteronly_active:masteronlyActive,neg,negsum,f1:bf.join(', ')||'—',f2:mf.join(', ')||'—',period,hasMaster:master>0,hasBill:hasBillCol}};
  /* derived columns (appended after the file columns on export) */
  const derived=['Zone','Area Name','Consumer Type','Payment Status'];
  return {D,CON,dash,derived,idx:ci}}
g.Engine={merge,build,kind,nk,ZONES,SVCS,normArea};
})(window);
