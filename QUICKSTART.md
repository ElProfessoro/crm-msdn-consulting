# 🚀 Guide de démarrage rapide

Guide pour déployer le CRM en moins de 10 minutes.

## 1️⃣ Prérequis (5 min)

```bash
# Installer Node.js 18+ (si pas déjà fait)
# https://nodejs.org/

# Installer Wrangler
npm install -g wrangler

# Se connecter à Cloudflare
wrangler login
```

## 2️⃣ Configuration de la base de données (2 min)

```bash
# Créer la base D1
wrangler d1 create crm-database
```

Copier le `database_id` retourné et remplacer `YOUR_D1_DATABASE_ID` dans :
- `workers/api/wrangler.toml`
- `workers/cron/wrangler.toml`

```bash
# Appliquer le schéma SQL
npm run db:init

# Insérer les données de test
npm run db:seed
```

## 3️⃣ Configuration du stockage (1 min)

```bash
# Créer le bucket R2 pour les imports
wrangler r2 bucket create crm-imports
```

## 4️⃣ Configuration des secrets (1 min)

```bash
cd workers/api

# Générer un secret JWT (exemple)
echo "my-super-secret-jwt-key-$(openssl rand -hex 16)"

# Le définir
wrangler secret put JWT_SECRET
# Coller la valeur générée ci-dessus
```

## 5️⃣ Déploiement (3 min)

```bash
# Retour à la racine
cd ../..

# Installer les dépendances
npm run setup

# Déployer tout
npm run deploy
# Ou manuellement :
npm run deploy:api
npm run deploy:cron
npm run deploy:frontend
```

## 6️⃣ Configuration finale (2 min)

Après le déploiement de l'API, vous obtiendrez une URL comme :
```
https://crm-api.your-name.workers.dev
```

**Mettre à jour l'URL dans le frontend** :

Éditer `frontend/src/lib/api.js` :
```javascript
const API_BASE_URL = 'https://crm-api.your-name.workers.dev';
```

**Redéployer le frontend** :
```bash
npm run deploy:frontend
```

## 7️⃣ Tester l'application

Votre CRM est maintenant accessible à l'URL Pages :
```
https://crm-frontend.pages.dev
```

**Comptes de test** :
- Admin : `admin@msdn-consulting.fr` / `password123`
- Collaborateur : `alex.martin@msdn-consulting.fr` / `password123`

## 🔧 Commandes utiles

### Développement local

```bash
# API Worker (port 8787)
npm run dev:api

# Cron Worker
npm run dev:cron

# Frontend (port 3000)
npm run dev:frontend
```

### Base de données

```bash
# Exécuter une requête SQL
npm run db:query -- --command="SELECT * FROM users"

# Créer un backup
wrangler d1 backup create crm-database

# Lister les backups
wrangler d1 backup list crm-database
```

### Logs en temps réel

```bash
# Logs de l'API
wrangler tail crm-api

# Logs du Cron
wrangler tail crm-cron
```

## 🎯 Prochaines étapes

1. **Changez les mots de passe** des comptes de test
2. **Créez vos propres utilisateurs** via l'endpoint `/auth/register`
3. **Configurez un domaine personnalisé** dans Cloudflare Pages
4. **Testez l'import CSV** avec le template fourni
5. **Explorez les fonctionnalités** de gestion de leads et tâches

## ⚠️ Important

- Les données de `002_seed_data.sql` sont **pour le développement uniquement**
- En production, créez vos utilisateurs via l'API
- Utilisez des mots de passe forts
- Activez 2FA sur votre compte Cloudflare

## 🆘 Problèmes courants

### "Database not found"
→ Vérifiez que le `database_id` dans `wrangler.toml` est correct

### "JWT_SECRET not configured"
→ Exécutez `wrangler secret put JWT_SECRET` dans `workers/api/`

### "R2 bucket not found"
→ Créez le bucket avec `wrangler r2 bucket create crm-imports`

### Erreur CORS
→ Vérifiez que l'URL de l'API dans `frontend/src/lib/api.js` est correcte

## 📚 Documentation complète

Consultez [README.md](./README.md) pour la documentation détaillée.

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub.
