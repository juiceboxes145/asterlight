import {parseFits,imageData,worldToPixel,spectralAt,reproject} from '../dist/fits.mjs';
const suspect=new Set(['TRANSIENT','OVERFLOW','SUR_ERROR','NONFUNC','DICHROIC','MISSING_DATA','HOT','COLD','NONLINEAR','PERSIST','OUTLIER','CROSSTALK','GHOST','GHOST_FPA','GHOST_EXT','STREAK','BLOOM','SNOWBALL','HALO','SAT_HALO']);
export function processFrame(buffer,{ra,dec,fov,size=128}){
  const hdus=parseFits(buffer),science=hdus.find(h=>h.header.EXTNAME==='IMAGE');if(!science)throw new Error('No IMAGE extension in this SPHEREx product.');
  const image=imageData(science),flagHdu=hdus.find(h=>h.header.EXTNAME==='FLAGS'),flags=[];let badBits=0,flagsAvailable=false;
  if(flagHdu&&flagHdu.header.XTENSION==='IMAGE'){
    image.flags=imageData(flagHdu);flagsAvailable=true;
    for(const [key,name] of Object.entries(flagHdu.header)){if(!/^MSKN\d+$/.test(key))continue;const bit=Number(key.slice(4));if(bit>=32||!suspect.has(name))continue;badBits|=1<<bit;let count=0;for(const v of image.flags.pixels)if((v&(1<<bit))!==0)count++;if(count)flags.push({name,bit,count});}
    image.badBits=badBits;
  }
  const [x,y]=worldToPixel(image.header,ra,dec),spectrum=spectralAt(hdus,image,x,y),grid=reproject(image,{ra,dec,fov,size});
  return {width:grid.width,height:grid.height,pixels:Array.from(grid.pixels,v=>Number.isFinite(v)?Number(v.toPrecision(7)):null),mask:Array.from(grid.mask),coverage:grid.coverage,flagsAvailable,flags,maskedFraction:grid.mask.reduce((a,b)=>a+b,0)/grid.mask.length,wavelength:spectrum?.wavelength??null,bandwidth:spectrum?.bandwidth??null,unit:image.header.BUNIT||'MJy/sr',detector:Number(image.header.DETECTOR),date:image.header['DATE-OBS'],mjd:Number(image.header['MJD-OBS']),observation:image.header.OBSID,processingVersion:hdus[0].header.VERSION||'',quality:image.header.L2DQAFLG||'Unspecified',psfFwhm:Number(image.header.PSF_FWHM)||null,sourceShape:[image.width,image.height],projection:'ICRS TAN, north up / east left; TAN-SIP alignment; bilinear sampling',zodiacalBackgroundSubtracted:false};
}
