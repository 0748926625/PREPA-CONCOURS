# Prépa Concours

PWA de révision par QCM générés par IA à partir de vos ressources (PDF, texte, cours).

## Stack

React + TypeScript + Vite + Tailwind CSS + React Router + Supabase, déployée sur GitHub Pages.

## Développement

```bash
npm install
cp .env.example .env   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

## Déploiement

Le push sur `main` déclenche `.github/workflows/deploy.yml`, qui build et publie sur GitHub Pages.
Les secrets `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` doivent être configurés dans
Settings → Secrets and variables → Actions du dépôt GitHub.
