export const IRSA='https://irsa.ipac.caltech.edu';
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[x]));
export function parseVOTable(xml){
  if(xml.trim().startsWith('{')){const j=JSON.parse(xml),r=j.VOTABLE?.RESOURCE_ARRAY?.find(r=>r.TABLE);if(!r)throw new Error('Unexpected JSON from the IRSA archive.');if(r.INFO_ARRAY?.some(i=>i['<xmlattr>']?.value==='ERROR'))throw new Error('IRSA could not complete the archive query.');const names=r.TABLE.FIELD_ARRAY.map(f=>f['<xmlattr>'].name);return (r.TABLE.DATA?.TABLEDATA||[]).map(values=>Object.fromEntries(names.map((n,i)=>[n,String(values[i]??'')])));}
  const error=/<INFO\b[^>]*name="QUERY_STATUS"[^>]*value="ERROR"[^>]*>([\s\S]*?)<\/INFO>/i.exec(xml);if(error)throw new Error('IRSA could not complete the archive query.');
  if(!xml.includes('<VOTABLE'))throw new Error('Unexpected response from the IRSA archive.');
  const names=[...xml.matchAll(/<FIELD\b[^>]*\bname="([^"]+)"/g)].map(m=>m[1]);
  return [...xml.matchAll(/<TR>([\s\S]*?)<\/TR>/g)].map(m=>{const values=[...m[1].matchAll(/<TD(?:\s[^>]*)?>([\s\S]*?)<\/TD>|<TD\s*\/>/g)].map(v=>decode((v[1]||'').trim()));return Object.fromEntries(names.map((n,i)=>[n,values[i]??'']));});
}
export function validateSearch(params){
  const ra=Number(params.get('ra')),dec=Number(params.get('dec')),detector=Number(params.get('detector')||2);
  if(!params.get('ra')?.trim()||!params.get('dec')?.trim()||!Number.isFinite(ra)||ra<0||ra>=360||!Number.isFinite(dec)||Math.abs(dec)>90||!Number.isInteger(detector)||detector<1||detector>6)throw new Error('Enter valid RA, declination, and detector 1–6.');
  return {ra,dec,detector};
}
export function siaUrl({ra,dec},collection='spherex_dr1'){const u=new URL('/SIA',IRSA);u.searchParams.set('POS',`CIRCLE ${Number(ra.toFixed(6))%360} ${Number(dec.toFixed(6))} 0.001`);u.searchParams.set('COLLECTION',collection);return u.href;}
export async function queryCollection(input,collection){
  const started=Date.now(),primary=siaUrl(input,collection);let last;
  for(const format of ['VOTABLE','JSON']){const url=new URL(primary);if(format==='JSON'){const position=url.searchParams.get('POS');url.search='';url.searchParams.set('COLLECTION',collection);url.searchParams.set('POS',position);url.searchParams.set('RESPONSEFORMAT','JSON');}
    try{const bytes=await boundedFetch(url.href,12000000,format==='VOTABLE'?24000:Math.max(1000,53000-(Date.now()-started)));return {rows:parseVOTable(new TextDecoder().decode(bytes)),source:url.href};}catch(e){last=e;}}
  throw last;
}
export function normalizeRecords(rows,detector){
  const unique=new Map();
  for(const r of rows){if(r.energy_bandpassname!==`SPHEREx-D${detector}`)continue;let u;try{u=new URL(r.access_url);}catch{continue;}
    if(u.origin!==IRSA||!/^\/ibe\/data\/spherex\/(?:dr1|qr3)\/level2\/[A-Za-z0-9_./-]+\.fits$/.test(u.pathname)||u.pathname.includes('..'))continue;
    const mjd=Number(r.t_min);if(!Number.isFinite(mjd)||mjd<50000)continue;
    const key=`${r.obs_id}:D${detector}`;
    const record={id:key,uri:u.pathname,mjd,date:new Date((mjd-40587)*86400000).toISOString(),detector,collection:r.obs_collection,exposure:Number(r.t_exptime),wavelengthMin:Number(r.em_min)*1e6,wavelengthMax:Number(r.em_max)*1e6,pixelScale:Number(r.s_pixel_scale)};
    if(!unique.has(key)||r.obs_collection==='spherex_dr1')unique.set(key,record);
  }
  return [...unique.values()].sort((a,b)=>a.mjd-b.mjd);
}
export function cutoutUrl(params){
  const {ra,dec}=validateSearch(params),fov=Number(params.get('fov')),uri=params.get('uri')||'';
  if(!Number.isFinite(fov)||fov<2||fov>20)throw new Error('Field of view must be 2–20 arcminutes.');
  if(!/^\/ibe\/data\/spherex\/(?:dr1|qr3)\/level2\/[A-Za-z0-9_./-]+\.fits$/.test(uri)||uri.includes('..'))throw new Error('Only SPHEREx DR1 / QR3 archive images can be requested.');
  const u=new URL(uri,IRSA);u.searchParams.set('center',`${ra},${dec}d`);u.searchParams.set('size',String(fov/60));return u.href;
}
export async function boundedFetch(url,maxBytes,timeout=50000){
  const started=Date.now();let r;
  for(let attempt=0;attempt<2;attempt++){
    try{r=await fetch(url,{signal:AbortSignal.timeout(Math.max(1,timeout-(Date.now()-started)))});}catch(e){if(attempt===0&&Date.now()-started<timeout-10000)continue;throw e;}
    if(r.ok)break;
    if(attempt===0&&[429,502,503,504].includes(r.status)&&Date.now()-started<timeout-10000){await r.body?.cancel();await new Promise(resolve=>setTimeout(resolve,400));continue;}
    throw new Error(`IRSA returned ${r.status}. Try again or choose another frame.`);
  }
  if(Number(r.headers.get('content-length'))>maxBytes)throw new Error('Archive response is too large. Choose a smaller field of view.');
  const reader=r.body.getReader(),chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();throw new Error('Archive response is too large. Choose a smaller field of view.');}chunks.push(value);}}finally{reader.releaseLock();}
  const data=new Uint8Array(size);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}return data;
}
