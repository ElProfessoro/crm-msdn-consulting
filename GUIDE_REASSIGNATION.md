# 📖 Guide: Comment Réassigner un Lead

## 🎯 Étape par Étape

### 1. Connexion en tant qu'Admin

**URL**: https://c1a91382.crm-frontend-ez2.pages.dev/login.html

**Identifiants**:
- Email: `msalla.youssef@gmail.com`
- Mot de passe: `Rsk0405$?G6677`

> ⚠️ **Important**: Seuls les administrateurs peuvent voir et utiliser la fonction de réassignation.

---

### 2. Accéder à la Liste des Leads

1. Cliquez sur **"Leads"** dans le menu de gauche
2. Vous verrez la liste de tous vos leads (643 leads Pharow)

---

### 3. Ouvrir un Lead

Cliquez sur **n'importe quel lead** dans la liste pour ouvrir sa fiche détaillée.

**Exemple**: Cliquez sur "Sophie Martin" ou n'importe quel autre lead.

---

### 4. Trouver la Section de Réassignation

Dans la page du lead, **descendez dans la colonne de gauche** jusqu'à voir:

```
┌─────────────────────────────────┐
│  COORDONNÉES                    │
│  Email: ...                     │
│  Téléphone: ...                 │
│  Entreprise: ...                │
│  LinkedIn: ...                  │
│                                 │
│  TAGS                           │
│  [Tag1] [Tag2]                  │
│                                 │
│  ─────────────────────────────  │  ← Descendez jusqu'ici
│                                 │
│  ASSIGNATION                    │  ← Cette section
│  ─────────────────────────────  │
│  ASSIGNÉ À                      │
│  ┌───────────────────────────┐ │
│  │ Alex Martin             ▼ │ │  ← Menu déroulant
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  🔄 Réassigner            │ │  ← Bouton bleu
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

> **Si vous ne voyez PAS cette section**: Vous n'êtes pas connecté en tant qu'admin. Déconnectez-vous et reconnectez-vous avec les identifiants admin ci-dessus.

---

### 5. Sélectionner le Nouveau Propriétaire

Cliquez sur le **menu déroulant** "ASSIGNÉ À" et vous verrez:

```
┌──────────────────────────────────┐
│ Alex Martin                    ▼ │
└──────────────────────────────────┘
  ↓ Cliquez pour ouvrir

