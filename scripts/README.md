# Scripts utilitaires

Ce dossier contient des scripts pour faciliter la gestion du CRM.

## generate-password-hash.js

Script pour générer des hashs de mots de passe compatibles avec le système d'authentification du CRM.

### Utilisation

#### Générer un mot de passe robuste aléatoire et son hash:

```bash
node scripts/generate-password-hash.js
```

#### Générer le hash d'un mot de passe spécifique:

```bash
node scripts/generate-password-hash.js "mon-mot-de-passe"
```

### Caractéristiques du mot de passe généré

- Longueur: 20 caractères
- Contient: majuscules, minuscules, chiffres et caractères spéciaux
- Génération aléatoire sécurisée

### Format du hash

Le hash généré utilise SHA-256 et suit le format:

```
$sha256$[hash-en-hexadécimal]
```

Ce format est compatible avec la fonction `hashPassword()` dans `workers/api/src/utils/password.ts`.

### Exemple d'utilisation pour créer un utilisateur

1. Générer le hash:
```bash
node scripts/generate-password-hash.js "MonMotDePasse123!"
```

2. Copier le hash généré

3. Créer un fichier SQL de migration:
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('utilisateur@example.com', '$sha256$...hash...', 'Prénom', 'Nom', 'collaborateur');
```

4. Appliquer la migration:
```bash
wrangler d1 execute crm-database --file=schema/votre_migration.sql
```

## Sécurité

⚠️ **Important:**
- Ne commitez jamais les mots de passe en clair dans git
- Utilisez des mots de passe robustes (minimum 12 caractères)
- Stockez les mots de passe dans un gestionnaire de mots de passe
- Changez les mots de passe de test en production
