import {worldToTangent,tangentToWorld} from './sky-coordinates.mjs';
const decoder=new TextDecoder('ascii');
function cardValue(raw){
  const s=raw.trim();
  if(s.startsWith("'")){let out='';for(let i=1;i<s.length;i++){if(s[i]==="'"){if(s[i+1]==="'"){out+="'";i++;}else break;}else out+=s[i];}return out.trim();}
  const value=s.split('/')[0].trim();if(value==='T')return true;if(value==='F')return false;const n=Number(value.replace(/[Dd]/,'E'));return value!==''&&Number.isFinite(n)?n:value;
}
export function parseFits(buffer){
  if(!(buffer instanceof ArrayBuffer))buffer=buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
  const bytes=new Uint8Array(buffer),hdus=[];let offset=0;
  while(offset+80<=bytes.length){
    const first=decoder.decode(bytes.subarray(offset,offset+8));if(!['SIMPLE  ','XTENSION'].includes(first))break;
    const header={};let at=offset,ended=false;
    for(;at+80<=bytes.length;at+=80){const card=decoder.decode(bytes.subarray(at,at+80));const key=card.slice(0,8).trim();if(key==='END'){at+=80;ended=true;break;}if(card[8]==='=')header[key]=cardValue(card.slice(10));else if(key==='HIERARCH'){const eq=card.indexOf('=');if(eq>0)header[card.slice(9,eq).trim()]=cardValue(card.slice(eq+1));}}
    if(!ended)throw new Error('The archive returned an incomplete FITS header.');
    const start=offset+Math.ceil((at-offset)/2880)*2880;let pixels=header.NAXIS?1:0;for(let i=1;i<=header.NAXIS;i++)pixels*=Number(header['NAXIS'+i]);
    const length=(pixels+Number(header.PCOUNT||0))*Math.abs(Number(header.BITPIX))/8*Number(header.GCOUNT||1);
    if(!Number.isSafeInteger(length)||length<0||start+length>bytes.length)throw new Error('The FITS image is truncated or unsupported.');
    hdus.push({header,start,length,buffer});offset=start+Math.ceil(length/2880)*2880;
  }
  if(!hdus.length)throw new Error('The archive did not return a FITS image.');return hdus;
}
export function imageData(hdu){
  const h=hdu.header;if(h.XTENSION==='BINTABLE')throw new Error('Compressed FITS images are not supported by this viewer.');
  const width=Number(h.NAXIS1),height=Number(h.NAXIS2);if(!width||!height||width*height>2e7)throw new Error('Unsupported image dimensions.');
  const view=new DataView(hdu.buffer,hdu.start,hdu.length),bits=Number(h.BITPIX),step=Math.abs(bits)/8,out=bits===32?new Float64Array(width*height):new Float32Array(width*height);
  const getters={'8':'getUint8','16':'getInt16','32':'getInt32','-32':'getFloat32','-64':'getFloat64'};if(!getters[bits])throw new Error('Unsupported FITS numeric type.');
  const scale=Number(h.BSCALE??1),zero=Number(h.BZERO??0);for(let i=0;i<out.length;i++){const v=view[getters[bits]](i*step,false);out[i]=(bits>0&&h.BLANK===v)?NaN:v*scale+zero;}
  return {width,height,pixels:out,header:h};
}
function poly(h,prefix,x,y){let result=0;const order=Number(h[prefix+'_ORDER']||0);for(let i=0;i<=order;i++)for(let j=0;j<=order-i;j++){const c=h[`${prefix}_${i}_${j}`];if(c)result+=c*x**i*y**j;}return result;}
export function worldToPixel(h,ra,dec){
  if(!String(h.CTYPE1).includes('TAN'))throw new Error('This image uses a sky projection the viewer cannot align.');
  const [xi,eta]=worldToTangent(ra,dec,Number(h.CRVAL1),Number(h.CRVAL2));
  const a=Number(h.CD1_1??Number(h.PC1_1??1)*Number(h.CDELT1??1)),b=Number(h.CD1_2??Number(h.PC1_2??0)*Number(h.CDELT1??1));
  const c=Number(h.CD2_1??Number(h.PC2_1??0)*Number(h.CDELT2??1)),d=Number(h.CD2_2??Number(h.PC2_2??1)*Number(h.CDELT2??1)),det=a*d-b*c;
  if(!Number.isFinite(det)||Math.abs(det)<1e-16)throw new Error('Invalid sky registration in FITS header.');
  const u=(d*xi-b*eta)/det,v=(-c*xi+a*eta)/det;let x=u,y=v;
  if(String(h.CTYPE1).includes('SIP')){
    for(let i=0;i<20;i++){const nx=u-poly(h,'A',x,y),ny=v-poly(h,'B',x,y);if(!Number.isFinite(nx)||!Number.isFinite(ny))return [NaN,NaN];const err=Math.hypot(nx-x,ny-y);x=nx;y=ny;if(err<1e-5)break;}
    if(Math.hypot(x+poly(h,'A',x,y)-u,y+poly(h,'B',x,y)-v)>0.01)return [NaN,NaN];
  }
  return [x+Number(h.CRPIX1)-1,y+Number(h.CRPIX2)-1];
}
export function reproject(image,{ra,dec,fov,size=128}){
  const pixels=new Float32Array(size*size).fill(NaN),mask=new Uint8Array(size*size),scale=fov/60/size;let valid=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const [a,d]=tangentToWorld((size/2-x-.5)*scale,(size/2-y-.5)*scale,ra,dec),[sx,sy]=worldToPixel(image.header,a,d);
    if(!Number.isFinite(sx)||sx<0||sy<0||sx>=image.width-1||sy>=image.height-1)continue;
    const ix=Math.floor(sx),iy=Math.floor(sy),dx=sx-ix,dy=sy-iy,n=iy*image.width+ix,p=image.pixels;
    const val=p[n]*(1-dx)*(1-dy)+p[n+1]*dx*(1-dy)+p[n+image.width]*(1-dx)*dy+p[n+image.width+1]*dx*dy;
    if(Number.isFinite(val)){pixels[y*size+x]=val;valid++;if(image.flags){const f=image.flags.pixels;mask[y*size+x]=((f[n]|f[n+1]|f[n+image.width]|f[n+image.width+1])&image.badBits)?1:0;}}
  }
  return {pixels,mask,width:size,height:size,coverage:valid/(size*size)};
}
export function statistics(pixels){const sorted=Array.from(pixels).filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return {low:0,high:1,median:0};const q=p=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))];return {low:q(.02),high:q(.995),median:q(.5)};}
// Numeric arrays from fixed-width FITS binary-table columns, used for the spectral WCS.
export function tableArrays(hdu){const h=hdu.header,view=new DataView(hdu.buffer,hdu.start,hdu.length),result={};let offset=0;
  const types={J:[4,'getInt32'],I:[2,'getInt16'],E:[4,'getFloat32'],D:[8,'getFloat64'],B:[1,'getUint8'],A:[1,null]};
  for(let i=1;i<=Number(h.TFIELDS);i++){const m=/^(\d*)([JIEDBA])$/.exec(String(h['TFORM'+i]));if(!m)return result;const count=Number(m[1]||1),[bytes,get]=types[m[2]];if(get){result[h['TTYPE'+i]]=Array.from({length:count},(_,j)=>view[get](offset+j*bytes,false));}offset+=bytes*count;}return result;
}
export function spectralAt(hdus,image,x,y){
  const h=image.header,table=hdus.find(d=>d.header.EXTNAME==='WCS-WAVE');if(!table)return null;
  const arrays=tableArrays(table),axis1=arrays[h.PS1_2W],axis2=arrays[h.PS2_2W],values=arrays[h.PS1_1W];
  if(!axis1||!axis2||!values)return null;
  const px=(x+1-Number(h.CRPIX1W||0))*Number(h.CDELT1W??1)+Number(h.CRVAL1W||0),py=(y+1-Number(h.CRPIX2W||0))*Number(h.CDELT2W??1)+Number(h.CRVAL2W||0);
  function bracket(a,v){for(let i=0;i<a.length-1;i++)if(v>=a[i]&&v<=a[i+1])return [i,(v-a[i])/(a[i+1]-a[i])];return null;}
  const bx=bracket(axis1,px),by=bracket(axis2,py);if(!bx||!by)return null;const [i,dx]=bx,[j,dy]=by,nx=axis1.length;
  const out=[0,0];for(let k=0;k<2;k++){const get=(a,b)=>values[2*(b*nx+a)+k];out[k]=get(i,j)*(1-dx)*(1-dy)+get(i+1,j)*dx*(1-dy)+get(i,j+1)*(1-dx)*dy+get(i+1,j+1)*dx*dy;}
  return {wavelength:out[0],bandwidth:out[1]};
}
