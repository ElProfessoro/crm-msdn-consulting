# 🔐 Accès CRM - Youssef Msalla

## ✅ Compte Administrateur Créé avec Succès

Votre compte administrateur a été créé dans la base de données de production le **03/01/2026 à 17:40:48**.

### Identifiants de Connexion

- **Email**: `msalla.youssef@gmail.com`
- **Mot de passe**: `Rsk0405$?G6677`
- **Rôle**: `admin` (Administrateur)
- **ID Utilisateur**: `4`

---

## 🌐 URLs d'Accès

Pour accéder au CRM, vous devez d'abord vérifier que l'API et le frontend sont déployés.

### Vérifier le déploiement de l'API

```bash
cd workers/api
npx wrangler deployments list
```

Cela vous donnera l'URL de l'API, par exemple:
```
https://crm-api.YOUR-SUBDOMAIN.workers.dev
```

### Vérifier le déploiement du Frontend

Le frontend est déployé sur Cloudflare Pages. Pour obtenir l'URL:

```bash
cd frontend
npx wrangler pages deployments list
```

Ou vérifiez directement sur le dashboard Cloudflare:
1. Allez sur https://dash.cloudflare.com
2. Naviguez vers **Workers & Pages**
3. Cherchez votre projet Pages
4. L'URL sera quelque chose comme: `https://crm-frontend.pages.dev`

---

## 🚀 Si le CRM n'est pas encore déployé

Si le CRM n'est pas encore déployé, suivez ces étapes:

### 1. Configurer le secret JWT

```bash
cd workers/api
npx wrangler secret put JWT_SECRET
```

Quand demandé, entrez une clé secrète longue et aléatoire (ex: générez-la avec):
```bash
openssl rand -base64 32
```

### 2. Déployer l'API

```bash
cd workers/api
npm install
npx wrangler deploy
```

Notez l'URL retournée (ex: `https://crm-api.YOUR-SUBDOMAIN.workers.dev`)

### 3. Mettre à jour l'URL de l'API dans le Frontend

Éditez le fichier [frontend/src/lib/api.js](frontend/src/lib/api.js) et remplacez l'URL par celle de votre API:

```javascript
const API_BASE_URL = 'https://crm-api.YOUR-SUBDOMAIN.workers.dev';
```

### 4. Déployer le Frontend

```bash
cd frontend
npx wrangler pages deploy . --project-name=crm-msdn-consulting
```

### 5. Créer le bucket R2 (pour les imports CSV)

```bash
npx wrangler r2 bucket create crm-imports
```

Puis décommentez la section R2 dans [workers/api/wrangler.toml](workers/api/wrangler.toml):

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "crm-imports"
```

Et redéployez l'API:
```bash
cd workers/api
npx wrangler deploy
```

---

## 🔑 Se Connecter au CRM

1. Ouvrez l'URL de votre frontend (ex: `https://crm-msdn-consulting.pages.dev`)
2. Vous serez redirigé vers la page de connexion ([login.html](frontend/login.html))
3. Entrez vos identifiants:
   - **Email**: `msalla.youssef@gmail.com`
   - **Mot de passe**: `Rsk0405$?G6677`
4. Cliquez sur **"Se connecter"**
5. Vous serez redirigé vers le dashboard administrateur

---

## 👨‍💼 Droits d'Administrateur

En tant qu'administrateur, vous avez accès à:

- ✅ **Tous les leads** de tous les collaborateurs
- ✅ **Toutes les tâches** de tous les collaborateurs
- ✅ **Statistiques globales** de l'équipe
- ✅ **Gestion des utilisateurs** (création, modification)
- ✅ **Import/Export de données** CSV
- ✅ **Historique d'activités** de toute l'équipe
- ✅ **Configuration système**

---

## 📊 Structure du CRM

Le CRM dispose de:

