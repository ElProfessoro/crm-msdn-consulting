# Guide: Ajout de l'utilisateur Cédric Refray

## Résumé de l'analyse du projet

### Architecture CRM MSDN Consulting
- **Type**: CRM serverless 100% Cloudflare
- **Frontend**: Cloudflare Pages (HTML/CSS/JS vanilla)
- **Backend**: Cloudflare Workers (TypeScript + Hono framework)
- **Base de données**: Cloudflare D1 (SQLite)
- **Stockage**: Cloudflare R2 (imports CSV)
- **Cron**: Cloudflare Cron Triggers (alertes automatiques)

### Fonctionnalités principales
- ✅ Authentification sécurisée (JWT + SHA-256)
- ✅ Gestion de leads (CRUD complet)
- ✅ Import CSV/Excel
- ✅ Système de tâches avec priorités
- ✅ Historique d'activités
- ✅ Rappels et alertes automatiques
- ✅ Intégration RingOver (téléphonie)
- ✅ Webhooks
- ✅ Rôles: admin et collaborateur

### Structure de la base de données
- `users`: Utilisateurs (admin/collaborateur)
- `leads`: Prospects et clients
- `tasks`: Tâches et rappels
- `activities`: Historique d'actions
- `imports`: Suivi des imports CSV
- `notifications`: Notifications en attente

## Nouvel utilisateur ajouté

### Informations de connexion

**Email**: `cedric.refray@sinexy.fr`
**Mot de passe**: `W=f4]!|fD&a*v!(>}lEL`
**Rôle**: `collaborateur`

⚠️ **Ce mot de passe est robuste et conforme aux bonnes pratiques:**
- 20 caractères
- Majuscules, minuscules, chiffres et caractères spéciaux
- Généré aléatoirement

## Instructions de déploiement

### Étape 1: Appliquer la migration SQL

```bash
# Se placer à la racine du projet
cd /Users/msdn-consulting/Documents/GitHub/crm-msdn-consulting

# Appliquer la migration (ajoute l'utilisateur dans la base de données)
wrangler d1 execute crm-database --file=schema/003_add_cedric_refray.sql
```

### Étape 2: Vérifier la création de l'utilisateur

```bash
# Vérifier que l'utilisateur a bien été créé
wrangler d1 execute crm-database --command="SELECT id, email, first_name, last_name, role, created_at FROM users WHERE email='cedric.refray@sinexy.fr'"
```

Vous devriez voir:
```
| id | email                      | first_name | last_name | role          | created_at |
|----|----------------------------|------------|-----------|---------------|------------|
| X  | cedric.refray@sinexy.fr    | Cédric     | Refray    | collaborateur | ...        |
```

### Étape 3: Connexion

L'utilisateur peut maintenant se connecter:
1. Accéder à l'interface web du CRM
2. Utiliser l'email: `cedric.refray@sinexy.fr`
3. Utiliser le mot de passe: `W=f4]!|fD&a*v!(>}lEL`

## Options supplémentaires

### Changer le rôle en admin

Si vous souhaitez donner les droits administrateur:

```bash
wrangler d1 execute crm-database --command="UPDATE users SET role='admin' WHERE email='cedric.refray@sinexy.fr'"
```

### Réinitialiser le mot de passe

Si besoin de générer un nouveau mot de passe:

```bash
# Générer un nouveau mot de passe et son hash
node scripts/generate-password-hash.js

# Puis mettre à jour dans la base de données
wrangler d1 execute crm-database --command="UPDATE users SET password_hash='$sha256$NOUVEAU_HASH' WHERE email='cedric.refray@sinexy.fr'"
```

### Supprimer l'utilisateur

```bash
wrangler d1 execute crm-database --command="DELETE FROM users WHERE email='cedric.refray@sinexy.fr'"
```

## Fichiers créés/modifiés

### Nouveaux fichiers
1. **`schema/003_add_cedric_refray.sql`**
   Migration SQL pour créer l'utilisateur

2. **`scripts/generate-password-hash.js`**
   Script pour générer des hashs de mots de passe

3. **`scripts/README.md`**
   Documentation du script de génération de hash

4. **`CREDENTIALS_CEDRIC_REFRAY.txt`**
   Fichier avec les identifiants (à supprimer après communication)

5. **`AJOUT_UTILISATEUR_GUIDE.md`** (ce fichier)
   Guide complet d'ajout utilisateur

### Fichiers modifiés
1. **`.gitignore`**
   Ajout de `CREDENTIALS_*.txt` pour éviter les commits accidentels

## Sécurité

### ⚠️ Important

1. **Supprimer le fichier credentials après utilisation**:
   ```bash
   rm CREDENTIALS_CEDRIC_REFRAY.txt
   ```

2. **Ne jamais commiter les mots de passe**:
   - Les fichiers `CREDENTIALS_*.txt` sont dans `.gitignore`
   - Vérifier avant chaque commit

3. **Recommander à l'utilisateur**:
   - Changer le mot de passe après la première connexion
   - Utiliser un gestionnaire de mots de passe
   - Activer l'authentification 2FA (si disponible)

4. **Bonnes pratiques**:
   - Mots de passe minimum 12 caractères
   - Utiliser le script `generate-password-hash.js` pour créer des mots de passe robustes
   - Ne jamais partager les mots de passe par email non chiffré

## Comptes existants

Les comptes de test actuels (à changer en production):

- **Admin**: `admin@msdn-consulting.fr` / `password123`
- **Collaborateur**: `alex.martin@msdn-consulting.fr` / `password123`
- **Collaborateur**: `alexandre.v@msdn-consulting.fr` / `password123`
- **Collaborateur**: `cedric.refray@sinexy.fr` / `W=f4]!|fD&a*v!(>}lEL` ✅

## Support

Pour toute question ou problème:
- Consulter le [README.md](README.md) principal
- Vérifier le [QUICKSTART.md](QUICKSTART.md)
- Consulter la [STRUCTURE.md](STRUCTURE.md)

## Prochaines étapes

1. ✅ Appliquer la migration SQL
2. ✅ Vérifier la création de l'utilisateur
3. ✅ Communiquer les identifiants de manière sécurisée
4. ✅ Supprimer `CREDENTIALS_CEDRIC_REFRAY.txt`
5. ✅ Demander à l'utilisateur de changer son mot de passe
6. ⚠️ Changer tous les mots de passe de test en production

---

*Date de création: 2026-03-05*
*Généré automatiquement par Claude Code*
