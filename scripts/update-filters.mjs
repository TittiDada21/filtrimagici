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
    { id: 'fresh-contrast', name: 'Fresh Contrast', likes: 57, family: 'contrast' },
    { id: 'teal-boost', name: 'Teal Boost', likes: 83, family: 'teal' },
    { id: 'warm-film-grain', name: 'Warm Film Grain', likes: 77, family: 'film' },
  ]),
  pilgram: async () => ([
    { id: 'ink-sketch-lite', name: 'Ink Sketch', likes: 76, family: 'mono' },
    { id: 'noir-edges', name: 'Noir Edges', likes: 48, family: 'mono' },
  ]),
  opencv: async () => ([
    { id: 'pop-halftone', name: 'Pop Halftone', likes: 72, family: 'pattern' },
    { id: 'vivid-halftone', name: 'Vivid Halftone', likes: 68, family: 'pattern' },
    { id: 'cool-ink', name: 'Cool Ink', likes: 53, family: 'mono' },
  ])
};

// Preset candidati base
const CANDIDATES = [
  { id: 'fresh-contrast', name: 'Fresh Contrast', likes: 57, pipeline: [
      { op: 'contrast', value: 0.12 }, { op: 'vibrance', value: 0.30 }, { op: 'vignette', value: 0.22 }
  ]},
  { id: 'teal-boost', name: 'Teal Boost', likes: 83, pipeline: [
      { op: 'vibrance', value: 0.35 }, { op: 'hue', value: 10 }, { op: 'clarity', value: 0.10 }
  ]},
  { id: 'film-soft-warm', name: 'Film Soft Warm', likes: 44, pipeline: [
      { op: 'exposure', value: -0.04 }, { op: 'contrast', value: 0.08 }, { op: 'warmth', value: 0.18 }
  ]},
  { id: 'mono-edges', name: 'Mono Edges', likes: 65, pipeline: [
      { op: 'grayscale' }, { op: 'edge', amount: 1.0 }, { op: 'levels', low: 0.15, high: 0.90 }
  ]},
  { id: 'pop-halftone', name: 'Pop Halftone', likes: 72, pipeline: [
      { op: 'saturation', value: 0.25 }, { op: 'halftone', size: 6 }, { op: 'contrast', value: 0.15 }
  ]},
  { id: 'cinematic-tealorange-lite', name: 'Cinematic Teal/Orange', likes: 91, pipeline: [
      { op: 'contrast', value: 0.10 }, { op: 'splitTone', shadows: {h:200,s:0.22}, highlights:{h:35,s:0.18} }, { op: 'clarity', value: 0.08 }
  ]},
  { id: 'noir-edges', name: 'Noir Edges', likes: 48, pipeline: [
      { op: 'grayscale' }, { op: 'edge', amount: 0.9 }, { op: 'levels', low: 0.12, high: 0.88 }
  ]},
  { id: 'warm-film-grain', name: 'Warm Film Grain', likes: 77, pipeline: [
      { op: 'exposure', value: -0.03 }, { op: 'warmth', value: 0.20 }, { op: 'grain', value: 0.18 }
  ]},
  { id: 'cool-ink', name: 'Cool Ink', likes: 53, pipeline: [
      { op: 'grayscale' }, { op: 'hue', value: 188 }, { op: 'contrast', value: 0.09 }
  ]},
  { id: 'vivid-halftone', name: 'Vivid Halftone', likes: 68, pipeline: [
      { op: 'saturation', value: 0.30 }, { op: 'halftone', size: 5 }, { op: 'contrast', value: 0.12 }
  ]},
  { id: 'neon-noise-v1', name: 'Neon Noise', likes: 120, pipeline: [
      { op: 'exposure', value: 0.08 }, { op: 'vibrance', value: 0.35 }, { op: 'hue', value: 12 }, { op: 'contrast', value: 0.12 }, { op: 'grain', value: 0.15 }
  ]},
  { id: 'ink-sketch-lite', name: 'Ink Sketch', likes: 76, pipeline: [
      { op: 'grayscale' }, { op: 'edge', amount: 1.0 }, { op: 'levels', low: 0.15, high: 0.90 }
  ]}
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
  const pool = [...CANDIDATES, ...fromAdapters]
    .map(x => ({...x, created_at: now.toISOString().slice(0,10)}));

  // 2) ranking: likes + diversity penalty per family
  const familyCount = {};
  const scored = pool
    .sort((a,b)=> (b.likes||0)-(a.likes||0))
    .map(f => {
      const fam = f.family || 'misc';
      const penalty = (familyCount[fam]||0) * 5; // penalizza ripetizioni
      const score = (f.likes||0) - penalty;
      familyCount[fam] = (familyCount[fam]||0) + 1;
      return { ...f, score };
    })
    .sort((a,b)=> b.score - a.score);

  // 3) rotazione deterministica settimanale
  const offset = parseInt(stamp.slice(-2),10) % scored.length;
  const rotated = scored.slice(offset).concat(scored.slice(0, offset));
  const chosen = rotated.slice(0, 10).map(f => ({
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


