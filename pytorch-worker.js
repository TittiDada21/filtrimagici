// PyTorch Worker - Rivoluzione dei filtri immagine!
importScripts('https://cdn.jsdelivr.net/npm/@pytorch/torch@2.0.0/dist/torch.min.js');
importScripts('https://cdn.jsdelivr.net/npm/@pytorch/torchvision@0.9.0/dist/torchvision.min.js');

console.log('🔥 PyTorch Worker caricato! TorchVision disponibile:', typeof torchvision !== 'undefined');

// Inizializza PyTorch
let torch = null;
let torchvision = null;

async function initPyTorch() {
  try {
    // Carica PyTorch e TorchVision dai CDN corretti
    if (typeof torch === 'undefined') {
      // Fallback se i CDN non funzionano
      console.log('⚠️ CDN PyTorch non disponibili, uso fallback locale');
      return false;
    }
    
    torch = window.torch || self.torch;
    torchvision = window.torchvision || self.torchvision;
    
    console.log('✅ PyTorch e TorchVision inizializzati!');
    return true;
  } catch (error) {
    console.error('❌ Errore caricamento PyTorch:', error);
    return false;
  }
}

// Converti ImageData in tensor PyTorch
function imageDataToTensor(imgData) {
  const { width, height, data } = imgData;
  const tensor = new Float32Array(width * height * 3);
  
  for (let i = 0; i < width * height; i++) {
    const pixelIndex = i * 4;
    tensor[i] = data[pixelIndex] / 255.0;           // R
    tensor[i + width * height] = data[pixelIndex + 1] / 255.0; // G
    tensor[i + 2 * width * height] = data[pixelIndex + 2] / 255.0; // B
  }
  
  return torch.tensor(tensor).reshape([3, height, width]);
}

// Converti tensor PyTorch in ImageData
function tensorToImageData(tensor, width, height) {
  const data = tensor.data();
  const imgData = new ImageData(width, height);
  
  for (let i = 0; i < width * height; i++) {
    const pixelIndex = i * 4;
    imgData.data[pixelIndex] = Math.max(0, Math.min(255, data[i] * 255));           // R
    imgData.data[pixelIndex + 1] = Math.max(0, Math.min(255, data[i + width * height] * 255)); // G
    imgData.data[pixelIndex + 2] = Math.max(0, Math.min(255, data[i + 2 * width * height] * 255)); // B
    imgData.data[pixelIndex + 3] = 255; // Alpha
  }
  
  return imgData;
}

