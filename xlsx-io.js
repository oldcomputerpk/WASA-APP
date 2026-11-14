/* xlsx-io.js — reads and writes .xlsx / .csv entirely in the browser (needs JSZip). */
(function(g){
const dec=s=>s.replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d)).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
const attr=(s,n)=>{const m=s.match(new RegExp('(?:^|\\s)'+n+'="([^"]*)"'));return m?m[1]:null};
const colIdx=l=>{let n=0;for(let i=0;i<l.length;i++)n=n*26+l.charCodeAt(i)-64;return n-1};
const colLetter=i=>{let s='';i++;while(i>0){const r=(i-1)%26;s=String.fromCharCode(65+r)+s;i=Math.floor((i-1)/26)}return s};
const pad=n=>String(n).padStart(2,'0');
function serialToStr(v){const ms=Math.round((v-25569)*86400000),d=new Date(ms);if(isNaN(d))return String(v);
  const base=d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate());
  return Number.isInteger(v)?base:base+' '+pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())}
function isDateFmt(id,code){if((id>=14&&id<=22)||(id>=45&&id<=47))return true;if(!code)return false;
  const c=code.replace(/"[^"]*"/g,'').replace(/\[[^\]]*\]/g,'').replace(/\\./g,'');return /[dmyhs]/i.test(c)&&!/^(General|0|#)/i.test(c)}
async function readXlsx(buf){
  const zip=await JSZip.loadAsync(buf);
  const txt=async p=>{const f=zip.file(p);return f?f.async('string'):null};
  let sheetPath='xl/worksheets/sheet1.xml';
  const wb=await txt('xl/workbook.xml'),rels=await txt('xl/_rels/workbook.xml.rels');
  if(wb&&rels){const sm=wb.match(/<sheet\b[^>]*>/);if(sm){const rid=attr(sm[0],'r:id');
    for(const rm of rels.match(/<Relationship\b[^>]*>/g)||[])if(attr(rm,'Id')===rid){let t=attr(rm,'Target');t=t.replace(/^\//,'');sheetPath=t.startsWith('xl/')?t:'xl/'+t}}}
  if(!zip.file(sheetPath)){const k=Object.keys(zip.files).find(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n));if(!k)throw new Error('No worksheet found in this file');sheetPath=k}
  const sst=[];const ssx=await txt('xl/sharedStrings.xml');
  if(ssx){const re=/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g;let m;while((m=re.exec(ssx))){const inner=(m[1]||'').replace(/<rPh\b[\s\S]*?<\/rPh>/g,'');let s='',t;const tr=/<t\b[^>]*>([\s\S]*?)<\/t>/g;while((t=tr.exec(inner)))s+=t[1];sst.push(dec(s))}}
  const dateXf=[];const stx=await txt('xl/styles.xml');
  if(stx){const fm={};for(const m of stx.matchAll(/<numFmt\b[^>]*>/g))fm[attr(m[0],'numFmtId')]=dec(attr(m[0],'formatCode')||'');
    const cx=stx.match(/<cellXfs\b[\s\S]*?<\/cellXfs>/);if(cx)for(const m of cx[0].matchAll(/<xf\b[^>]*>/g)){const id=+attr(m[0],'numFmtId')||0;dateXf.push(isDateFmt(id,fm[id]))}}
  const xml=await zip.file(sheetPath).async('string');
  const rows=[];const rowRe=/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g;let rm;
  while((rm=rowRe.exec(xml))){const body=rm[1];if(!body)continue;const arr=[];let any=false;
    const cRe=/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;let cm;
    while((cm=cRe.exec(body))){const a=cm[1],inner=cm[2];if(!inner)continue;const r=attr(a,'r');if(!r)continue;const ci=colIdx(r.replace(/\d+/g,''));const t=attr(a,'t');let v;
      if(t==='inlineStr'){let s='',x;const tr=/<t\b[^>]*>([\s\S]*?)<\/t>/g;while((x=tr.exec(inner)))s+=x[1];v=dec(s)}
      else{const vm=inner.match(/<v>([\s\S]*?)<\/v>/);if(!vm)continue;const raw=vm[1];
        if(t==='s')v=sst[+raw];else if(t==='str')v=dec(raw);else if(t==='b')v=raw==='1';else if(t==='e')continue;
        else{const n=parseFloat(raw);if(isNaN(n))continue;const s=attr(a,'s');v=(s!==null&&dateXf[+s])?serialToStr(n):n}}
      if(v===undefined||v==='')continue;arr[ci]=v;any=true}
    if(any)rows.push(arr)}
  if(!rows.length)throw new Error('The sheet is empty');
  const head=rows[0];const cols=[];const seen={};
  for(let i=0;i<head.length;i++){let h=head[i]==null?'':String(head[i]).trim();if(!h)h='COLUMN_'+(i+1);if(seen[h]){seen[h]++;h+='_'+seen[h]}else seen[h]=1;cols.push(h)}
  const data=rows.slice(1).map(r=>{const o=new Array(cols.length);for(let i=0;i<cols.length;i++){const v=r[i];o[i]=v===undefined?'':v}return o});
  return {cols,rows:data}}
function parseCSV(text){text=text.replace(/^﻿/,'');const out=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c=='"'){if(text[i+1]=='"'){f+='"';i++}else q=false}else f+=c}
    else if(c=='"')q=true;else if(c==','){row.push(f);f=''}
    else if(c=='\n'||c=='\r'){if(c=='\r'&&text[i+1]=='\n')i++;row.push(f);f='';if(row.some(x=>x!==''))out.push(row);row=[]}
    else f+=c}
  row.push(f);if(row.some(x=>x!==''))out.push(row);
  if(!out.length)throw new Error('The CSV is empty');
  const cols=out[0].map((h,i)=>String(h).trim()||'COLUMN_'+(i+1));
  const rows=out.slice(1).map(r=>cols.map((_,i)=>{const v=r[i]===undefined?'':r[i];return (v!==''&&/^-?\d+(\.\d+)?$/.test(v)&&!/^0\d/.test(v)&&v.length<12)?+v:v}));
  return {cols,rows}}
async function readFile(file){const n=file.name.toLowerCase();
  if(n.endsWith('.csv'))return parseCSV(await file.text());
  if(n.endsWith('.xlsx')||n.endsWith('.xlsm'))return readXlsx(await file.arrayBuffer());
  throw new Error('Only .xlsx and .csv files can be read')}
/* ---------- writing ---------- */
const esc=s=>String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const AMT=/AMOUNT|BALANCE|BILL|PAID|ARREAR|DEMAND|OUTSTANDING|DUE/i;
function sheetXml(sh){const cols=sh.cols,rows=sh.rows,nc=cols.length;
  const w=cols.map((c,j)=>{let m=Math.min(60,String(c).length+3);const lim=Math.min(rows.length,400);for(let i=0;i<lim;i++){const v=rows[i][j];if(v!=null)m=Math.max(m,Math.min(60,String(v).length+2))}return Math.max(9,m)});
  const parts=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"'+(sh.noFreeze?'':'')+'>'+(sh.noFreeze?'':'<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>')+'</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>'+w.map((x,j)=>`<col min="${j+1}" max="${j+1}" width="${x}" customWidth="1"/>`).join('')+'</cols><sheetData>'];
  const amt=cols.map(c=>AMT.test(c)&&!/NO$|_ID$/i.test(c));
  let h='<row r="1" ht="22" customHeight="1">';for(let j=0;j<nc;j++)h+=`<c r="${colLetter(j)}1" s="1" t="inlineStr"><is><t xml:space="preserve">${esc(cols[j])}</t></is></c>`;parts.push(h+'</row>');
  let buf=[];
  for(let i=0;i<rows.length;i++){const r=rows[i],rn=i+2;let s=`<row r="${rn}">`;
    for(let j=0;j<nc;j++){const v=r[j];if(v===''||v==null)continue;const ref=colLetter(j)+rn;
      if(typeof v==='number'&&isFinite(v))s+=`<c r="${ref}"${amt[j]?' s="2"':''}><v>${v}</v></c>`;
      else s+=`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`}
    buf.push(s+'</row>');if(buf.length>=4000){parts.push(buf.join(''));buf=[]}}
  if(buf.length)parts.push(buf.join(''));
  parts.push('</sheetData>'+(sh.noFilter?'':`<autoFilter ref="A1:${colLetter(nc-1)}${rows.length+1}"/>`)+'<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToHeight="0"/></worksheet>');
  return parts.join('')}
async function writeXlsx(sheets){const zip=new JSZip();
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>');
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>`<sheet name="${esc(s.name.replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  zip.file('xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>');
  sheets.forEach((s,i)=>zip.file(`xl/worksheets/sheet${i+1}.xml`,sheetXml(s)));
  return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',compression:'DEFLATE',compressionOptions:{level:3}})}
function toCSV(cols,rows){const q=v=>{if(v==null||v==='')return '';const s=String(v);return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const out=['﻿'+cols.map(q).join(',')];for(const r of rows)out.push(r.map(q).join(','));return new Blob([out.join('\r\n')],{type:'text/csv;charset=utf-8'})}
g.XLSXIO={readFile,readXlsx,parseCSV,writeXlsx,toCSV,colLetter};
})(window);
