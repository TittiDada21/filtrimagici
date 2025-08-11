#!/usr/bin/env python3
"""
Filtri Immagine Avanzati con PyTorch e TorchVision

Script che applica 10 filtri creativi e diversi tra loro usando:
- torchvision.transforms (Compose/Random* ecc.) 
- API funzionale TF per controllo fine
- ColorJitter, GaussianBlur, RandomPerspective, adjust_*, autocontrast, equalize, invert, posterize

Autore: IMG Filters
"""

import argparse
import os
import torch
import torchvision.transforms.functional as TF
from PIL import Image
import torchvision.transforms as transforms
import numpy as np

# Parametri configurabili per ogni filtro
FILTER_PARAMS = {
    'bleach_bypass': {
        'saturation': 0.0,
        'contrast': 1.3,
        'sharpness': 1.2,
        'blend_mix': 0.6
    },
    'duotone': {
        'color1': [0.5, 0.0, 0.8],  # Viola
        'color2': [1.0, 0.6, 0.0]   # Arancione
    },
    'teal_orange_boost': {
        'contrast': 1.2,
        'saturation': 1.2,
        'hue_shift': 0.02,
        'gamma': 0.95
    },
    'posterize_pop': {
        'bits': 4
    },
    'dramatic_hdrish': {
        'sharpness': 1.8,
        'gamma': 0.9
    },
    'tiltshift': {
        'blur_kernel': 15,
        'blur_sigma': 3.0,
        'focus_height': 0.3,
        'feather': 0.2
    },
    'vignette_soft': {
        'radius': 0.8,
        'softness': 0.3,
        'darkness': 0.4
    },
    'glitch_perspective': {
        'distortion_scale': 0.3,
        'brightness_jitter': 0.1,
        'contrast_jitter': 0.1,
        'seed': 42
    },
    'invert_mono_grain': {
        'grain_intensity': 0.05,
        'grain_std': 0.1
    },
    'soft_pastel': {
        'saturation': 1.15,
        'blur_kernel': 5,
        'blur_sigma': 1.0,
        'gamma': 1.05
    }
}

def to_float(img_pil):
    """Converte PIL Image a tensor float [0,1]"""
    return transforms.ToTensor()(img_pil)

def to_pil(tensor_float):
    """Converte tensor float [0,1] a PIL Image"""
    return transforms.ToPILImage()(tensor_float)

def load_image(path):
    """Carica immagine e la converte a tensor float"""
    img = Image.open(path).convert('RGB')
    return to_float(img)

def apply_and_save(name, fn, tensor, out_dir):
    """Applica funzione filtro e salva risultato"""
    print(f"Applicando {name}...")
    
    # Applica filtro
    result = fn(tensor)
    
    # Converti a PIL e salva
    result_pil = to_pil(result)
    output_path = os.path.join(out_dir, f"{name}.jpg")
    result_pil.save(output_path, 'JPEG', quality=92, optimize=True)
    
    print(f"  Salvato: {output_path}")
    return output_path

# === FILTRI CREATIVI ===

def filter_bleach_bypass(x, params):
    """Effetto cinema: duplica, desatura, autocontrast, blend"""
    # Versione desaturata
    desaturated = TF.adjust_saturation(x, params['saturation'])
    desaturated = TF.autocontrast(desaturated)
    desaturated = TF.adjust_contrast(desaturated, params['contrast'])
    
    # Sharpness per micro-dettaglio
    sharpened = TF.adjust_sharpness(x, params['sharpness'])
    
    # Blend tra originale e desaturata
    result = torch.lerp(sharpened, desaturated, params['blend_mix'])
    return torch.clamp(result, 0, 1)