// Filtri PyTorch rivoluzionari
const pytorchFilters = {
  // ColorJitter - Cambio dinamico di colori
  'pytorch-colorjitter': (imgData, params = {}) => {
    const { brightness = 0.2, contrast = 0.2, saturation = 0.2, hue = 0.1 } = params;
    
    // Fallback locale avanzato se PyTorch non disponibile
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    for (let i = 0; i < px.length; i += 4) {
      let r = src[i] / 255;
      let g = src[i + 1] / 255;
      let b = src[i + 2] / 255;
      
      // Brightness
      const brightnessFactor = 1.0 + (Math.random() * 2 - 1) * brightness;
      r *= brightnessFactor; g *= brightnessFactor; b *= brightnessFactor;
      
      // Contrast
      const contrastFactor = 1.0 + (Math.random() * 2 - 1) * contrast;
      r = (r - 0.5) * contrastFactor + 0.5;
      g = (g - 0.5) * contrastFactor + 0.5;
      b = (b - 0.5) * contrastFactor + 0.5;
      
      // Saturation
      const saturationFactor = 1.0 + (Math.random() * 2 - 1) * saturation;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;
      
      // Hue shift
      const hueFactor = (Math.random() * 2 - 1) * hue;
      const hsv = rgb2hsv(r, g, b);
      hsv[0] = (hsv[0] + hueFactor) % 1.0;
      const rgb = hsv2rgb(hsv[0], hsv[1], hsv[2]);
      r = rgb[0]; g = rgb[1]; b = rgb[2];
      
      px[i] = Math.max(0, Math.min(255, r * 255));
      px[i + 1] = Math.max(0, Math.min(255, g * 255));
      px[i + 2] = Math.max(0, Math.min(255, b * 255));
      px[i + 3] = 255;
    }
    
    return result;
  },
  
  // RandomAffine - Trasformazioni affini avanzate
  'pytorch-randomaffine': (imgData, params = {}) => {
    const { degrees = 15, translate = 0.1, scale = 0.1, shear = 10 } = params;
    
    // Fallback locale per trasformazioni affini
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Genera parametri casuali deterministici
    const angle = (Math.random() * 2 - 1) * degrees * Math.PI / 180;
    const tx = (Math.random() * 2 - 1) * translate * imgData.width;
    const ty = (Math.random() * 2 - 1) * translate * imgData.height;
    const sx = 1.0 + (Math.random() * 2 - 1) * scale;
    const sy = 1.0 + (Math.random() * 2 - 1) * scale;
    const shearX = Math.tan((Math.random() * 2 - 1) * shear * Math.PI / 180);
    const shearY = Math.tan((Math.random() * 2 - 1) * shear * Math.PI / 180);
    
    const centerX = imgData.width / 2;
    const centerY = imgData.height / 2;
    
    for (let y = 0; y < imgData.height; y++) {
      for (let x = 0; x < imgData.width; x++) {
        // Trasformazione affine
        let srcX = (x - centerX) * Math.cos(angle) - (y - centerY) * Math.sin(angle);
        let srcY = (x - centerX) * Math.sin(angle) + (y - centerY) * Math.cos(angle);
        
        srcX = srcX * sx + shearX * srcY + centerX + tx;
        srcY = srcY * sy + shearY * srcX + centerY + ty;
        
        const srcIdx = Math.floor(srcY) * imgData.width + Math.floor(srcX);
        const dstIdx = y * imgData.width + x;
        
        if (srcIdx >= 0 && srcIdx < imgData.width * imgData.height) {
          px[dstIdx * 4] = src[srcIdx * 4];
          px[dstIdx * 4 + 1] = src[srcIdx * 4 + 1];
          px[dstIdx * 4 + 2] = src[srcIdx * 4 + 2];
          px[dstIdx * 4 + 3] = 255;
        }
      }
    }
    
    return result;
  },
  
  // GaussianBlur - Blur gaussiano professionale
  'pytorch-gaussianblur': (imgData, params = {}) => {
    const { kernelSize = 5, sigma = 1.0 } = params;
    
    // Fallback locale per blur gaussiano
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Genera kernel gaussiano
    const kernel = [];
    const halfSize = Math.floor(kernelSize / 2);
    let sum = 0;
    
    for (let y = -halfSize; y <= halfSize; y++) {
      for (let x = -halfSize; x <= halfSize; x++) {
        const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
        kernel.push(value);
        sum += value;
      }
    }
    
    // Normalizza kernel
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }
    
    // Applica blur
    for (let y = 0; y < imgData.height; y++) {
      for (let x = 0; x < imgData.width; x++) {
        let r = 0, g = 0, b = 0;
        let k = 0;
        
        for (let ky = -halfSize; ky <= halfSize; ky++) {
          for (let kx = -halfSize; kx <= halfSize; kx++) {
            const sx = Math.max(0, Math.min(imgData.width - 1, x + kx));
            const sy = Math.max(0, Math.min(imgData.height - 1, y + ky));
            const idx = sy * imgData.width + sx;
            
            r += src[idx * 4] * kernel[k];
            g += src[idx * 4 + 1] * kernel[k];
            b += src[idx * 4 + 2] * kernel[k];
            k++;
          }
        }
        
        const dstIdx = y * imgData.width + x;
        px[dstIdx * 4] = Math.round(r);
        px[dstIdx * 4 + 1] = Math.round(g);
        px[dstIdx * 4 + 2] = Math.round(b);
        px[dstIdx * 4 + 3] = 255;
      }
    }
    
    return result;
  },
  
  // RandomPerspective - Distorsioni prospettiche 3D
  'pytorch-randomperspective': (imgData, params = {}) => {
    const { distortionScale = 0.5, p = 0.5 } = params;
    
    // Fallback locale per distorsione prospettica
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Genera punti di controllo per distorsione prospettica
    const height = imgData.height;
    const width = imgData.width;
    
    const startPoints = [
      [0, 0], [width, 0], [width, height], [0, height]
    ];
    
    const endPoints = startPoints.map(([x, y]) => [
      x + (Math.random() * 2 - 1) * distortionScale * width,
      y + (Math.random() * 2 - 1) * distortionScale * height
    ]);
    
    // Trasformazione prospettica semplificata
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = y / height;
        const s = x / width;
        
        // Interpolazione bilineare dei punti di controllo
        const srcX = startPoints[0][0] * (1-s) * (1-t) + startPoints[1][0] * s * (1-t) +
                     startPoints[2][0] * s * t + startPoints[3][0] * (1-s) * t;
        const srcY = startPoints[0][1] * (1-s) * (1-t) + startPoints[1][1] * s * (1-t) +
                     startPoints[2][1] * s * t + startPoints[3][1] * (1-s) * t;
        
        const dstIdx = y * width + x;
        const srcIdx = Math.floor(srcY) * width + Math.floor(srcX);
        
        if (srcIdx >= 0 && srcIdx < width * height) {
          px[dstIdx * 4] = src[srcIdx * 4];
          px[dstIdx * 4 + 1] = src[srcIdx * 4 + 1];
          px[dstIdx * 4 + 2] = src[srcIdx * 4 + 2];
          px[dstIdx * 4 + 3] = 255;
        }
      }
    }
    
    return result;
  },
  
  // RandomPosterize - Posterizzazione intelligente
  'pytorch-randomposterize': (imgData, params = {}) => {
    const { bits = 4 } = params;
    
    // Fallback locale per posterizzazione
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    const levels = Math.pow(2, bits);
    const step = 256 / levels;
    
    for (let i = 0; i < px.length; i += 4) {
      px[i] = Math.floor(src[i] / step) * step;           // R
      px[i + 1] = Math.floor(src[i + 1] / step) * step;   // G
      px[i + 2] = Math.floor(src[i + 2] / step) * step;   // B
      px[i + 3] = 255;                                     // A
    }
    
    return result;
  },
  
  // RandomSolarize - Solarizzazione avanzata
  'pytorch-randomsolarize': (imgData, params = {}) => {
    const { threshold = 0.5 } = params;
    
    // Fallback locale per solarizzazione
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    const thresh = threshold * 255;
    
    for (let i = 0; i < px.length; i += 4) {
      px[i] = src[i] > thresh ? 255 - src[i] : src[i];           // R
      px[i + 1] = src[i + 1] > thresh ? 255 - src[i + 1] : src[i + 1]; // G
      px[i + 2] = src[i + 2] > thresh ? 255 - src[i + 2] : src[i + 2]; // B
      px[i + 3] = 255;                                             // A
    }
    
    return result;
  },
  
  // RandomAdjustSharpness - Sharpness dinamico
  'pytorch-randomadjustsharpness': (imgData, params = {}) => {
    const { sharpnessFactor = 2.0 } = params;
    
    // Fallback locale per sharpness
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Kernel di sharpening
    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ];
    
    for (let y = 1; y < imgData.height - 1; y++) {
      for (let x = 1; x < imgData.width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * imgData.width + (x + kx);
            const weight = kernel[ky + 1][kx + 1];
            
            r += src[idx * 4] * weight;
            g += src[idx * 4 + 1] * weight;
            b += src[idx * 4 + 2] * weight;
          }
        }
        
        const dstIdx = y * imgData.width + x;
        px[dstIdx * 4] = Math.max(0, Math.min(255, r * sharpnessFactor));
        px[dstIdx * 4 + 1] = Math.max(0, Math.min(255, g * sharpnessFactor));
        px[dstIdx * 4 + 2] = Math.max(0, Math.min(255, b * sharpnessFactor));
        px[dstIdx * 4 + 3] = 255;
      }
    }
    
    return result;
  },
  
  // RandomAutocontrast - Autocontrasto intelligente
  'pytorch-randomautocontrast': (imgData, params = {}) => {
    // Fallback locale per autocontrasto
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    // Trova min e max per ogni canale
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    
    for (let i = 0; i < src.length; i += 4) {
      minR = Math.min(minR, src[i]);
      maxR = Math.max(maxR, src[i]);
      minG = Math.min(minG, src[i + 1]);
      maxG = Math.max(maxG, src[i + 1]);
      minB = Math.min(minB, src[i + 2]);
      maxB = Math.max(maxB, src[i + 2]);
    }
    
    // Applica autocontrasto
    for (let i = 0; i < px.length; i += 4) {
      px[i] = maxR > minR ? ((src[i] - minR) * 255) / (maxR - minR) : src[i];
      px[i + 1] = maxG > minG ? ((src[i + 1] - minG) * 255) / (maxG - minG) : src[i + 1];
      px[i + 2] = maxB > minB ? ((src[i + 2] - minB) * 255) / (maxB - minB) : src[i + 2];
      px[i + 3] = 255;
    }
    
    return result;
  },
  
  // RandomInvert - Inversione colori
  'pytorch-randominvert': (imgData, params = {}) => {
    // Fallback locale per inversione
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    for (let i = 0; i < px.length; i += 4) {
      px[i] = 255 - src[i];           // R
      px[i + 1] = 255 - src[i + 1];   // G
      px[i + 2] = 255 - src[i + 2];   // B
      px[i + 3] = 255;                 // A
    }
    
    return result;
  },
  
  // RandomGrayscale - Conversione B&W intelligente
  'pytorch-randomgrayscale': (imgData, params = {}) => {
    // Fallback locale per grayscale
    const result = new ImageData(imgData.width, imgData.height);
    const px = result.data;
    const src = imgData.data;
    
    for (let i = 0; i < px.length; i += 4) {
      const gray = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
      px[i] = gray;     // R
      px[i + 1] = gray; // G
      px[i + 2] = gray; // B
      px[i + 3] = 255;  // A
    }
    
    return result;
  }
};

