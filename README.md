IMG Filters Demo (locale)
=================================

Prova in locale 10 filtri selezionati automaticamente. Nessuna immagine viene caricata su server.

Avvio rapido
------------
- Avvia server: `python3 -m http.server 5173`
- Apri `http://localhost:5173`

Aggiornare i filtri (settimanale)
---------------------------------
- `npm i`
- `npm run update:filters`

Automazione inclusa con GitHub Actions: `.github/workflows/update-filters.yml`.

Schema filters.json
-------------------
Consulta il pannello “Schema e automazione” nella pagina o `scripts/update-filters.mjs`.

Licenze
-------
Preset ispirati a Filterous2, pilgram e pattern OpenCV. Elaborazione 100% nel browser.