def filter_duotone(x, params):
    """Mappa scala grigi tra due colori"""
    # Converti a grayscale e equalizza
    gray = TF.adjust_saturation(x, 0.0)
    
    # Equalize richiede uint8, converti temporaneamente
    gray_uint8 = (gray * 255).to(torch.uint8)
    gray_uint8 = TF.equalize(gray_uint8)
    gray = gray_uint8.float() / 255.0
    
    # Normalizza a [0,1]
    gray = (gray - gray.min()) / (gray.max() - gray.min())
    
    # Crea mappa duotone
    color1 = torch.tensor(params['color1'], dtype=torch.float32).view(3, 1, 1)
    color2 = torch.tensor(params['color2'], dtype=torch.float32).view(3, 1, 1)
    
    # Interpolazione lineare tra i due colori
    result = gray * color1 + (1 - gray) * color2
    return torch.clamp(result, 0, 1)

def filter_teal_orange_boost(x, params):
    """Look blockbuster: contrast, saturation, hue, gamma"""
    result = TF.adjust_contrast(x, params['contrast'])
    result = TF.adjust_saturation(result, params['saturation'])
    result = TF.adjust_hue(result, params['hue_shift'])
    result = TF.adjust_gamma(result, params['gamma'])
    return torch.clamp(result, 0, 1)

def filter_posterize_pop(x, params):
    """Stile pop: autocontrast + posterize"""
    result = TF.autocontrast(x)
    
    # Converti temporaneamente a uint8 per posterize
    result_uint8 = (result * 255).to(torch.uint8)
    result_uint8 = TF.posterize(result_uint8, params['bits'])
    
    # Torna a float
    result = result_uint8.float() / 255.0
    return result

def filter_dramatic_hdrish(x, params):
    """Pseudo HDR single-shot"""
    result = TF.autocontrast(x)
    result = TF.adjust_sharpness(result, params['sharpness'])
    result = TF.adjust_gamma(result, params['gamma'])
    return torch.clamp(result, 0, 1)

