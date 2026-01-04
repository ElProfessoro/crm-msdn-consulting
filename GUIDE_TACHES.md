# 📋 Guide de Gestion des Tâches

## ✅ Fonctionnalités Implémentées

La gestion complète des tâches est maintenant disponible dans le CRM avec:
- ✅ Page dédiée de liste des tâches
- ✅ Création et modification de tâches
- ✅ Filtrage par statut et priorité
- ✅ Association tâche-lead
- ✅ Indicateurs de retard
- ✅ Onglet Tâches dans chaque lead

---

## 🎯 Accès

### Page Principale des Tâches

**URL**: https://eee48d96.crm-frontend-ez2.pages.dev/tasks.html

**Accès**:
1. Connectez-vous au CRM
2. Cliquez sur **"Tâches"** dans le menu de gauche

### Tâches d'un Lead Spécifique

1. Accédez à un lead
2. Cliquez sur l'onglet **"Tâches"** dans la colonne de droite

---

## 📊 Page Principale des Tâches

### Vue d'Ensemble

La page affiche toutes vos tâches sous forme de cartes colorées selon la priorité:
- 🔴 **Rouge** = Priorité haute
- 🟠 **Orange** = Priorité normale
- 🟢 **Vert** = Priorité basse
- 🔴 **Fond rose** = Tâche en retard

### Filtres Disponibles

Cliquez sur les boutons en haut pour filtrer:

```
[Toutes]  [À faire]  [En cours]  [Terminées]  [⚠️ En retard]
```

- **Toutes**: Affiche toutes les tâches
- **À faire**: Seulement les tâches non commencées
- **En cours**: Tâches en cours de traitement
- **Terminées**: Tâches complétées
- **⚠️ En retard**: Tâches dont la date d'échéance est dépassée

### Carte de Tâche

Chaque carte affiche:

```
┌────────────────────────────────────────┐
│ [✓] Relancer Sophie Martin            │ ← Checkbox + titre
│     📎 Sophie Martin (TechSolutions)   │ ← Lead associé
│                                        │
│     Envoyer le devis par email         │ ← Description
│                                        │
│     [À faire] [Haute] ⏰ 05/01/2026    │ ← Statut, priorité, échéance
└────────────────────────────────────────┘
```

**Actions**:
- **Checkbox**: Coche pour marquer terminé, décoche pour réouvrir
- **Clic sur la carte**: Ouvre le modal de modification

---

## ➕ Créer une Nouvelle Tâche

### Depuis la Page Tâches

1. Cliquez sur **"➕ Nouvelle tâche"** en haut à droite
2. Remplissez le formulaire:
   - **Titre** * (requis): Ex: "Relancer le prospect"
   - **Description**: Détails supplémentaires
   - **Statut**: À faire / En cours / Terminée
   - **Priorité**: Basse / Normale / Haute
   - **Date d'échéance**: Optionnel
   - **Lead associé**: Sélectionnez un lead dans la liste
3. Cliquez sur **"Enregistrer"**

### Depuis un Lead

1. Ouvrez un lead
2. Allez dans l'onglet **"Tâches"**
3. Cliquez sur **"➕ Nouvelle tâche"**
4. Le lead est **automatiquement associé** à la tâche
5. Remplissez le formulaire et enregistrez

---

## ✏️ Modifier une Tâche

### Méthode 1: Depuis la Liste

1. Allez dans **Tâches**
2. **Cliquez sur une carte** de tâche
3. Modifiez les champs
4. Cliquez sur **"Enregistrer"**

### Méthode 2: Toggle Rapide

Pour marquer rapidement une tâche comme terminée:
1. **Cochez la checkbox** sur la carte
2. La tâche est automatiquement marquée comme "Terminée"
3. Pour réouvrir, **décochez** la checkbox

---

## 📋 Gestion des Tâches d'un Lead

### Afficher les Tâches d'un Lead

1. Ouvrez un lead
2. Cliquez sur l'onglet **"Tâches"**
3. Vous voyez toutes les tâches liées à ce lead

### Créer une Tâche pour ce Lead

