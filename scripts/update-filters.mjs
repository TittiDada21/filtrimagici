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

// Preset candidati. Manteniamo 12 e poi selezioniamo i 10 più "nuovi" per rotazione settimanale.
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
  // Ordiniamo per likes e ruotiamo per settimana per dare varietà
  const sorted = [...CANDIDATES].sort((a,b)=> (b.likes||0)-(a.likes||0));
  const offset = (now.getWeekOffset = parseInt(stamp.slice(-2),10)) % sorted.length;
  const rotated = sorted.slice(offset).concat(sorted.slice(0, offset));
  const chosen = rotated.slice(0, 10).map(f => ({
    ...f,
    created_at: `${now.toISOString().slice(0,10)}`,
    sources: SOURCES
  }));

  const json = { filters: chosen };
  await fs.writeFile(new URL('../filters.json', import.meta.url), JSON.stringify(json, null, 2));
  console.log(`filters.json aggiornato (${chosen.length} filtri) – settimana ${stamp}`);
}

main().catch(err=>{ console.error(err); process.exit(1); });


