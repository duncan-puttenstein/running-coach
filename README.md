# Running Coach PWA — Setup

## 1. Registreer een Strava API-app
1. Ga naar https://www.strava.com/settings/api
2. Maak een nieuwe app aan. "Authorization Callback Domain" = `localhost` (voor lokaal testen)
3. Kopieer je **Client ID** en **Client Secret**

## 2. Backend opzetten
```bash
cd backend
cp .env.example .env
# vul STRAVA_CLIENT_ID en STRAVA_CLIENT_SECRET in .env in
npm install
npm run dev
```
Draait op http://localhost:3001

## 3. Frontend opzetten
```bash
cd frontend
npm install
npm run dev
```
Draait op http://localhost:5173

## 4. Verbinden
Open de frontend, klik "Verbind met Strava", log in en autoriseer. Je wordt teruggestuurd en de app synchroniseert automatisch je runs.

## 5. Installeren als PWA
- **Op je telefoon:** open de site in Chrome/Safari → "Toevoegen aan startscherm"
- **Icons:** voeg zelf `icon-192.png` en `icon-512.png` toe in `frontend/public/icons/` (nu nog placeholders nodig)

## Nog te doen (zie TODO in App.jsx)
Het volledige dashboard-ontwerp (split ladder, countdown-lanes, fitness-cards, trendgrafiek) staat al af in `running-coach-dashboard.jsx` uit de Claude-chat — dat moet nog verbonden worden met de `/api/runs` data hier in plaats van de lokale storage die het nu gebruikt.

## Voor productie
- Vervang SQLite door iets dat overleeft op je hostingplatform (bv. Supabase/Postgres) als je serverless deployt (Vercel functions hebben geen persistent filesystem)
- Zet `.env` waarden als environment variables in je hostingplatform, nooit in git
- Update de Strava "Authorization Callback Domain" naar je echte domein zodra je live gaat
