import {cutoutUrl,boundedFetch} from '../lib/archive.mjs';
import {processFrame} from '../lib/process-frame.mjs';
export default async function handler(req,res){
  if(req.method!=='GET'){res.writeHead(405,{Allow:'GET'});res.end();return;}
  let url;try{url=cutoutUrl(new URL(req.url,'http://localhost').searchParams);}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));return;}
  try{const data=await boundedFetch(url,12000000,55000);if(new TextDecoder().decode(data.subarray(0,8))!=='SIMPLE  ')throw new Error('IRSA returned no usable FITS cutout at this position.');const params=new URL(req.url,'http://localhost').searchParams;const result=processFrame(data,{ra:Number(params.get('ra')),dec:Number(params.get('dec')),fov:Number(params.get('fov'))});res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'public, s-maxage=604800, stale-while-revalidate=86400'});res.end(JSON.stringify({...result,source:url,retrievedAt:new Date().toISOString()}));}
  catch(e){res.writeHead(502,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:e.name==='TimeoutError'?'This cutout timed out at IRSA. Try reloading frames.':e.message}));}
}