┌──────────────────────────────────┐
│ Alex Martin                      │ ← Propriétaire actuel
│ Alexandre Valentin               │
│ Thomas Dubois (Admin)            │
│ Youssef Msalla (Admin)           │ ← C'est vous
└──────────────────────────────────┘
```

**Sélectionnez** l'utilisateur auquel vous voulez réassigner le lead.

**Exemples**:
- Pour vous l'assigner: Sélectionnez "Youssef Msalla (Admin)"
- Pour l'assigner à Alexandre: Sélectionnez "Alexandre Valentin"

---

### 6. Cliquer sur "🔄 Réassigner"

Une fois le nouvel utilisateur sélectionné, cliquez sur le bouton bleu **"🔄 Réassigner"**.

Une **popup de confirmation** apparaît:

```
┌─────────────────────────────────────┐
│  Êtes-vous sûr de vouloir          │
│  réassigner ce lead ?              │
│                                     │
│  [Annuler]         [OK]            │
└─────────────────────────────────────┘
```

Cliquez sur **"OK"** pour confirmer.

---

### 7. Confirmation

Un **message de succès** s'affiche:

```
✓ Lead réassigné avec succès
```

---

### 8. Vérifier dans l'Historique

Allez dans l'onglet **"Historique"** (colonne de droite) et vous verrez la nouvelle activité:

```
┌─────────────────────────────────────────┐
│ HISTORIQUE                              │
├─────────────────────────────────────────┤
│ [👥] Lead réassigné                     │  ← Nouvelle activité
│      Youssef Msalla                     │  ← Vous (qui a fait l'action)
│      Alex Martin → Alexandre Valentin   │  ← Ancien → Nouveau
│      À l'instant                        │
└─────────────────────────────────────────┘
```

L'icône **👥** orange indique une réassignation.

---

## 🎬 Exemple Complet

### Scénario: Réassigner un lead à vous-même

1. ✅ **Connexion**: https://c1a91382.crm-frontend-ez2.pages.dev/login.html
   - Email: `msalla.youssef@gmail.com`
   - Mot de passe: `Rsk0405$?G6677`

2. ✅ **Menu**: Cliquez sur "Leads"

3. ✅ **Liste**: Cliquez sur le premier lead (ex: "Sophie Martin")

4. ✅ **Descendre**: Scrollez dans la colonne de gauche jusqu'à "ASSIGNATION"

5. ✅ **Dropdown**: Cliquez sur le menu déroulant

6. ✅ **Sélection**: Choisissez "Youssef Msalla (Admin)"

7. ✅ **Réassigner**: Cliquez sur le bouton bleu "🔄 Réassigner"

8. ✅ **Confirmer**: Cliquez sur "OK" dans la popup

9. ✅ **Succès**: Message "Lead réassigné avec succès"

10. ✅ **Historique**: Allez dans "Historique" → Vous voyez l'activité avec l'icône 👥

---

## 🔍 Dépannage

### Je ne vois pas la section "ASSIGNATION"

**Causes possibles**:

1. **Vous n'êtes pas admin**
   - Solution: Déconnectez-vous et reconnectez-vous avec:
     - Email: `msalla.youssef@gmail.com`
     - Mot de passe: `Rsk0405$?G6677`

2. **Le navigateur a mis en cache l'ancienne version**
   - Solution: Videz le cache (Cmd+Shift+R ou Ctrl+Shift+R)
   - Ou ouvrez en navigation privée

3. **Vous êtes sur l'ancienne URL**
   - Solution: Utilisez la nouvelle URL: https://c1a91382.crm-frontend-ez2.pages.dev

### Le menu déroulant est vide

**Cause**: L'API /users ne répond pas

**Solution**:
1. Ouvrez la console du navigateur (F12)
2. Recherchez les erreurs
3. Vérifiez que vous êtes bien connecté (token valide)

### Erreur lors de la réassignation

**Messages possibles**:

- **"Le lead est déjà assigné à cet utilisateur"**: Vous avez sélectionné le même utilisateur. Choisissez-en un autre.

- **"Seuls les administrateurs peuvent réassigner un lead"**: Vous n'êtes pas connecté en tant qu'admin.

- **"Erreur lors de la réassignation"**: Problème réseau ou API. Réessayez dans quelques secondes.

---

## 📊 Utilisateurs Disponibles

Vous pouvez réassigner les leads à ces utilisateurs:

| Nom | Email | Rôle |
|-----|-------|------|
| **Youssef Msalla** | msalla.youssef@gmail.com | Admin |
| **Thomas Dubois** | admin@msdn-consulting.fr | Admin |
| **Alex Martin** | alex.martin@msdn-consulting.fr | Collaborateur |
| **Alexandre Valentin** | alexandre.v@msdn-consulting.fr | Collaborateur |

---

## 💡 Cas d'Usage

### Cas 1: Vous prendre tous les leads d'un collaborateur

**Objectif**: Alex part en congé, vous voulez gérer ses leads.

**Méthode**:
1. Allez dans "Leads"
2. Pour chaque lead d'Alex, ouvrez-le
3. Dans "ASSIGNATION", sélectionnez "Youssef Msalla (Admin)"
4. Cliquez sur "🔄 Réassigner"
5. Répétez pour tous les leads d'Alex

> **Note**: Actuellement, il faut le faire lead par lead. Une fonction de réassignation en masse pourrait être ajoutée à l'avenir.

### Cas 2: Équilibrer la charge entre collaborateurs

**Objectif**: Alex a trop de leads, Alexandre pas assez.

**Méthode**:
1. Ouvrez un lead d'Alex
2. Sélectionnez "Alexandre Valentin"
3. Réassignez
4. Répétez pour 10-20 leads pour équilibrer

### Cas 3: Lead stratégique à gérer personnellement

**Objectif**: Un lead important que vous voulez gérer vous-même.

**Méthode**:
1. Ouvrez le lead
2. Sélectionnez "Youssef Msalla (Admin)"
3. Réassignez
4. Le lead apparaît maintenant dans votre liste personnelle

---

## 🎯 Raccourcis

### Pour réassigner rapidement un lead à vous-même:

1. **Leads** → Cliquez sur un lead
2. **Descendez** → Section "ASSIGNATION"
3. **Dropdown** → "Youssef Msalla (Admin)"
4. **Bouton** → "🔄 Réassigner"
5. **Confirmer** → "OK"

**Temps total**: ~10 secondes par lead

---

## ✅ Points Clés à Retenir

1. ✅ **Seuls les admins** peuvent réassigner
2. ✅ La section "ASSIGNATION" est dans la **colonne de gauche**
3. ✅ Il faut **descendre** pour la voir (sous TAGS)
4. ✅ Une **confirmation** est demandée à chaque fois
5. ✅ L'historique est **mis à jour automatiquement** avec l'icône 👥
6. ✅ Le lead disparaît de la liste de l'ancien propriétaire
7. ✅ Le lead apparaît dans la liste du nouveau propriétaire

---

## 🚀 URL Rapide

**Page de connexion**: https://c1a91382.crm-frontend-ez2.pages.dev/login.html

Une fois connecté en admin, tous les leads auront la section de réassignation visible! 🎉
