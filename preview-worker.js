// preview-worker.js
// Applica una pipeline di filtri su un'anteprima (ImageData) off‑thread

self.onmessage = (e) => {
  const { id, width, height, data, pipeline } = e.data;
  const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
  const px = imgData.data;

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const rgb2hsv = (r,g,b)=>{
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
    let h=0,s=max===0?0:d/max,v=max;
    if(d!==0){
      if(max===r) h=((g-b)/d)%6; else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4;
      h*=60; if(h<0) h+=360;
    }
    return [h,s,v];
  };
  const hsv2rgb=(h,s,v)=>{
    const c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c; let r=0,g=0,b=0;
    if(h<60){r=c;g=x;b=0}else if(h<120){r=x;g=c;b=0}else if(h<180){r=0;g=c;b=x}
    else if(h<240){r=0;g=x;b=c}else if(h<300){r=x;g=0;b=c}else{r=c;g=0;b=x}
    return [(r+m)*255,(g+m)*255,(b+m)*255];
  };

  // PRNG deterministico per la grana
  const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  };
  const mulberry32 = (a) => () => { a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t^=t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296; };

  const rand = mulberry32(cyrb53(id||'seed'));

  const ops = {
    exposure:(v)=>{ const g=1-v; for(let i=0;i<px.length;i+=4){ px[i]=255*Math.pow(px[i]/255,g); px[i+1]=255*Math.pow(px[i+1]/255,g); px[i+2]=255*Math.pow(px[i+2]/255,g);} },
    contrast:(v)=>{ const f=(1+v)/(1-v+1e-6); for(let i=0;i<px.length;i+=4){ px[i]=clamp01(((px[i]/255-0.5)*f+0.5))*255; px[i+1]=clamp01(((px[i+1]/255-0.5)*f+0.5))*255; px[i+2]=clamp01(((px[i+2]/255-0.5)*f+0.5))*255; } },
    vibrance:(v)=>{ for(let i=0;i<px.length;i+=4){ const [h,s,val]=rgb2hsv(px[i],px[i+1],px[i+2]); const s2=clamp01(s+v*(1-s)); const [r,g,b]=hsv2rgb(h,s2,val); px[i]=r; px[i+1]=g; px[i+2]=b; } },
    saturation:(v)=>{ for(let i=0;i<px.length;i+=4){ const [h,s,val]=rgb2hsv(px[i],px[i+1],px[i+2]); const s2=clamp01(s+v); const [r,g,b]=hsv2rgb(h,s2,val); px[i]=r; px[i+1]=g; px[i+2]=b; } },
    hue:(deg)=>{ for(let i=0;i<px.length;i+=4){ let [h,s,val]=rgb2hsv(px[i],px[i+1],px[i+2]); h=(h+deg+360)%360; const [r,g,b]=hsv2rgb(h,s,val); px[i]=r; px[i+1]=g; px[i+2]=b; } },
    warmth:(v)=>{ for(let i=0;i<px.length;i+=4){ px[i]+= -30*v*255/100; px[i+2]+= 30*v*255/100; } },
    levels:({low=0,high=1})=>{ for(let i=0;i<px.length;i+=4){ px[i]=clamp01((px[i]/255-low)/(high-low))*255; px[i+1]=clamp01((px[i+1]/255-low)/(high-low))*255; px[i+2]=clamp01((px[i+2]/255-low)/(high-low))*255; } },
    grayscale:()=>{ for(let i=0;i<px.length;i+=4){ const y=0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2]; px[i]=px[i+1]=px[i+2]=y; } },
    edge:({amount=1})=>{ const w=width,h=height,src=new Uint8ClampedArray(px),off=(x,y)=>(y*w+x)*4,gx=[-1,0,1,-2,0,2,-1,0,1],gy=[-1,-2,-1,0,0,0,1,2,1]; for(let y=1;y<h-1;y++){ for(let x=1;x<w-1;x++){ let sx=0,sy=0,k=0; for(let j=-1;j<=1;j++){ for(let i=-1;i<=1;i++){ const p=off(x+i,y+j); const yv=.2126*src[p]+.7152*src[p+1]+.0722*src[p+2]; sx+=gx[k]*yv; sy+=gy[k]*yv; k++; } } const mag=clamp01(Math.hypot(sx,sy)/255)*255*amount; const p=off(x,y); px[p]=px[p+1]=px[p+2]=mag; } } },
    splitTone:({shadows,highlights})=>{ for(let i=0;i<px.length;i+=4){ const l=(0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2])/255; const tone=l<0.5?shadows:highlights; const [r,g,b]=hsv2rgb(tone.h,tone.s,1); px[i]=clamp01((px[i]/255*0.85+(r/255)*0.15))*255; px[i+1]=clamp01((px[i+1]/255*0.85+(g/255)*0.15))*255; px[i+2]=clamp01((px[i+2]/255*0.85+(b/255)*0.15))*255; } },
    clarity:(v)=>{ const w=width,h=height,src=new Uint8ClampedArray(px),off=(x,y)=>(y*w+x)*4,blur=(x,y)=>{ let r=0,g=0,b=0,c=0; for(let j=-1;j<=1;j++) for(let i=-1;i<=1;i++){ const xx=Math.min(w-1,Math.max(0,x+i)), yy=Math.min(h-1,Math.max(0,y+j)), p=off(xx,yy); r+=src[p]; g+=src[p+1]; b+=src[p+2]; c++; } return [r/c,g/c,b/c];}; for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ const p=off(x,y), [br,bg,bb]=blur(x,y); px[p]+= (src[p]-br)*v*2; px[p+1]+= (src[p+1]-bg)*v*2; px[p+2]+= (src[p+2]-bb)*v*2; } } },
    vignette:(v)=>{ const w=width,h=height,cx=w/2,cy=h/2,max=Math.hypot(cx,cy); for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ const t=(Math.hypot(x-cx,y-cy)/max), dark=Math.pow(t,2.5)*v, p=(y*w+x)*4; px[p]*=(1-dark); px[p+1]*=(1-dark); px[p+2]*=(1-dark);} } },
    grain:(v)=>{ for(let i=0;i<px.length;i+=4){ const n=(rand()*2-1)*v*50; px[i]+=n; px[i+1]+=n; px[i+2]+=n; } },
    halftone:({size=6})=>{ const w=width,h=height,src=new Uint8ClampedArray(px),off=(x,y)=>(y*w+x)*4; for(let y=0;y<h;y+=size){ for(let x=0;x<w;x+=size){ let sum=0,count=0; for(let j=0;j<size;j++) for(let i=0;i<size;i++){ const xx=Math.min(w-1,x+i), yy=Math.min(h-1,y+j), p=off(xx,yy); const yv=.2126*src[p]+.7152*src[p+1]+.0722*src[p+2]; sum+=yv; count++; } const avg=sum/count; for(let j=0;j<size;j++) for(let i=0;i<size;i++){ const xx=Math.min(w-1,x+i), yy=Math.min(h-1,y+j), p=off(xx,yy); const dot=avg>128?255:0; px[p]=src[p]*0.6+dot*0.4; px[p+1]=src[p+1]*0.6+dot*0.4; px[p+2]=src[p+2]*0.6+dot*0.4; } } } }
  };

  for(const step of (pipeline||[])){
    const {op, ...args} = step;
    if (ops[op]) ops[op](args.value!==undefined ? args.value : args);
  }

  self.postMessage({ id, width, height, data: imgData.data.buffer }, [imgData.data.buffer]);
};