1. Dans l'onglet Tâches du lead
2. Cliquez sur **"➕ Nouvelle tâche"**
3. Remplissez:
   - Titre
   - Description
   - Priorité
   - Date d'échéance
4. Cliquez sur **"Créer"**

La tâche apparaît:
- ✅ Dans l'onglet Tâches du lead
- ✅ Dans la liste principale des tâches
- ✅ Dans l'historique du lead (activité "Tâche créée")

### Toggle depuis un Lead

Dans l'onglet Tâches d'un lead:
- **Cochez** la checkbox pour terminer
- **Décochez** pour réouvrir
- L'historique du lead est mis à jour automatiquement

---

## 🎨 Indicateurs Visuels

### Priorité

Les cartes ont une **bordure gauche colorée**:
- 🔴 **Rouge** (4px) = Haute
- 🟠 **Orange** (4px) = Normale
- 🟢 **Vert** (4px) = Basse

### Retard

Si la date d'échéance est dépassée et la tâche n'est pas terminée:
- 🔴 **Fond rose clair** (#fef2f2)
- ⚠️ **Badge "En retard"** en rouge
- 🔴 **Bordure gauche rouge**

### Statut

Badges colorés:
- **À faire**: Badge gris
- **En cours**: Badge bleu
- **Terminée**: Badge vert

---

## 🔔 Notifications dans l'Historique

### Création de Tâche

Quand vous créez une tâche pour un lead:

```
[✓] Tâche créée
    Youssef Msalla
    Relancer par email
    Il y a 2 minutes
```

### Mise à Jour de Statut

Quand vous changez le statut d'une tâche:

```
[✓] Tâche mise à jour
    Youssef Msalla
    Statut: a_faire → termine
    Il y a 5 minutes
```

---

## 📊 Cas d'Usage

### Cas 1: Relancer un Lead

**Objectif**: Ne pas oublier de relancer Sophie Martin dans 3 jours

**Méthode**:
1. Ouvrez le lead "Sophie Martin"
2. Onglet **"Tâches"**
3. **"➕ Nouvelle tâche"**
4. Titre: "Relancer par email"
5. Priorité: Haute
6. Date d'échéance: Dans 3 jours
7. **"Créer"**

**Résultat**:
- La tâche apparaît dans votre liste Tâches
- Dans 3 jours, elle sera marquée en retard si non terminée
- Quand vous l'aurez fait, cochez la checkbox

### Cas 2: Organiser sa Journée

**Objectif**: Voir toutes les tâches à faire aujourd'hui

**Méthode**:
1. Allez dans **Tâches**
2. Cliquez sur **"À faire"**
3. Les tâches sont triées par date d'échéance
4. Les retards sont en rouge en haut

**Actions**:
- Cochez les tâches au fur et à mesure
- Cliquez sur une carte pour voir les détails
- Modifiez la priorité si nécessaire

### Cas 3: Workflow Commercial

**Objectif**: Processus complet de suivi d'un lead

**Étapes**:
1. Lead créé → Tâche "Qualifier le besoin" (Haute, aujourd'hui)
2. Besoin qualifié → Tâche "Envoyer devis" (Haute, demain)
3. Devis envoyé → Tâche "Relancer J+3" (Normale, dans 3 jours)
4. Relance faite → Tâche "Rdv de closing" (Haute, dans 7 jours)

**Avantage**:
- Aucun lead oublié
- Processus structuré
- Historique complet dans le lead

---

## 🚀 Raccourcis

### Créer une Tâche Rapidement

Pour créer une tâche en moins de 10 secondes:

1. **Menu** → "Tâches"
2. **"➕ Nouvelle tâche"**
3. **Titre** → "Relancer X"
4. **Lead** → Sélectionnez
5. **Priorité** → Haute
6. **Échéance** → Demain
7. **"Enregistrer"**

### Marquer Terminé

1. **Menu** → "Tâches"
2. **Cochez** la checkbox de la tâche
3. C'est tout! ✓

### Voir Mes Tâches Urgentes

1. **Menu** → "Tâches"
2. Cliquez sur **"⚠️ En retard"**
3. Traitez-les en priorité!

---

## 💡 Bonnes Pratiques

### 1. Toujours Définir une Échéance

**Pourquoi**: Une tâche sans échéance est souvent oubliée

**Comment**:
- Même approximatif (ex: dans 1 semaine)
- Le système vous alertera si en retard

### 2. Prioriser Correctement

**Haute**: Urgent et important (à faire aujourd'hui/demain)
**Normale**: Important mais pas urgent (cette semaine)
**Basse**: Peut attendre (quand j'ai le temps)

### 3. Associer au Lead

**Toujours** associer une tâche à un lead quand c'est possible:
- ✅ Historique complet dans le lead
- ✅ Contexte clair
- ✅ Activités tracées

### 4. Descriptions Claires

Mauvais: "Relancer"
Bon: "Relancer par email pour confirmer le rdv du 10/01"

**Pourquoi**: Dans 1 semaine, vous aurez oublié le contexte

### 5. Cocher Immédiatement

Quand vous terminez une tâche:
- ✅ Cochez immédiatement
- Ne laissez pas traîner les tâches terminées
- Gardez une liste propre et à jour

---

## 🔍 Dépannage

### Je ne vois pas mes tâches

**Causes possibles**:

1. **Vous avez un filtre actif**
   - Solution: Cliquez sur "Toutes"

2. **Vous n'êtes pas admin et vous regardez les tâches d'un autre**
   - Solution: Les collaborateurs ne voient que leurs tâches

3. **Vous n'avez pas de tâches**
   - Solution: Créez-en une!

### La tâche n'apparaît pas dans le lead

**Cause**: Vous n'avez pas associé la tâche au lead

**Solution**:
1. Modifiez la tâche
2. Sélectionnez le lead dans "Lead associé"
3. Enregistrez

### Je ne peux pas marquer une tâche terminée

**Cause**: Problème de connexion API

**Solution**:
1. Vérifiez votre connexion internet
2. Rechargez la page (F5)
3. Réessayez

---

## 📱 Responsive

L'interface des tâches est **responsive**:
- Desktop: Cartes larges avec tous les détails
- Tablet: Cartes adaptées
- Mobile: Cartes empilées verticalement

---

## ✅ Résumé des Fonctionnalités

| Fonctionnalité | Statut | Où |
|----------------|--------|-----|
| **Liste des tâches** | ✅ | Menu Tâches |
| **Création de tâche** | ✅ | Bouton "➕ Nouvelle tâche" |
| **Modification** | ✅ | Clic sur carte |
| **Suppression** | ❌ | À implémenter |
| **Filtres statut** | ✅ | Boutons en haut |
| **Filtre retard** | ✅ | Bouton "⚠️ En retard" |
| **Toggle terminé** | ✅ | Checkbox sur carte |
| **Association lead** | ✅ | Dropdown dans formulaire |
| **Tâches dans lead** | ✅ | Onglet "Tâches" |
| **Création depuis lead** | ✅ | Bouton dans onglet |
| **Historique lead** | ✅ | Activités automatiques |
| **Priorités** | ✅ | Haute/Normale/Basse |
| **Échéances** | ✅ | Date picker |
| **Indicateur retard** | ✅ | Fond rose + ⚠️ |

---

## 🎯 URLs

**Page des tâches**: https://eee48d96.crm-frontend-ez2.pages.dev/tasks.html

**Login**: https://eee48d96.crm-frontend-ez2.pages.dev/login.html
- Email: `msalla.youssef@gmail.com`
- Mot de passe: `Rsk0405$?G6677`

---

## 🎉 Prochaines Améliorations Possibles

1. **Suppression de tâche** avec confirmation
2. **Tri** (par date, priorité, statut)
3. **Recherche** de tâches par texte
4. **Rappels** par email avant échéance
5. **Récurrence** (tâches répétitives)
6. **Commentaires** sur les tâches
7. **Pièces jointes**
8. **Vue calendrier** des tâches
9. **Export** (PDF, CSV)
10. **Templates** de tâches

---

**🎉 La gestion des tâches est maintenant opérationnelle!**

Créez vos premières tâches et organisez votre prospection efficacement! 📋✨
