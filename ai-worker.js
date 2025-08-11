// ai-worker.js — Fast Neural Style via ONNX Runtime Web
// Carica ort da CDN e applica lo style-transfer in worker (non blocca la UI)

/* eslint-disable no-undef */
importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js');
// usa i file wasm via CDN
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

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

self.onmessage = async (e)=>{
  const { id, width, height, data, model } = e.data;
  try {
    const session = await getSession(model);
    const input = preprocessRGBAtoCHWFloat32(new Uint8ClampedArray(data), width, height);
    const inputName = (session.inputNames && session.inputNames[0]) || 'input';
    const feeds = {}; feeds[inputName] = new ort.Tensor('float32', input, [1,3,height,width]);
    const results = await session.run(feeds);
    const outputName = (session.outputNames && session.outputNames[0]) || Object.keys(results)[0];
    const outTensor = results[outputName];
    const chw = outTensor.data; // Float32Array 1x3xHxW
    const rgba = postprocessCHWtoRGBA(chw, width, height);
    self.postMessage({ id, width, height, data: rgba.buffer }, [rgba.buffer]);
  } catch (err){
    // In caso di errore, rimanda input per non bloccare UX
    self.postMessage({ id, width, height, data }, [data]);
  }
};