def filter_tiltshift(x, params):
    """Miniatura: maschera verticale + blur"""
    h, w = x.shape[1], x.shape[2]
    
    # Crea maschera verticale (gradiente nitido→sfocato)
    mask = torch.zeros(h, w)
    focus_center = h // 2
    focus_height = int(h * params['focus_height'])
    feather = int(h * params['feather'])
    
    for y in range(h):
        dist_from_center = abs(y - focus_center)
        if dist_from_center <= focus_height // 2:
            mask[y, :] = 1.0  # Zona nitida
        else:
            # Gradiente sfocato
            blur_factor = min(1.0, (dist_from_center - focus_height // 2) / feather)
            mask[y, :] = 1.0 - blur_factor
    
    # Espandi maschera per canali RGB
    mask = mask.unsqueeze(0).expand(3, -1, -1)
    
    # Versione sfocata
    blurred = TF.gaussian_blur(x, params['blur_kernel'], params['blur_sigma'])
    
    # Blend tra nitido e sfocato
    result = x * mask + blurred * (1 - mask)
    return torch.clamp(result, 0, 1)

def filter_vignette_soft(x, params):
    """Vignettatura dolce con maschera radiale"""
    h, w = x.shape[1], x.shape[2]
    
    # Crea coordinate centrate
    y_coords = torch.arange(h, dtype=torch.float32) - h // 2
    x_coords = torch.arange(w, dtype=torch.float32) - w // 2
    Y, X = torch.meshgrid(y_coords, x_coords, indexing='ij')
    
    # Distanza dal centro
    distance = torch.sqrt(X.float()**2 + Y.float()**2)
    max_distance = torch.sqrt(torch.tensor((h//2)**2 + (w//2)**2, dtype=torch.float32))
    
    # Maschera radiale
    radius = params['radius'] * max_distance
    softness = params['softness'] * max_distance
    
    # Gradiente vignette
    vignette = torch.clamp((distance - radius) / softness, 0, 1)
    vignette = 1 - vignette * params['darkness']
    
    # Espandi per canali RGB
    vignette = vignette.unsqueeze(0).expand(3, -1, -1)
    
    # Applica vignette
    result = x * vignette
    return torch.clamp(result, 0, 1)

def filter_glitch_perspective(x, params):
    """Micro-distorsione prospettica + ColorJitter"""
    torch.manual_seed(params['seed'])
    
    h, w = x.shape[1], x.shape[2]
    
    # Punti di controllo per distorsione prospettica
    startpoints = torch.tensor([
        [0, 0], [w, 0], [w, h], [0, h]
    ], dtype=torch.float32)
    
    # Distorsione casuale
    distortion = (torch.rand(4, 2) - 0.5) * 2 * params['distortion_scale']
    endpoints = startpoints + distortion * torch.tensor([w, h])
    
    # Applica prospettiva
    result = TF.perspective(x, startpoints, endpoints, interpolation=TF.InterpolationMode.BILINEAR, fill=0.5)
    
    # ColorJitter leggero per look "analog"
    result = TF.adjust_brightness(result, 1.0 + (torch.rand(1).item() - 0.5) * 2 * params['brightness_jitter'])
    result = TF.adjust_contrast(result, 1.0 + (torch.rand(1).item() - 0.5) * 2 * params['contrast_jitter'])
    
    return torch.clamp(result, 0, 1)

def filter_invert_mono_grain(x, params):
    """Inverti, converti a mono, aggiungi grana"""
    # Inverti
    result = TF.invert(x)
    
    # Converti a mono
    result = TF.adjust_saturation(result, 0.0)
    
    # Aggiungi grana gaussiana
    noise = torch.randn_like(result) * params['grain_std']
    result = result + noise * params['grain_intensity']
    
    return torch.clamp(result, 0, 1)

def filter_soft_pastel(x, params):
    """Look pastello: equalize + saturation + blur + gamma"""
    # Equalize richiede uint8, converti temporaneamente
    x_uint8 = (x * 255).to(torch.uint8)
    result = TF.equalize(x_uint8)
    result = result.float() / 255.0
    
    result = TF.adjust_saturation(result, params['saturation'])
    result = TF.gaussian_blur(result, params['blur_kernel'], params['blur_sigma'])
    result = TF.adjust_gamma(result, params['gamma'])
    return torch.clamp(result, 0, 1)

def main():
    parser = argparse.ArgumentParser(description='Applica filtri creativi PyTorch alle immagini')
    parser.add_argument('--input', required=True, help='Percorso immagine di input')
    parser.add_argument('--out', required=True, help='Directory di output')
    
    args = parser.parse_args()
    
    # Crea directory output
    os.makedirs(args.out, exist_ok=True)
    
    print(f"🎨 Caricamento immagine: {args.input}")
    print(f"📁 Output directory: {args.out}")
    print(f"🔧 Parametri filtri: {FILTER_PARAMS}")
    print()
    
    # Carica immagine
    try:
        tensor = load_image(args.input)
        print(f"✅ Immagine caricata: {tensor.shape}")
    except Exception as e:
        print(f"❌ Errore caricamento immagine: {e}")
        return
    
    # Lista filtri da applicare
    filters = [
        ("01_bleach_bypass", filter_bleach_bypass),
        ("02_duotone", filter_duotone),
        ("03_teal_orange_boost", filter_teal_orange_boost),
        ("04_posterize_pop", filter_posterize_pop),
        ("05_dramatic_hdrish", filter_dramatic_hdrish),
        ("06_tiltshift", filter_tiltshift),
        ("07_vignette_soft", filter_vignette_soft),
        ("08_glitch_perspective", filter_glitch_perspective),
        ("09_invert_mono_grain", filter_invert_mono_grain),
        ("10_soft_pastel", filter_soft_pastel)
    ]
    
    # Applica tutti i filtri
    print("\n🚀 Applicazione filtri creativi...")
    print("=" * 50)
    
    for name, filter_fn in filters:
        try:
            filter_name = name.split('_', 1)[1]  # Rimuovi prefisso numerico
            params = FILTER_PARAMS[filter_name]
            output_path = apply_and_save(name, lambda x: filter_fn(x, params), tensor, args.out)
        except Exception as e:
            print(f"❌ Errore filtro {name}: {e}")
    
    print("\n🎉 Completato! Tutti i filtri sono stati applicati e salvati.")
    print(f"📂 Controlla la directory: {args.out}")

if __name__ == "__main__":
    main()
