// scripts/update-filters.mjs
// Genera un filters.json con 10 filtri "sorprendenti" ispirati a Filterous2, pilgram e pattern OpenCV.
// Nota: per restare 100% locale, qui NON scarichiamo modelli; creiamo preset/pipeline canvas.
// In futuro puoi sostituire questa logica con scraping/SDK ufficiali.

import fs from 'fs/promises';

// Sorgenti simboliche: link utili (solo metadati, no scraping aggressivo)
const SOURCES = [
  { name: 'Filterous2', url: 'https://github.com/icarusion/Filterous2' },
  { name: 'pilgram', url: 'https://github.com/akiomik/pilgram' },
  { name: 'OpenCV tutorials', url: 'https://www.geeksforgeeks.org/opencv-python-tutorial/' }
];

// Adapter minimi: sostituibili con fetch/scraping reali
const adapters = {
  filterous2: async () => ([
    { id: 'fresh-contrast', name: 'Fresh Contrast', likes: 57, family: 'contrast', type: 'classic' },
    { id: 'teal-boost', name: 'Teal Boost', likes: 83, family: 'teal', type: 'classic' },
    { id: 'warm-film-grain', name: 'Warm Film Grain', likes: 77, family: 'film', type: 'classic' },
  ]),
  pilgram: async () => ([
    { id: 'ink-sketch-lite', name: 'Ink Sketch', likes: 76, family: 'mono', type: 'classic' },
    { id: 'noir-edges', name: 'Noir Edges', likes: 48, family: 'mono', type: 'classic' },
  ]),
  opencv: async () => ([
    { id: 'pop-halftone', name: 'Pop Halftone', likes: 72, family: 'pattern', type: 'classic' },
    { id: 'vivid-halftone', name: 'Vivid Halftone', likes: 68, family: 'pattern', type: 'classic' },
    { id: 'cool-ink', name: 'Cool Ink', likes: 53, family: 'mono', type: 'classic' },
  ])
};

// Preset candidati base
const CANDIDATES = [
  { id: 'fresh-contrast', name: 'Fresh Contrast', likes: 57, pipeline: [
      { op: 'contrast', value: 0.12 }, { op: 'vibrance', value: 0.30 }, { op: 'vignette', value: 0.22 }
  ], type: 'classic', family: 'contrast' },
  { id: 'teal-boost', name: 'Teal Boost', likes: 83, pipeline: [
      { op: 'vibrance', value: 0.35 }, { op: 'hue', value: 10 }, { op: 'clarity', value: 0.10 }
  ], type: 'classic', family: 'teal' },
  { id: 'film-soft-warm', name: 'Film Soft Warm', likes: 44, pipeline: [
      { op: 'exposure', value: -0.04 }, { op: 'contrast', value: 0.08 }, { op: 'warmth', value: 0.18 }
  ], type: 'classic', family: 'film' },
  { id: 'mono-edges', name: 'Mono Edges', likes: 65, pipeline: [
      { op: 'grayscale' }, { op: 'edge', amount: 1.0 }, { op: 'levels', low: 0.15, high: 0.90 }
  ], type: 'classic', family: 'mono' },
  { id: 'pop-halftone', name: 'Pop Halftone', likes: 72, pipeline: [
      { op: 'saturation', value: 0.25 }, { op: 'halftone', size: 6 }, { op: 'contrast', value: 0.15 }
  ], type: 'classic', family: 'pattern' },
  { id: 'cinematic-tealorange-lite', name: 'Cinematic Teal/Orange', likes: 91, pipeline: [
      { op: 'contrast', value: 0.10 }, { op: 'splitTone', shadows: {h:200,s:0.22}, highlights:{h:35,s:0.18} }, { op: 'clarity', value: 0.08 }
  ], type: 'classic', family: 'teal' },
  { id: 'noir-edges', name: 'Noir Edges', likes: 48, pipeline: [
      { op: 'grayscale' },
      { op: 'contrast', value: 0.25 },
      { op: 'clarity', value: 0.2 },
      { op: 'vignette', value: 0.2 },
      { op: 'grain', value: 0.1 }
  ], type: 'classic', family: 'mono' },
  { id: 'warm-film-grain', name: 'Warm Film Grain', likes: 77, pipeline: [
      { op: 'exposure', value: -0.03 }, { op: 'warmth', value: 0.20 }, { op: 'grain', value: 0.18 }
  ], type: 'classic', family: 'film' },
  { id: 'cool-ink', name: 'Cool Ink', likes: 53, pipeline: [
      { op: 'grayscale' }, { op: 'hue', value: 188 }, { op: 'contrast', value: 0.09 }
  ], type: 'classic', family: 'mono' },
  { id: 'vivid-halftone', name: 'Vivid Halftone', likes: 68, pipeline: [
      { op: 'saturation', value: 0.30 }, { op: 'halftone', size: 5 }, { op: 'contrast', value: 0.12 }
  ], type: 'classic', family: 'pattern' },
  { id: 'neon-noise-v1', name: 'Neon Noise', likes: 120, pipeline: [
      { op: 'exposure', value: 0.08 }, { op: 'vibrance', value: 0.35 }, { op: 'hue', value: 12 }, { op: 'contrast', value: 0.12 }, { op: 'grain', value: 0.15 }
  ], type: 'classic', family: 'teal' },
  { id: 'ink-sketch-lite', name: 'Ink Sketch', likes: 76, pipeline: [
      { op: 'grayscale' }, { op: 'edge', amount: 1.0 }, { op: 'levels', low: 0.15, high: 0.90 }
  ], type: 'classic', family: 'mono' }
];