### Pages principales
- **Dashboard** ([dashboard.html](frontend/dashboard.html)) - Vue d'ensemble et statistiques
- **Liste des Leads** ([leads.html](frontend/leads.html)) - Tous vos prospects et clients
- **Fiche Lead** ([lead.html](frontend/lead.html)) - Détails d'un lead spécifique
- **Import CSV** ([import.html](frontend/import.html)) - Import de leads par fichier

### Fonctionnalités
- Gestion complète des leads (CRUD)
- Système de tâches avec échéances et priorités
- Historique d'activités automatique
- Alertes et notifications automatiques (toutes les 15 min)
- Import CSV/Excel
- Filtrage et recherche avancés
- Tags personnalisables

---

## 🛠 Autres Comptes de Test

Des comptes de test existent déjà dans la base de données:

| Email | Mot de passe | Rôle | Nom |
|-------|--------------|------|-----|
| `admin@msdn-consulting.fr` | `password123` | admin | Thomas Dubois |
| `alex.martin@msdn-consulting.fr` | `password123` | collaborateur | Alex Martin |
| `alexandre.v@msdn-consulting.fr` | `password123` | collaborateur | Alexandre Valentin |
| `msalla.youssef@gmail.com` | `Rsk0405$?G6677` | admin | Youssef Msalla |

⚠️ **Recommandation**: Changez les mots de passe des comptes de test ou supprimez-les en production.

---

## 🔒 Sécurité

### Recommandations
1. ✅ **Changez votre mot de passe** après la première connexion
2. ✅ **Supprimez les comptes de test** avant la mise en production
3. ✅ **Utilisez des mots de passe forts** pour tous les comptes
4. ✅ **Activez 2FA** sur votre compte Cloudflare
5. ✅ **Ne partagez jamais** vos identifiants

### Hash du mot de passe
Votre mot de passe est stocké avec un hash SHA-256:
```
$sha256$d1e10a401f1a0e3069936061e56aa62bfa3b4cb5295a8efd87c80e9d8f8aed40
```

---

## 📝 Fichiers Créés

J'ai créé les fichiers suivants pour vous:

1. [ADMIN_ACCESS.md](ADMIN_ACCESS.md) - Guide complet pour la création d'utilisateurs admin
2. [schema/003_add_admin_youssef.sql](schema/003_add_admin_youssef.sql) - Script SQL pour votre compte
3. [create-admin.js](create-admin.js) - Script pour générer les hashs de mots de passe
4. **CREDENTIALS.md** (ce fichier) - Récapitulatif de vos accès

---

## 🆘 Support

### Logs en temps réel
```bash
# API Worker
npx wrangler tail crm-api

# Cron Worker (alertes)
npx wrangler tail crm-cron
```

### Base de données
```bash
# Vérifier votre compte
npx wrangler d1 execute crm-database --remote --command="SELECT * FROM users WHERE email = 'msalla.youssef@gmail.com';"

# Voir tous les utilisateurs
npx wrangler d1 execute crm-database --remote --command="SELECT id, email, first_name, last_name, role FROM users;"

# Voir tous les leads
npx wrangler d1 execute crm-database --remote --command="SELECT id, full_name, company, status FROM leads LIMIT 10;"
```

### En cas de problème

1. **Impossible de se connecter**
   - Vérifiez que l'API est déployée: `cd workers/api && npx wrangler deployments list`
   - Vérifiez que le JWT_SECRET est configuré: `cd workers/api && npx wrangler secret list`
   - Consultez les logs: `npx wrangler tail crm-api`

2. **Erreur CORS**
   - Vérifiez que l'URL de l'API dans `frontend/src/lib/api.js` est correcte
   - Redéployez le frontend après modification

3. **Mot de passe incorrect**
   - Le hash du mot de passe doit être exactement: `$sha256$d1e10a401f1a0e3069936061e56aa62bfa3b4cb5295a8efd87c80e9d8f8aed40`
   - Régénérez-le avec: `node create-admin.js`

---

**Date de création**: 03/01/2026
**Base de données**: crm-database (07a87dfe-4364-46c3-baa6-b2860e440f3d)
**Environnement**: Production (remote)
