# NURU — Dashboard Programmatique Multi-Canal

Dashboard interactif de suivi et d'analyse de campagnes publicitaires programmatiques multi-canal (Display, Native, Video, CTV, Audio, In-Game).

## Fonctionnalités

- **Vue d'ensemble** — KPIs globaux (impressions, dépenses, clics, CTR, CPM, CPC, viewability, conversions, VCR, LTR) avec graphiques temporels
- **Par format** — Analyse détaillée par canal et sous-format (tailles IAB, quartiles vidéo, répartition devices)
- **Par axe créatif** — Performance comparée des axes de communication (jusqu'à 5 axes)
- **Analyse ROI** — Évolution CPM/CTR, CPA par canal, répartition des dépenses
- **Visibilité** — Viewability, VCR, LTR, impressions visibles vs totales
- **Sites** — Performance par site éditeur (CPM, CTR, CPA)
- **Données brutes** — Table complète avec tri et filtres
- **Import CSV** — Chargement de données réelles via fichier CSV/TSV
- **Données de démo** — Jeu de données généré automatiquement pour tester le dashboard
- **Lexique** — Glossaire interactif des termes programmatiques
- **Filtres avancés** — Par date, canal, sous-format, device, site, granularité temporelle

## Stack technique

- **React 18** — UI composants
- **Recharts** — Graphiques (BarChart, PieChart, AreaChart, RadarChart, ComposedChart)
- **PapaParse** — Parsing CSV/TSV
- **Vite** — Build et dev server

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'app est accessible sur `http://localhost:5173`.

## Build production

```bash
npm run build
```

Les fichiers statiques sont générés dans le dossier `dist/`.

## Déploiement

L'app est une SPA statique déployable sur tout hébergement web (Apache, Nginx, mutualisé OVH, etc.).

Le fichier `public/.htaccess` gère le routing SPA, la compression gzip et le cache navigateur pour les serveurs Apache.

**URL de production** : [ads.nuru.agency](https://ads.nuru.agency)

## Licence

Propriétaire — NURU Agency
