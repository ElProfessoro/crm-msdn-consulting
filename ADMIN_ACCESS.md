# Accès Administrateur CRM

## Compte Administrateur Créé

### Informations de connexion
- **Email**: `msalla.youssef@gmail.com`
- **Mot de passe**: `Rsk0405$?G6677`
- **Rôle**: Administrateur
- **Nom**: Youssef Msalla

## Méthodes pour ajouter l'utilisateur

### Option 1: Via Wrangler (Recommandée)

Pour ajouter l'utilisateur directement dans la base de données D1 en production:

```bash
# En local (développement)
npx wrangler d1 execute crm-database --local --file=schema/003_add_admin_youssef.sql

# En production (après déploiement)
npx wrangler d1 execute crm-database --remote --file=schema/003_add_admin_youssef.sql
```

Ou en une seule commande:

```bash
# Local
npx wrangler d1 execute crm-database --local --command="INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ('msalla.youssef@gmail.com', '\$sha256\$d1e10a401f1a0e3069936061e56aa62bfa3b4cb5295a8efd87c80e9d8f8aed40', 'Youssef', 'Msalla', 'admin');"

# Production
npx wrangler d1 execute crm-database --remote --command="INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ('msalla.youssef@gmail.com', '\$sha256\$d1e10a401f1a0e3069936061e56aa62bfa3b4cb5295a8efd87c80e9d8f8aed40', 'Youssef', 'Msalla', 'admin');"
```

### Option 2: Via l'API /auth/register

Si l'API est déjà déployée, vous pouvez utiliser l'endpoint de registre:

```bash
curl -X POST https://VOTRE_API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "msalla.youssef@gmail.com",
    "password": "Rsk0405$?G6677",
    "first_name": "Youssef",
    "last_name": "Msalla",
    "role": "admin"
  }'
```

### Option 3: Via Cloudflare Dashboard

1. Allez sur le Dashboard Cloudflare
2. Naviguez vers **Workers & Pages** > **D1**
3. Sélectionnez la base de données `crm-database`
4. Cliquez sur **Console**
5. Exécutez la requête SQL suivante:

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'msalla.youssef@gmail.com',
  '$sha256$d1e10a401f1a0e3069936061e56aa62bfa3b4cb5295a8efd87c80e9d8f8aed40',
  'Youssef',
  'Msalla',
  'admin'
);
```

## Vérification

Après avoir ajouté l'utilisateur, vérifiez que tout fonctionne:

```bash
# Vérifier que l'utilisateur existe
npx wrangler d1 execute crm-database --local --command="SELECT id, email, first_name, last_name, role FROM users WHERE email = 'msalla.youssef@gmail.com';"
```

## Connexion au CRM

Une fois l'utilisateur créé:

1. Ouvrez l'URL de votre frontend (ex: `https://votre-crm.pages.dev`)
2. Allez sur la page de connexion ([login.html](frontend/login.html))
3. Entrez les identifiants:
   - Email: `msalla.youssef@gmail.com`
   - Mot de passe: `Rsk0405$?G6677`
4. Cliquez sur "Se connecter"

## Droits Administrateur

En tant qu'administrateur, vous avez accès à:
- ✅ Tous les leads (de tous les collaborateurs)
- ✅ Toutes les tâches
- ✅ Statistiques globales
- ✅ Gestion des utilisateurs
- ✅ Import/Export de données
- ✅ Configuration du système

## Sécurité

⚠️ **Important**:
- Changez le mot de passe après la première connexion
- Ne partagez jamais vos identifiants
- Activez l'authentification à deux facteurs si disponible
- Le hash SHA-256 du mot de passe: `d1e10a401f1a0e3069936061e56aa62bfa3b4cb5295a8efd87c80e9d8f8aed40`

## Structure des Rôles

Le CRM supporte deux rôles:

| Rôle | Accès |
|------|-------|
| **admin** | Accès complet à tout le système, tous les leads et utilisateurs |
| **collaborateur** | Accès limité à ses propres leads et tâches |

## Dépannage

### L'utilisateur existe déjà
Si vous obtenez une erreur "email déjà utilisé", supprimez d'abord l'utilisateur:

```bash
npx wrangler d1 execute crm-database --local --command="DELETE FROM users WHERE email = 'msalla.youssef@gmail.com';"
```

Puis réexécutez la commande d'insertion.

### Mot de passe incorrect
Si le mot de passe ne fonctionne pas, vérifiez que le hash est correct:

```bash
node create-admin.js
```

---

**Fichiers créés**:
- [schema/003_add_admin_youssef.sql](schema/003_add_admin_youssef.sql) - Script SQL pour ajouter l'admin
- [create-admin.js](create-admin.js) - Script Node.js pour générer le hash