// AI candidates (placeholders con pipeline locale; in futuro sostituire con modelli ONNX/TF.js)
const AI_CANDIDATES = [
  { id: 'ai-style-mosaic', name: 'AI Style: Mosaic', likes: 210, type: 'ai', family: 'ai-style',
    model: { framework: 'onnx', url: 'https://raw.githubusercontent.com/microsoft/onnxruntime-inference-examples/main/js/FastNeuralStyle/models/mosaic.onnx' },
    sources:[{name:'ONNX Runtime Examples', url:'https://github.com/microsoft/onnxruntime-inference-examples'}]
  },
  { id: 'ai-style-candy', name: 'AI Style: Candy', likes: 205, type: 'ai', family: 'ai-style',
    model: { framework: 'onnx', url: 'https://raw.githubusercontent.com/microsoft/onnxruntime-inference-examples/main/js/FastNeuralStyle/models/candy.onnx' },
    sources:[{name:'ONNX Runtime Examples', url:'https://github.com/microsoft/onnxruntime-inference-examples'}]
  },
  { id: 'ai-style-udnie', name: 'AI Style: Udnie', likes: 200, type: 'ai', family: 'ai-style',
    model: { framework: 'onnx', url: 'https://raw.githubusercontent.com/microsoft/onnxruntime-inference-examples/main/js/FastNeuralStyle/models/udnie.onnx' },
    sources:[{name:'ONNX Runtime Examples', url:'https://github.com/microsoft/onnxruntime-inference-examples'}]
  },
  { id: 'ai-style-rain', name: 'AI Style: Rain Princess', likes: 198, type: 'ai', family: 'ai-style',
    model: { framework: 'onnx', url: 'https://raw.githubusercontent.com/microsoft/onnxruntime-inference-examples/main/js/FastNeuralStyle/models/rain_princess.onnx' },
    sources:[{name:'ONNX Runtime Examples', url:'https://github.com/microsoft/onnxruntime-inference-examples'}]
  },
  { id: 'ai-style-muse', name: 'AI Style: The Muse', likes: 192, type: 'ai', family: 'ai-style',
    model: { framework: 'onnx', url: 'https://raw.githubusercontent.com/microsoft/onnxruntime-inference-examples/main/js/FastNeuralStyle/models/the_muse.onnx' },
    sources:[{name:'ONNX Runtime Examples', url:'https://github.com/microsoft/onnxruntime-inference-examples'}]
  }
];

