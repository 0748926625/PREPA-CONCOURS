# Prépa Concours

PWA de révision par QCM générés par IA à partir de vos ressources (PDF, texte, cours).

Application 100% locale : aucune donnée n'est envoyée à un serveur applicatif. Les ressources, questions,
résultats et suivi de progression sont stockés dans le navigateur (IndexedDB). Les appels de génération de
QCM sont faits directement depuis le navigateur vers le fournisseur IA choisi, avec une clé API que vous
fournissez vous-même dans Réglages (stockée en local uniquement).

## Stack

React + TypeScript + Vite + Tailwind CSS + React Router + IndexedDB (Dexie), déployée sur GitHub Pages.

## Développement

```bash
npm install
npm run dev
```

## Déploiement

Le push sur `main` déclenche `.github/workflows/deploy.yml`, qui build et publie sur GitHub Pages.