// Funzioni helper per conversione colore
function rgb2hsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  if (diff === 0) h = 0;
  else if (max === r) h = ((g - b) / diff) % 6;
  else if (max === g) h = (b - r) / diff + 2;
  else h = (r - g) / diff + 4;
  
  h = h / 6;
  if (h < 0) h += 1;
  
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  return [h, s, v];
}

function hsv2rgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = v - c;
  
  let r, g, b;
  if (h < 1/6) { r = c; g = x; b = 0; }
  else if (h < 2/6) { r = x; g = c; b = 0; }
  else if (h < 3/6) { r = 0; g = c; b = x; }
  else if (h < 4/6) { r = 0; g = x; b = c; }
  else if (h < 5/6) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  return [r + m, g + m, b + m];
}

// Gestione messaggi
self.onmessage = async (e) => {
  const { id, filterType, params, width, height, data } = e.data;
  
  try {
    // Crea ImageData
    const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
    
    // Applica filtro PyTorch (fallback locale)
    if (pytorchFilters[filterType]) {
      const result = pytorchFilters[filterType](imgData, params);
      
      // Invia risultato
      self.postMessage({
        id,
        status: 'success',
        width: result.width,
        height: result.height,
        data: result.data.buffer
      }, [result.data.buffer]);
    } else {
      throw new Error(`Filtro PyTorch non trovato: ${filterType}`);
    }
    
  } catch (error) {
    console.error('❌ Errore filtro PyTorch:', error);
    self.postMessage({
      id,
      status: 'error',
      error: error.message
    });
  }
};

console.log('🚀 PyTorch Worker pronto per la rivoluzione!');
