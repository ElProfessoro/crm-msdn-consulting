# CRM MSDN Consulting

CRM MVP serverless 100% Cloudflare (gratuit) pour petites équipes commerciales.

## Architecture

- **Frontend**: Cloudflare Pages (HTML/CSS/JS vanilla)
- **Backend**: Cloudflare Workers (API TypeScript + Hono)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (imports CSV)
- **Cron**: Cloudflare Cron Triggers (alertes automatiques)

## Fonctionnalités

### Collaborateur
- Authentification sécurisée
- Gestion de ses leads (CRUD)
- Import CSV/Excel
- Création et suivi de tâches
- Rappels et échéances
- Historique d'activités

### Administrateur
- Accès global à tous les leads
- Suivi de l'activité de l'équipe
- Vue globale des tâches par collaborateur

### Système de tâches
- Création de tâches liées ou non à un lead
- Statuts: À faire / En cours / Terminé
- Priorités: Basse / Normale / Haute
- Alertes automatiques (échéance proche ou dépassée)

## Installation

### Prérequis

1. Compte Cloudflare (gratuit)
2. Node.js 18+ et npm
3. Wrangler CLI installé globalement:

```bash
npm install -g wrangler
```

4. Authentification Cloudflare:

```bash
wrangler login
```

### Étape 1: Créer la base de données D1

```bash
# Créer la base de données
wrangler d1 create crm-database

# Copier le database_id retourné et le mettre dans:
# - workers/api/wrangler.toml
# - workers/cron/wrangler.toml
```

### Étape 2: Appliquer le schéma SQL

```bash
# Appliquer le schéma initial
wrangler d1 execute crm-database --file=schema/001_initial_schema.sql

# Insérer les données de test (optionnel)
wrangler d1 execute crm-database --file=schema/002_seed_data.sql
```

### Étape 3: Créer le bucket R2

```bash
wrangler r2 bucket create crm-imports
```

### Étape 4: Configurer les secrets

```bash
cd workers/api

# Générer et définir un secret JWT
wrangler secret put JWT_SECRET
# Saisir une chaîne aléatoire longue (ex: openssl rand -base64 32)
```

### Étape 5: Déployer l'API Worker

```bash
cd workers/api
npm install
wrangler deploy
```

### Étape 6: Déployer le Cron Worker

```bash
cd workers/cron
npm install
wrangler deploy
```

### Étape 7: Déployer le frontend (Pages)

```bash
cd frontend
npx wrangler pages deploy . --project-name=crm-frontend
```

### Étape 8: Configurer l'URL de l'API

Après le déploiement de l'API Worker, vous obtiendrez une URL (ex: `https://crm-api.your-subdomain.workers.dev`).

Mettre à jour cette URL dans:
```javascript
// frontend/src/lib/api.js
const API_BASE_URL = 'https://crm-api.your-subdomain.workers.dev';
```

Puis redéployer le frontend:
```bash
cd frontend
npx wrangler pages deploy . --project-name=crm-frontend
```

## Développement local

### API Worker

```bash
cd workers/api
npm run dev
# API disponible sur http://localhost:8787
```

### Cron Worker (test manuel)

```bash
cd workers/cron
npm run dev

# Déclencher le cron manuellement:
curl -X POST http://localhost:8787/trigger
```

### Frontend

Servir le frontend avec un serveur local:

```bash
cd frontend
npx serve .
# ou
python3 -m http.server 8080
```

## Comptes de test

Après avoir exécuté `002_seed_data.sql`, vous aurez ces comptes:

- **Admin**: `admin@msdn-consulting.fr` / `password123`
- **Collaborateur**: `alex.martin@msdn-consulting.fr` / `password123`
- **Collaborateur**: `alexandre.v@msdn-consulting.fr` / `password123`

⚠️ **Important**: Changez ces mots de passe en production !

## Structure du projet

```
crm-msdn/
├── frontend/              # Cloudflare Pages
│   ├── login.html
│   ├── dashboard.html
│   ├── leads.html
│   ├── lead.html
│   ├── import.html
│   └── src/
│       ├── components/
│       ├── lib/
│       └── styles/
│
├── workers/
│   ├── api/              # API Worker
│   │   └── src/
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── index.ts
│   │
│   └── cron/             # Cron Worker
│       └── src/
│           └── index.ts
│
└── schema/               # Schémas D1
    ├── 001_initial_schema.sql
    └── 002_seed_data.sql
```

## Gestion de la base de données

### Exécuter des requêtes SQL

```bash
# Mode interactif
wrangler d1 execute crm-database --command="SELECT * FROM users"

# Depuis un fichier
wrangler d1 execute crm-database --file=mon_script.sql
```

### Backup de la base de données

```bash
wrangler d1 backup create crm-database
wrangler d1 backup list crm-database
```

## Coûts (Plan gratuit Cloudflare)

- **Workers**: 100,000 requêtes/jour (gratuit)
- **D1**: 5 GB stockage + 5M lectures/jour (gratuit)
- **R2**: 10 GB stockage (gratuit)
- **Pages**: Déploiements illimités (gratuit)
- **Cron Triggers**: Inclus dans Workers (gratuit)

✅ **Ce projet reste 100% gratuit pour <10 utilisateurs et trafic modéré.**

## Améliorations futures

- [ ] Envoi d'emails via Mailchannels
- [ ] Notifications push dans l'UI
- [ ] Tableau de bord admin avancé
- [ ] Export de rapports
- [ ] API webhooks
- [ ] Support multilingue
- [ ] Mode sombre
- [ ] Application mobile (PWA)

## Support

Pour toute question ou problème, ouvrez une issue sur le repo GitHub.

## Licence

MIT
