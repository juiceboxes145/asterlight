const R = Math.PI / 180;
export function parseAngle(value, ra = false) {
  const text = String(value).trim();
  if (!text) throw new Error(`${ra ? 'Right ascension' : 'Declination'} is required.`);
  let result;
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) result = Number(text);
  else {
    const normalized = text.toLowerCase().replace(/[hmd°′'″"s:]/g, ' ').trim();
    const parts = normalized.split(/\s+/);
    if (parts.length < 2 || parts.length > 3 || !parts.every(p => /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(p))) throw new Error('Use decimal degrees or sexagesimal coordinates (hh:mm:ss / ±dd:mm:ss).');
    const [a,b,c=0] = parts.map(Number);
    if (b < 0 || b >= 60 || c < 0 || c >= 60 || !Number.isInteger(a) || (parts.length === 3 && !Number.isInteger(b))) throw new Error('Coordinate minutes and seconds must be between 0 and 60.');
    result = (Math.abs(a) + b / 60 + c / 3600) * (text.startsWith('-') ? -1 : 1) * (ra ? 15 : 1);
  }
  if (!Number.isFinite(result) || (ra ? result < 0 || result >= 360 : Math.abs(result) > 90)) throw new Error(ra ? 'Right ascension must be 0 ≤ RA < 360 degrees (0–24 hours).' : 'Declination must be between −90 and +90 degrees.');
  return result;
}
export function parseCoordinates(ra, dec) { return {ra:parseAngle(ra,true),dec:parseAngle(dec,false)}; }
export function formatRA(deg) { const total=Math.round((((deg%360)+360)%360)/15*360000)/100;const h=Math.floor(total/3600)%24,m=Math.floor(total%3600/60),s=total%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${s.toFixed(2).padStart(5,'0')}`; }
export function formatDec(deg) { const t=Math.round(Math.abs(deg)*36000)/10,d=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return `${deg<0?'-':'+'}${String(d).padStart(2,'0')}:${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`; }
export function angularSeparationArcsec(a,b,c,d) { const h=Math.sin((d-b)*R/2)**2+Math.cos(b*R)*Math.cos(d*R)*Math.sin((c-a)*R/2)**2;return 2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))))/R*3600; }
export function buildShareUrl(base,{ra,dec,fov,detector}) { const u=new URL(base);u.hash='explore';u.search='';for(const [k,v] of Object.entries({ra,dec,fov,detector}))u.searchParams.set(k,String(v));return u.href; }
export function tangentToWorld(x,y,ra,dec) {
  const xi=x*R,eta=y*R,a=ra*R,d=dec*R,den=Math.cos(d)-eta*Math.sin(d);
  return [((a+Math.atan2(xi,den))/R+360)%360,Math.atan2(Math.sin(d)+eta*Math.cos(d),Math.hypot(den,xi))/R];
}
export function worldToTangent(ra,dec,ra0,dec0) {
  const a=(ra-ra0)*R,d=dec*R,d0=dec0*R,cosc=Math.sin(d0)*Math.sin(d)+Math.cos(d0)*Math.cos(d)*Math.cos(a);
  if(cosc<=0)return [NaN,NaN];
  return [Math.cos(d)*Math.sin(a)/cosc/R,(Math.cos(d0)*Math.sin(d)-Math.sin(d0)*Math.cos(d)*Math.cos(a))/cosc/R];
}
