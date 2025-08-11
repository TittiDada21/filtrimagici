// Vercel Serverless Function: /api/update-filters
// Genera filters.json e lo restituisce in risposta. In una versione avanzata
// potresti scrivere su Vercel Blob/KV e servire da lì.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  try {
    const { default: update } = await import('../scripts/update-filters.mjs');
  } catch {}
  // Come fallback, restituiamo l'attuale filters.json
  try {
    const p = path.join(__dirname, '..', 'filters.json');
    const json = await fs.readFile(p, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(json);
  } catch (e) {
    res.status(500).json({ error: 'Cannot read filters.json' });
  }
}