function weekStamp(date = new Date()){
  // YYYY-Www per rotazione deterministica
  const firstJan = new Date(date.getFullYear(),0,1);
  const days = Math.floor((date - firstJan) / 86400000);
  const week = Math.floor((days + firstJan.getDay())/7)+1;
  return `${date.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

async function main(){
  const now = new Date();
  const stamp = weekStamp(now);
  // 1) aggrega dai piccoli adapter + base locale
  const fromAdapters = [
    ...(await adapters.filterous2()),
    ...(await adapters.pilgram()),
    ...(await adapters.opencv())
  ];
  const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth()-3);
  const raw = [...CANDIDATES, ...fromAdapters, ...AI_CANDIDATES]
    .map(x => ({...x, created_at: now.toISOString().slice(0,10)}))
    .filter(x => new Date(x.created_at) >= threeMonthsAgo);

  // 0) dedup per id e nome normalizzato — tiene quello con più likes
  const slug = s => (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const seen = new Map();
  for(const f of raw){
    const key = f.id || slug(f.name);
    const curr = seen.get(key);
    if(!curr || (f.likes||0) > (curr.likes||0)){
      seen.set(key, { ...f, id: key, name: f.name || key.replace(/-/g,' ') });
    }
  }
  const pool = Array.from(seen.values());

  // 2) ranking: likes + dissimilarità tra selezionati (diversità forte)
  // Similarità basata su set delle operazioni (Jaccard)
  const opsSet = f => new Set((f.pipeline||[]).map(s=>s.op));
  const jaccard = (a,b)=>{
    const A=opsSet(a), B=opsSet(b);
    const inter=[...A].filter(x=>B.has(x)).length;
    const uni = new Set([...A,...B]).size;
    return uni===0?0:inter/uni;
  };

  const baseRank = [...pool].sort((a,b)=> (b.likes||0)-(a.likes||0));
  const pickedClassic = [];
  const pickedAI = [];
  for(const cand of baseRank){
    if(pickedClassic.length>=5 && pickedAI.length>=5) break;
    const poolPicked = [...pickedClassic, ...pickedAI];
    const sameName = poolPicked.some(p => slug(p.name) === slug(cand.name));
    const sameId = poolPicked.some(p => p.id === cand.id);
    const tooSimilar = poolPicked.some(p => jaccard(p,cand) > 0.6); // evita pipeline troppo simili
    if(sameName || sameId || tooSimilar) continue;
    if (cand.type === 'ai') {
      if (pickedAI.length < 5) pickedAI.push(cand);
    } else {
      if (pickedClassic.length < 5) pickedClassic.push(cand);
    }
  }
  // 3) rotazione deterministica settimanale, separata per categoria
  const rot = (arr)=>{ const n = arr.length||1; const off = parseInt(stamp.slice(-2),10) % n; return arr.slice(off).concat(arr.slice(0,off)); };
  const scored = rot(pickedClassic).slice(0,5).concat(rot(pickedAI).slice(0,5));
  const chosen = scored.map(f => ({
    ...f,
    pipeline: f.pipeline || (
      f.family === 'contrast' ? [
        { op:'contrast', value:0.12 }, { op:'vibrance', value:0.30 }, { op:'vignette', value:0.22 }
      ] : f.family === 'teal' ? [
        { op:'vibrance', value:0.35 }, { op:'hue', value:10 }, { op:'clarity', value:0.10 }
      ] : f.family === 'film' ? [
        { op:'exposure', value:-0.03 }, { op:'warmth', value:0.20 }, { op:'grain', value:0.18 }
      ] : f.family === 'mono' ? [
        { op:'grayscale' }, { op:'edge', amount:1.0 }, { op:'levels', low:0.15, high:0.9 }
      ] : f.family === 'pattern' ? [
        { op:'saturation', value:0.25 }, { op:'halftone', size:6 }, { op:'contrast', value:0.15 }
      ] : [ { op:'contrast', value:0.08 } ]
    ),
    sources: SOURCES
  }));

  const json = { filters: chosen };
  await fs.writeFile(new URL('../filters.json', import.meta.url), JSON.stringify(json, null, 2));
  console.log(`filters.json aggiornato (${chosen.length} filtri) – settimana ${stamp}`);
}

main().catch(err=>{ console.error(err); process.exit(1); });


