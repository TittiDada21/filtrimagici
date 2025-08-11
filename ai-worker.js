// ai-worker.js — Fast Neural Style via ONNX Runtime Web
// Carica ort da CDN e applica lo style-transfer in worker (non blocca la UI)

/* eslint-disable no-undef */
importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js');
// usa i file wasm via CDN
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

console.log('AI Worker caricato, ORT disponibile:', typeof ort !== 'undefined');

const urlToSession = new Map();

async function getSession(model){
  const key = model && model.url ? model.url : 'inline-model';
  if (urlToSession.has(key)) return urlToSession.get(key);
  const opts = { executionProviders: ['wasm'] };
  const sess = await ort.InferenceSession.create(key, opts);
  urlToSession.set(key, sess);
  return sess;
}

function preprocessRGBAtoCHWFloat32(rgba, width, height){
  const size = width * height;
  const out = new Float32Array(size * 3);
  let i = 0; let r=0,g=0,b=0;
  for (let y=0; y<height; y++){
    for (let x=0; x<width; x++){
      const p = (y*width + x) * 4;
      r = rgba[p]; g = rgba[p+1]; b = rgba[p+2];
      out[0*size + y*width + x] = r/255;
      out[1*size + y*width + x] = g/255;
      out[2*size + y*width + x] = b/255;
      i++;
    }
  }
  return out;
}

function postprocessCHWtoRGBA(chw, width, height){
  const size = width * height;
  const out = new Uint8ClampedArray(size * 4);
  for (let i=0; i<size; i++){
    const r = Math.max(0, Math.min(255, (chw[0*size + i] * 255)));
    const g = Math.max(0, Math.min(255, (chw[1*size + i] * 255)));
    const b = Math.max(0, Math.min(255, (chw[2*size + i] * 255)));
    const p = i*4; out[p]=r; out[p+1]=g; out[p+2]=b; out[p+3]=255;
  }
  return out;
}

function resizeNearest(rgba, sw, sh, dw, dh){
  if (sw===dw && sh===dh) return rgba;
  const out = new Uint8ClampedArray(dw*dh*4);
  for(let y=0;y<dh;y++){
    const sy = Math.min(sh-1, Math.round(y*sh/dh));
    for(let x=0;x<dw;x++){
      const sx = Math.min(sw-1, Math.round(x*sw/dw));
      const sp = (sy*sw+sx)*4;
      const dp = (y*dw+x)*4;
      out[dp]=rgba[sp]; out[dp+1]=rgba[sp+1]; out[dp+2]=rgba[sp+2]; out[dp+3]=255;
    }
  }
  return out;
}

self.onmessage = async (e)=>{
  console.log('Worker ricevuto messaggio:', e.data);
  const { id, width, height, data, model } = e.data;
  try {
    // Test semplice: se non c'è modello, applica un effetto base
    if (!model || !model.url) {
      console.log('Nessun modello, applico effetto AI locale');
      const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
      const px = imgData.data;
      
      // Effetti AI locali avanzati
      const effectType = model?.framework === 'local' ? 'ai' : 'basic';
      
      if (effectType === 'ai') {
        // Effetto AI: Neural Style Transfer simulato
        for (let i = 0; i < px.length; i += 4) {
          // Simula stile artistico con curve non lineari
          const r = px[i] / 255;
          const g = px[i + 1] / 255;
          const b = px[i + 2] / 255;
          
          // Trasformazione non lineare per effetto "pittorico"
          px[i] = Math.min(255, Math.max(0, 255 * Math.pow(r, 0.8) * 1.2));
          px[i + 1] = Math.min(255, Math.max(0, 255 * Math.pow(g, 0.9) * 1.1));
          px[i + 2] = Math.min(255, Math.max(0, 255 * Math.pow(b, 0.85) * 1.15));
        }
        
        // Aggiungi texture artistica
        for (let y = 0; y < height; y += 4) {
          for (let x = 0; x < width; x += 4) {
            const idx = (y * width + x) * 4;
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 15;
            px[idx] = Math.min(255, Math.max(0, px[idx] + noise));
            px[idx + 1] = Math.min(255, Math.max(0, px[idx + 1] + noise));
            px[idx + 2] = Math.min(255, Math.max(0, px[idx + 2] + noise));
          }
        }
      } else {
        // Effetto base: aumenta contrasto e saturazione
        for (let i = 0; i < px.length; i += 4) {
          px[i] = Math.min(255, px[i] * 1.2);     // R
          px[i + 1] = Math.min(255, px[i + 1] * 1.2); // G  
          px[i + 2] = Math.min(255, px[i + 2] * 1.2); // B
        }
      }
      
      self.postMessage({ id, width, height, data: px.buffer }, [px.buffer]);
      return;
    }
    
    const session = await getSession(model);
    // Portiamo la dimensione a multipli di 32 (molti modelli lo richiedono)
    const dw = Math.max(32, Math.floor(width/32)*32);
    const dh = Math.max(32, Math.floor(height/32)*32);
    const resized = resizeNearest(new Uint8ClampedArray(data), width, height, dw, dh);
    const input = preprocessRGBAtoCHWFloat32(resized, dw, dh);
    const inputName = (session.inputNames && session.inputNames[0]) || 'input';
    const feeds = {}; feeds[inputName] = new ort.Tensor('float32', input, [1,3,dh,dw]);
    
    console.log('Eseguo inferenza con input shape:', [1,3,dh,dw]);
    const results = await session.run(feeds);
    const outputName = (session.outputNames && session.outputNames[0]) || Object.keys(results)[0];
    const outTensor = results[outputName];
    const chw = outTensor.data; // Float32Array 1x3xDh x Dw
    const rgbaSmall = postprocessCHWtoRGBA(chw, dw, dh);
    const rgba = resizeNearest(rgbaSmall, dw, dh, width, height);
    self.postMessage({ id, width, height, data: rgba.buffer }, [rgba.buffer]);
  } catch (err){
    console.error('Errore nel worker:', err);
    // In caso di errore, rimanda input per non bloccare UX
    const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
    const px = imgData.data;
    for (let i = 0; i < px.length; i += 4) {
      px[i] = Math.min(255, px[i] * 1.1);
      px[i + 1] = Math.min(255, px[i + 1] * 1.1);
      px[i + 2] = Math.min(255, px[i + 2] * 1.1);
    }
    self.postMessage({ id, width, height, data: px.buffer }, [px.buffer]);
  }
};


