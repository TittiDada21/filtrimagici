// ai-worker.js — stub di esecuzione per Fast Neural Style (ONNX Runtime Web)
// Nota: per semplicità qui simuliamo l'inferenza restituendo l'immagine di input.
// In un secondo step collegheremo ort-web e caricheremo il modello.

self.onmessage = async (e)=>{
  const { id, width, height, data, model } = e.data;
  // Echo: per ora rimanda i dati così com'è, placeholder
  const out = new Uint8ClampedArray(data); // TODO: sostituire con inferenza reale
  self.postMessage({ id, width, height, data: out.buffer }, [out.buffer]);
};


