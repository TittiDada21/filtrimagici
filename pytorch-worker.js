// PyTorch Worker - Rivoluzione dei filtri immagine!
importScripts('https://cdn.jsdelivr.net/npm/@pytorch/torchvision@0.9.0/dist/torchvision.min.js');

console.log('🔥 PyTorch Worker caricato! TorchVision disponibile:', typeof torchvision !== 'undefined');

// Inizializza PyTorch
let torch = null;
let torchvision = null;

async function initPyTorch() {
  try {
    // Carica PyTorch e TorchVision
    const { default: torchModule } = await import('https://cdn.jsdelivr.net/npm/@pytorch/torch@2.0.0/dist/torch.min.js');
    const { default: torchvisionModule } = await import('https://cdn.jsdelivr.net/npm/@pytorch/torchvision@0.9.0/dist/torchvision.min.js');
    
    torch = torchModule;
    torchvision = torchvisionModule;
    
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
    const tensor = imageDataToTensor(imgData);
    
    // Applica ColorJitter
    let result = tensor;
    
    if (brightness > 0) {
      const brightnessFactor = 1.0 + (Math.random() * 2 - 1) * brightness;
      result = torchvision.transforms.functional.adjust_brightness(result, brightnessFactor);
    }
    
    if (contrast > 0) {
      const contrastFactor = 1.0 + (Math.random() * 2 - 1) * contrast;
      result = torchvision.transforms.functional.adjust_contrast(result, contrastFactor);
    }
    
    if (saturation > 0) {
      const saturationFactor = 1.0 + (Math.random() * 2 - 1) * saturation;
      result = torchvision.transforms.functional.adjust_saturation(result, saturationFactor);
    }
    
    if (hue > 0) {
      const hueFactor = (Math.random() * 2 - 1) * hue;
      result = torchvision.transforms.functional.adjust_hue(result, hueFactor);
    }
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // RandomAffine - Trasformazioni affini avanzate
  'pytorch-randomaffine': (imgData, params = {}) => {
    const { degrees = 15, translate = 0.1, scale = 0.1, shear = 10 } = params;
    const tensor = imageDataToTensor(imgData);
    
    // Genera parametri casuali deterministici
    const angle = (Math.random() * 2 - 1) * degrees;
    const tx = (Math.random() * 2 - 1) * translate;
    const ty = (Math.random() * 2 - 1) * translate;
    const sx = 1.0 + (Math.random() * 2 - 1) * scale;
    const sy = 1.0 + (Math.random() * 2 - 1) * scale;
    const shearX = (Math.random() * 2 - 1) * shear;
    const shearY = (Math.random() * 2 - 1) * shear;
    
    // Applica RandomAffine
    const result = torchvision.transforms.functional.affine(
      tensor, 
      angle, 
      [tx, ty], 
      [sx, sy], 
      [shearX, shearY]
    );
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // GaussianBlur - Blur gaussiano professionale
  'pytorch-gaussianblur': (imgData, params = {}) => {
    const { kernelSize = 5, sigma = 1.0 } = params;
    const tensor = imageDataToTensor(imgData);
    
    // Applica GaussianBlur
    const result = torchvision.transforms.functional.gaussian_blur(
      tensor, 
      kernelSize, 
      sigma
    );
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // RandomPerspective - Distorsioni prospettiche 3D
  'pytorch-randomperspective': (imgData, params = {}) => {
    const { distortionScale = 0.5, p = 0.5 } = params;
    const tensor = imageDataToTensor(imgData);
    
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
    
    // Applica RandomPerspective
    const result = torchvision.transforms.functional.perspective(
      tensor, 
      startPoints, 
      endPoints
    );
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // RandomPosterize - Posterizzazione intelligente
  'pytorch-randomposterize': (imgData, params = {}) => {
    const { bits = 4 } = params;
    const tensor = imageDataToTensor(imgData);
    
    // Applica RandomPosterize
    const result = torchvision.transforms.functional.posterize(tensor, bits);
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // RandomSolarize - Solarizzazione avanzata
  'pytorch-randomsolarize': (imgData, params = {}) => {
    const { threshold = 0.5 } = params;
    const tensor = imageDataToTensor(imgData);
    
    // Applica RandomSolarize
    const result = torchvision.transforms.functional.solarize(tensor, threshold);
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // RandomAdjustSharpness - Sharpness dinamico
  'pytorch-randomadjustsharpness': (imgData, params = {}) => {
    const { sharpnessFactor = 2.0 } = params;
    const tensor = imageDataToTensor(imgData);
    
    // Applica RandomAdjustSharpness
    const result = torchvision.transforms.functional.adjust_sharpness(
      tensor, 
      sharpnessFactor
    );
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // RandomAutocontrast - Autocontrasto intelligente
  'pytorch-randomautocontrast': (imgData, params = {}) => {
    const tensor = imageDataToTensor(imgData);
    
    // Applica RandomAutocontrast
    const result = torchvision.transforms.functional.autocontrast(tensor);
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // RandomInvert - Inversione colori
  'pytorch-randominvert': (imgData, params = {}) => {
    const tensor = imageDataToTensor(imgData);
    
    // Applica RandomInvert
    const result = torchvision.transforms.functional.invert(tensor);
    
    return tensorToImageData(result, imgData.width, imgData.height);
  },
  
  // RandomGrayscale - Conversione B&W intelligente
  'pytorch-randomgrayscale': (imgData, params = {}) => {
    const { p = 0.5 } = params;
    const tensor = imageDataToTensor(imgData);
    
    // Applica RandomGrayscale
    const result = torchvision.transforms.functional.to_grayscale(tensor, 3);
    
    return tensorToImageData(result, imgData.width, imgData.height);
  }
};

// Gestione messaggi
self.onmessage = async (e) => {
  const { id, filterType, params, width, height, data } = e.data;
  
  try {
    // Inizializza PyTorch se necessario
    if (!torch) {
      const success = await initPyTorch();
      if (!success) {
        throw new Error('PyTorch non disponibile');
      }
    }
    
    // Crea ImageData
    const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
    
    // Applica filtro PyTorch
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
