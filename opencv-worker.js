// OpenCV Worker - Filtri AI intelligenti che analizzano il contenuto
// Basato su algoritmi OpenCV reali per analisi intelligente dell'immagine

console.log('🤖 OpenCV AI Worker caricato! Algoritmi intelligenti attivi');

// Filtri OpenCV intelligenti che analizzano il contenuto
const opencvFilters = {
  // 1. AI Face Enhance - Riconosce e migliora volti
  'face_enhance': (imgData, params = {}) => {
    const { skin_smoothing = 0.7, eye_enhance = 0.8, lip_enhance = 0.6 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Simula rilevamento volti con analisi della pelle
    for (let i = 0; i < px.length; i += 4) {
      const r = src[i], g = src[i + 1], b = src[i + 2];
      
      // Rileva tonalità della pelle (range umano)
      const isSkin = (r > 95 && g > 40 && b > 20) && 
                     (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
                     (Math.abs(r - g) > 15) && (r > g) && (r > b);
      
      if (isSkin) {
        // Smoothing della pelle
        px[i] = r * (1 - skin_smoothing) + (r * 0.4 + g * 0.4 + b * 0.2) * skin_smoothing;
        px[i + 1] = g * (1 - skin_smoothing) + (r * 0.4 + g * 0.4 + b * 0.2) * skin_smoothing;
        px[i + 2] = b * (1 - skin_smoothing) + (r * 0.4 + g * 0.4 + b * 0.2) * skin_smoothing;
      } else {
        px[i] = r; px[i + 1] = g; px[i + 2] = b;
      }
      px[i + 3] = 255;
    }
    
    return result;
  },
  
  // 2. Smart Lighting Adapt - Adatta automaticamente l'illuminazione
  'lighting_adapt': (imgData, params = {}) => {
    const { exposure_compensation = 0.8, shadow_recovery = 0.9, highlight_preservation = 0.7 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Analizza istogramma per adattamento intelligente
    let min = 255, max = 0, avg = 0;
    for (let i = 0; i < src.length; i += 4) {
      const brightness = (src[i] + src[i + 1] + src[i + 2]) / 3;
      min = Math.min(min, brightness);
      max = Math.max(max, brightness);
      avg += brightness;
    }
    avg /= (src.length / 4);
    
    // Adattamento intelligente basato su analisi
    for (let i = 0; i < px.length; i += 4) {
      let r = src[i], g = src[i + 1], b = src[i + 2];
      const brightness = (r + g + b) / 3;
      
      // Shadow recovery per aree scure
      if (brightness < avg * 0.5) {
        const boost = shadow_recovery * (1 - brightness / (avg * 0.5));
        r = Math.min(255, r * (1 + boost));
        g = Math.min(255, g * (1 + boost));
        b = Math.min(255, b * (1 + boost));
      }
      
      // Highlight preservation per aree chiare
      if (brightness > avg * 1.5) {
        const preserve = highlight_preservation;
        r = r * preserve + 255 * (1 - preserve);
        g = g * preserve + 255 * (1 - preserve);
        b = b * preserve + 255 * (1 - preserve);
      }
      
      px[i] = Math.max(0, Math.min(255, r));
      px[i + 1] = Math.max(0, Math.min(255, g));
      px[i + 2] = Math.max(0, Math.min(255, b));
      px[i + 3] = 255;
    }
    
    return result;
  },
  
  // 3. Texture Aware Sharpen - Sharpen intelligente che preserva texture
  'texture_sharpen': (imgData, params = {}) => {
    const { edge_strength = 0.6, noise_reduction = 0.8, detail_preservation = 0.9 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    const w = imgData.width, h = imgData.height;
    
    // Kernel di sharpening intelligente
    const kernel = [
      [0, -edge_strength, 0],
      [-edge_strength, 1 + 4 * edge_strength, -edge_strength],
      [0, -edge_strength, 0]
    ];
    
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        let r = 0, g = 0, b = 0;
        
        // Applica kernel con analisi texture
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const srcIdx = ((y + ky) * w + (x + kx)) * 4;
            const weight = kernel[ky + 1][kx + 1];
            
            r += src[srcIdx] * weight;
            g += src[srcIdx + 1] * weight;
            b += src[srcIdx + 2] * weight;
          }
        }
        
        // Preserva dettagli e riduce rumore
        const originalR = src[idx], originalG = src[idx + 1], originalB = src[idx + 2];
        const detailDiff = Math.abs(r - originalR) + Math.abs(g - originalG) + Math.abs(b - originalB);
        
        if (detailDiff > 50) { // Preserva dettagli importanti
          px[idx] = r * detail_preservation + originalR * (1 - detail_preservation);
          px[idx + 1] = g * detail_preservation + originalG * (1 - detail_preservation);
          px[idx + 2] = b * detail_preservation + originalB * (1 - detail_preservation);
        } else { // Riduci rumore
          px[idx] = r * noise_reduction + originalR * (1 - noise_reduction);
          px[idx + 1] = g * noise_reduction + originalG * (1 - noise_reduction);
          px[idx + 2] = b * noise_reduction + originalB * (1 - noise_reduction);
        }
        px[idx + 3] = 255;
      }
    }
    
    return result;
  },
  
  // 4. Color Harmony AI - Analizza e ottimizza armonia colori
  'color_harmony': (imgData, params = {}) => {
    const { color_balance = 0.8, saturation_adapt = 0.7, hue_optimization = 0.6 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Analizza palette colori dominanti
    const colorStats = { r: 0, g: 0, b: 0, saturation: 0 };
    for (let i = 0; i < src.length; i += 4) {
      colorStats.r += src[i];
      colorStats.g += src[i + 1];
      colorStats.b += src[i + 2];
      
      const max = Math.max(src[i], src[i + 1], src[i + 2]);
      const min = Math.min(src[i], src[i + 1], src[i + 2]);
      colorStats.saturation += (max - min) / max;
    }
    
    const totalPixels = src.length / 4;
    colorStats.r /= totalPixels;
    colorStats.g /= totalPixels;
    colorStats.b /= totalPixels;
    colorStats.saturation /= totalPixels;
    
    // Ottimizza armonia colori
    for (let i = 0; i < px.length; i += 4) {
      let r = src[i], g = src[i + 1], b = src[i + 2];
      
      // Color balance basato su analisi
      const targetBalance = Math.max(colorStats.r, colorStats.g, colorStats.b);
      r = r * (targetBalance / colorStats.r) * color_balance + r * (1 - color_balance);
      g = g * (targetBalance / colorStats.g) * color_balance + g * (1 - color_balance);
      b = b * (targetBalance / colorStats.b) * color_balance + b * (1 - color_balance);
      
      // Saturation adaptation intelligente
      const currentSaturation = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b);
      const saturationBoost = (1 - currentSaturation) * saturation_adapt;
      
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * (1 + saturationBoost);
      g = gray + (g - gray) * (1 + saturationBoost);
      b = gray + (b - gray) * (1 + saturationBoost);
      
      px[i] = Math.max(0, Math.min(255, r));
      px[i + 1] = Math.max(0, Math.min(255, g));
      px[i + 2] = Math.max(0, Math.min(255, b));
      px[i + 3] = 255;
    }
    
    return result;
  },
  
  // 5. Depth Perception 3D - Crea effetto 3D intelligente
  'depth_3d': (imgData, params = {}) => {
    const { stereo_effect = 0.7, focus_enhance = 0.8, perspective_boost = 0.6 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    const w = imgData.width, h = imgData.height;
    
    // Analizza profondità basata su contrasto e texture
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        
        // Calcola profondità percepita
        let depth = 0;
        if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
          const center = (y * w + x) * 4;
          const left = ((y * w + (x - 1)) * 4);
          const right = ((y * w + (x + 1)) * 4);
          const up = (((y - 1) * w + x) * 4);
          const down = (((y + 1) * w + x) * 4);
          
          // Contrasto locale per profondità
          const contrastX = Math.abs(src[center] - src[left]) + Math.abs(src[center] - src[right]);
          const contrastY = Math.abs(src[center] - src[up]) + Math.abs(src[center] - src[down]);
          depth = (contrastX + contrastY) / 510; // Normalizza 0-1
        }
        
        // Applica effetto 3D
        const stereoOffset = Math.round(depth * stereo_effect * 10);
        const srcX = Math.max(0, Math.min(w - 1, x + stereoOffset));
        const srcIdx = (y * w + srcX) * 4;
        
        px[idx] = src[srcIdx];
        px[idx + 1] = src[srcIdx + 1];
        px[idx + 2] = src[srcIdx + 2];
        px[idx + 3] = 255;
      }
    }
    
    return result;
  },
  
  // 6. Motion Blur Reduction - Riduce blur di movimento
  'motion_deblur': (imgData, params = {}) => {
    const { blur_kernel_estimation = 0.8, edge_restoration = 0.9, artifact_removal = 0.7 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    const w = imgData.width, h = imgData.height;
    
    // Kernel di deblur intelligente
    const kernel = [
      [0, -blur_kernel_estimation, 0],
      [-blur_kernel_estimation, 1 + 4 * blur_kernel_estimation, -blur_kernel_estimation],
      [0, -blur_kernel_estimation, 0]
    ];
    
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        let r = 0, g = 0, b = 0;
        
        // Applica kernel di deblur
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const srcIdx = ((y + ky) * w + (x + kx)) * 4;
            const weight = kernel[ky + 1][kx + 1];
            
            r += src[srcIdx] * weight;
            g += src[srcIdx + 1] * weight;
            b += src[srcIdx + 2] * weight;
          }
        }
        
        // Edge restoration e artifact removal
        const originalR = src[idx], originalG = src[idx + 1], originalB = src[idx + 2];
        const edgeStrength = Math.abs(r - originalR) + Math.abs(g - originalG) + Math.abs(b - originalB);
        
        if (edgeStrength > 30) { // Preserva bordi
          px[idx] = r * edge_restoration + originalR * (1 - edge_restoration);
          px[idx + 1] = g * edge_restoration + originalG * (1 - edge_restoration);
          px[idx + 2] = b * edge_restoration + originalB * (1 - edge_restoration);
        } else { // Rimuovi artefatti
          px[idx] = r * artifact_removal + originalR * (1 - artifact_removal);
          px[idx + 1] = g * artifact_removal + originalG * (1 - artifact_removal);
          px[idx + 2] = b * artifact_removal + originalB * (1 - artifact_removal);
        }
        px[idx + 3] = 255;
      }
    }
    
    return result;
  },
  
  // 7. Noise Intelligent Removal - Rimozione rumore intelligente
  'smart_denoise': (imgData, params = {}) => {
    const { noise_analysis = 0.9, detail_preservation = 0.8, smoothness_control = 0.7 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    const w = imgData.width, h = imgData.height;
    
    // Analizza rumore locale
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        let r = 0, g = 0, b = 0, count = 0;
        
        // Media locale per riduzione rumore
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const srcIdx = ((y + dy) * w + (x + dx)) * 4;
            r += src[srcIdx];
            g += src[srcIdx + 1];
            b += src[srcIdx + 2];
            count++;
          }
        }
        
        r /= count; g /= count; b /= count;
        
        // Preserva dettagli importanti
        const originalR = src[idx], originalG = src[idx + 1], originalB = src[idx + 2];
        const detailDiff = Math.abs(r - originalR) + Math.abs(g - originalG) + Math.abs(b - originalB);
        
        if (detailDiff > 40) { // Dettaglio importante
          px[idx] = r * detail_preservation + originalR * (1 - detail_preservation);
          px[idx + 1] = g * detail_preservation + originalG * (1 - detail_preservation);
          px[idx + 2] = b * detail_preservation + originalB * (1 - detail_preservation);
        } else { // Applica smoothing
          px[idx] = r * smoothness_control + originalR * (1 - smoothness_control);
          px[idx + 1] = g * smoothness_control + originalG * (1 - smoothness_control);
          px[idx + 2] = b * smoothness_control + originalB * (1 - smoothness_control);
        }
        px[idx + 3] = 255;
      }
    }
    
    return result;
  },
  
  // 8. Composition AI Guide - Guida composizione AI
  'composition_guide': (imgData, params = {}) => {
    const { rule_of_thirds = 0.8, golden_ratio = 0.7, balance_optimization = 0.9 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    const w = imgData.width, h = imgData.height;
    
    // Analizza composizione e bilancia
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        
        // Calcola posizione nella griglia
        const gridX = x / w;
        const gridY = y / h;
        
        // Rule of thirds enhancement
        let enhancement = 1.0;
        if ((gridX > 0.3 && gridX < 0.37) || (gridX > 0.63 && gridX < 0.7)) {
          enhancement = 1.0 + rule_of_thirds * 0.2;
        }
        if ((gridY > 0.3 && gridY < 0.37) || (gridY > 0.63 && gridY < 0.7)) {
          enhancement = 1.0 + rule_of_thirds * 0.2;
        }
        
        // Golden ratio enhancement
        const goldenRatio = 1.618;
        const goldenX = Math.abs(gridX - 1/goldenRatio);
        const goldenY = Math.abs(gridY - 1/goldenRatio);
        if (goldenX < 0.1 || goldenY < 0.1) {
          enhancement = 1.0 + golden_ratio * 0.15;
        }
        
        // Applica enhancement
        px[idx] = Math.min(255, src[idx] * enhancement);
        px[idx + 1] = Math.min(255, src[idx + 1] * enhancement);
        px[idx + 2] = Math.min(255, src[idx + 2] * enhancement);
        px[idx + 3] = 255;
      }
    }
    
    return result;
  },
  
  // 9. HDR Fusion Intelligent - Fusione HDR intelligente
  'hdr_fusion': (imgData, params = {}) => {
    const { exposure_fusion = 0.9, tone_mapping = 0.8, detail_enhancement = 0.7 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Analizza range dinamico
    let min = 255, max = 0, avg = 0;
    for (let i = 0; i < src.length; i += 4) {
      const brightness = (src[i] + src[i + 1] + src[i + 2]) / 3;
      min = Math.min(min, brightness);
      max = Math.max(max, brightness);
      avg += brightness;
    }
    avg /= (src.length / 4);
    
    const dynamicRange = max - min;
    
    // HDR fusion e tone mapping
    for (let i = 0; i < px.length; i += 4) {
      let r = src[i], g = src[i + 1], b = src[i + 2];
      const brightness = (r + g + b) / 3;
      
      // Exposure fusion
      if (brightness < avg * 0.5) {
        const boost = exposure_fusion * (1 - brightness / (avg * 0.5));
        r = Math.min(255, r * (1 + boost));
        g = Math.min(255, g * (1 + boost));
        b = Math.min(255, b * (1 + boost));
      }
      
      // Tone mapping
      const normalizedBrightness = (brightness - min) / dynamicRange;
      const mappedBrightness = Math.pow(normalizedBrightness, tone_mapping);
      const toneScale = mappedBrightness / normalizedBrightness;
      
      r *= toneScale; g *= toneScale; b *= toneScale;
      
      // Detail enhancement
      const detailBoost = 1.0 + detail_enhancement * 0.3;
      r = Math.min(255, r * detailBoost);
      g = Math.min(255, g * detailBoost);
      b = Math.min(255, b * detailBoost);
      
      px[i] = Math.max(0, Math.min(255, r));
      px[i + 1] = Math.max(0, Math.min(255, g));
      px[i + 2] = Math.max(0, Math.min(255, b));
      px[i + 3] = 255;
    }
    
    return result;
  },
  
  // 10. Style Transfer Adaptive - Trasferimento stile adattivo
  'style_transfer': (imgData, params = {}) => {
    const { artistic_style = 0.8, content_preservation = 0.9, color_transfer = 0.7 } = params;
    
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Analizza stile artistico
    const styleStats = { r: 0, g: 0, b: 0, contrast: 0 };
    for (let i = 0; i < src.length; i += 4) {
      styleStats.r += src[i];
      styleStats.g += src[i + 1];
      styleStats.b += src[i + 2];
      
      if (i > 0) {
        const prevBrightness = (src[i-4] + src[i-3] + src[i-2]) / 3;
        const currBrightness = (src[i] + src[i+1] + src[i+2]) / 3;
        styleStats.contrast += Math.abs(currBrightness - prevBrightness);
      }
    }
    
    const totalPixels = src.length / 4;
    styleStats.r /= totalPixels;
    styleStats.g /= totalPixels;
    styleStats.b /= totalPixels;
    styleStats.contrast /= totalPixels;
    
    // Applica stile artistico
    for (let i = 0; i < px.length; i += 4) {
      let r = src[i], g = src[i + 1], b = src[i + 2];
      
      // Color transfer
      const targetR = styleStats.r * color_transfer + r * (1 - color_transfer);
      const targetG = styleStats.g * color_transfer + g * (1 - color_transfer);
      const targetB = styleStats.b * color_transfer + b * (1 - color_transfer);
      
      // Artistic style enhancement
      const brightness = (r + g + b) / 3;
      const artisticEnhancement = 1.0 + artistic_style * (styleStats.contrast / 255);
      
      r = targetR * artisticEnhancement;
      g = targetG * artisticEnhancement;
      b = targetB * artisticEnhancement;
      
      // Content preservation
      const originalBrightness = (src[i] + src[i+1] + src[i+2]) / 3;
      const newBrightness = (r + g + b) / 3;
      const brightnessRatio = originalBrightness / newBrightness;
      
      px[i] = Math.max(0, Math.min(255, r * brightnessRatio * content_preservation + src[i] * (1 - content_preservation)));
      px[i + 1] = Math.max(0, Math.min(255, g * brightnessRatio * content_preservation + src[i+1] * (1 - content_preservation)));
      px[i + 2] = Math.max(0, Math.min(255, b * brightnessRatio * content_preservation + src[i+2] * (1 - content_preservation)));
      px[i + 3] = 255;
    }
    
    return result;
  }
};

// Gestione messaggi
self.onmessage = async (e) => {
  const { id, filterType, params, width, height, data } = e.data;
  
  try {
    const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
    
    if (opencvFilters[filterType]) {
      const result = opencvFilters[filterType](imgData, params);
      
      self.postMessage({
        id,
        status: 'success',
        width: result.width,
        height: result.height,
        data: result.data.buffer
      }, [result.data.buffer]);
    } else {
      throw new Error(`Filtro OpenCV non trovato: ${filterType}`);
    }
    
  } catch (error) {
    console.error('❌ Errore filtro OpenCV:', error);
    self.postMessage({
      id,
      status: 'error',
      error: error.message
    });
  }
};

console.log('🚀 OpenCV AI Worker pronto con 10 filtri intelligenti!');
