Ik heb een startproject voor een Running Coach PWA (progressive web app) met Strava-integratie.
Help me dit afbouwen en klaarmaken om te deployen.

CONTEXT:
- Backend: Node/Express + SQLite, regelt Strava OAuth (authorize → callback → token
  refresh) en synct activiteiten + per-km splits van Strava naar een lokale database.
- Frontend: Vite + React PWA (manifest.json + service worker aanwezig voor
  installeerbaarheid), praat met de backend via /api/runs en /api/sync.
- Er is een los ontworpen dashboard-component (running-coach-dashboard.jsx) met een
  track/scoreboard-visuele stijl: split-ladder grafiek per run, countdown naar twee
  doeldata (1 sept football-doel, 20 sept 16K-doel), fitness-kaarten (easy/tempo/
  interval pace + 5K/10K/halve marathon-schattingen via Riegel-formule), en een
  pace-trendgrafiek. Dit component gebruikt nu window.storage (voor gebruik als
  Claude-artifact) — dat moet vervangen worden door de echte API-calls naar de backend.

TAKEN:
1. Zet het project op (ik geef je de bestanden), installeer dependencies, en check of
   backend en frontend allebei draaien.
2. Vervang de placeholder-UI in frontend/src/App.jsx door de volledige dashboard-UI uit
   running-coach-dashboard.jsx, aangesloten op de echte /api/runs data in plaats van
   window.storage.
3. Voeg PWA-iconen toe (192x192 en 512x512 png, simpel logo/monogram is prima) in
   frontend/public/icons/.
4. Verbeter de auto-classificatie van run-type (Long/Tempo/Interval) in
   backend/src/server.js — nu is het een grove pace/afstand-heuristiek; maak het
   slimmer met een rolling gemiddelde van eerdere runs.
5. Help me kiezen tussen lokaal draaien vs. deployen (bv. Vercel voor frontend +
   Railway/Render voor backend, of alles op één Node-server). Leg de afwegingen kort
   uit en implementeer de gekozen route.
6. Zorg dat de Strava OAuth-callback-URL en environment variables correct
   geconfigureerd staan voor de gekozen hosting-setup.
7. Test de volledige flow einde-tot-einde: Strava verbinden → runs synchroniseren →
   dashboard toont data → PWA is installeerbaar op een telefoon.

Vraag het me als iets niet duidelijk is — vooral rond hosting-voorkeur en of ik een
domeinnaam beschikbaar heb.
