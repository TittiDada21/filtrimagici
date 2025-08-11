# 🎨 Filtri Immagine Avanzati con PyTorch

Script Python che applica **10 filtri creativi e diversi tra loro** usando PyTorch e TorchVision.

## 🚀 Installazione

```bash
pip install -r requirements.txt
```

## 📖 Utilizzo

```bash
python filters.py --input path/alla/foto.jpg --out output_directory
```

## 🎯 I 10 Filtri Creativi

### 1. **BleachBypass** - Effetto Cinema
- Duplica l'immagine, crea versione desaturata
- Applica autocontrast e contrast elevato
- Blend tra originale e desaturata (mix 0.6)
- Sharpness per micro-dettaglio

### 2. **Duotone** - Mappa Colori
- Converte a scala grigi e equalizza
- Mappa tra due colori (viola → arancione)
- Interpolazione lineare RGB

### 3. **TealOrangeBoost** - Look Blockbuster
- Contrast 1.2x, saturation 1.2x
- Hue shift +0.02, gamma 0.95
- Stile cinematografico professionale

### 4. **PosterizePop** - Stile Pop
- Autocontrast per mordente
- Posterizzazione a 4 bits
- Conversione temporanea uint8 → float

### 5. **DramaticHDRish** - Pseudo HDR
- Autocontrast intelligente
- Sharpness 1.8x per dettagli
- Gamma 0.9 per profondità

### 6. **TiltShift** - Miniatura
- Maschera verticale nitido→sfocato
- Gaussian blur con kernel 15, sigma 3.0
- Focus height 30%, feather 20%

### 7. **VignetteSoft** - Vignettatura Dolce
- Maschera radiale personalizzabile
- Radius 80%, softness 30%
- Darkness 40% per bordi scuri

### 8. **GlitchPerspective** - Micro-Distorsione
- Distorsione prospettica casuale
- ColorJitter per look "analog"
- Seed deterministico per riproducibilità

### 9. **InvertMonoGrain** - Inversione + Grana
- Inversione colori completa
- Conversione a monocromatico
- Grana gaussiana personalizzabile

### 10. **SoftPastel** - Look Pastello
- Equalizzazione per bilanciamento
- Saturation boost 1.15x
- Gaussian blur leggero + gamma 1.05

## 🔧 Parametri Configurabili

Tutti i parametri sono modificabili nel dizionario `FILTER_PARAMS` all'inizio del file:

```python
FILTER_PARAMS = {
    'bleach_bypass': {
        'saturation': 0.0,      # 0 = desaturato
        'contrast': 1.3,        # >1 = più contrasto
        'sharpness': 1.2,       # >1 = più nitido
        'blend_mix': 0.6        # 0-1 = mix originale/desaturato
    },
    # ... altri filtri
}
```

## 📁 Output

Lo script genera 10 file JPEG nella directory di output:
- `01_bleach_bypass.jpg`
- `02_duotone.jpg`
- `03_teal_orange_boost.jpg`
- `04_posterize_pop.jpg`
- `05_dramatic_hdrish.jpg`
- `06_tiltshift.jpg`
- `07_vignette_soft.jpg`
- `08_glitch_perspective.jpg`
- `09_invert_mono_grain.jpg`
- `10_soft_pastel.jpg`

## 🎨 Tecnologie Utilizzate

- **PyTorch**: Framework di deep learning
- **TorchVision**: Trasformazioni immagine professionali
- **PIL/Pillow**: Elaborazione immagini
- **API Funzionale**: Controllo fine dei parametri

## 🔍 Esempio di Output Console

```
🎨 Caricamento immagine: foto.jpg
📁 Output directory: output/
🔧 Parametri filtri: {...}

✅ Immagine caricata: torch.Size([3, 1080, 1920])

🚀 Applicazione filtri creativi...
==================================================
Applicando 01_bleach_bypass...
  Salvato: output/01_bleach_bypass.jpg
Applicando 02_duotone...
  Salvato: output/02_duotone.jpg
...

🎉 Completato! Tutti i filtri sono stati applicati e salvati.
📂 Controlla la directory: output/
```

## 🚀 Vantaggi

- **Qualità Professionale**: Algoritmi PyTorch di livello enterprise
- **Parametri Configurabili**: Facile personalizzazione
- **Performance**: Lavora sempre in tensor, nessuna copia PIL intermedia
- **Riproducibilità**: Seed deterministico per risultati consistenti
- **Formato Output**: JPEG qualità 92, profilo sRGB

## 🔧 Personalizzazione

Per modificare i filtri:
1. Aggiusta i parametri in `FILTER_PARAMS`
2. Modifica le funzioni filtro individuali
3. Aggiungi nuovi filtri seguendo il pattern esistente

## 📚 Documentazione PyTorch

- [TorchVision Transforms](https://pytorch.org/vision/stable/transforms.html)
- [Functional Transforms](https://pytorch.org/vision/stable/transforms.html#functional-transforms)
- [PyTorch Documentation](https://pytorch.org/docs/)
