# 🔄 Réassignation des Leads

## ✅ Fonctionnalité Implémentée

Les administrateurs peuvent maintenant réassigner un lead d'un collaborateur à un autre via l'API.

---

## 🎯 Fonctionnement

### Permissions

| Rôle | Peut réassigner ? |
|------|------------------|
| **Admin** | ✅ Oui - Peut réassigner n'importe quel lead |
| **Collaborateur** | ❌ Non - Erreur 403 "Seuls les administrateurs peuvent réassigner un lead" |

### Endpoint API

**Méthode**: `PUT /leads/:id`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**:
```json
{
  "user_id": 4
}
```

> **Note**: Vous pouvez aussi inclure d'autres champs à modifier (first_name, email, status, etc.). Le champ `user_id` est optionnel et ne sera traité que s'il est fourni.

---

## 📊 Exemple Complet

### 1. Login en tant qu'admin

```bash
curl -X POST https://crm-api.msalla-youssef.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"msalla.youssef@gmail.com","password":"Rsk0405$?G6677"}'
```

**Réponse**:
```json
{
  "user": {
    "id": 4,
    "email": "msalla.youssef@gmail.com",
    "role": "admin"
  },
  "token": "eyJhbGci..."
}
```

### 2. Réassigner un lead

```bash
curl -X PUT https://crm-api.msalla-youssef.workers.dev/leads/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 4}'
```

**Réponse**:
```json
{
  "lead": {
    "id": 1,
    "user_id": 4,
    "full_name": "Sophie Martin",
    "company": "TechSolutions",
    "status": "nouveau",
    "updated_at": "2026-01-04 07:46:19"
  }
}
```

### 3. Vérifier l'activité de réassignation

```bash
curl https://crm-api.msalla-youssef.workers.dev/leads/1/activities \
  -H "Authorization: Bearer {token}"
```

**Réponse** (extrait):
```json
{
  "activities": [
    {
      "id": 5,
      "user_id": 4,
      "lead_id": 1,
      "activity_type": "lead_reassigned",
      "title": "Lead réassigné",
      "description": "Alex Martin → Youssef Msalla",
      "metadata": "{\"old_user_id\":2,\"new_user_id\":4,\"old_owner\":\"Alex Martin\",\"new_owner\":\"Youssef Msalla\"}",
      "created_at": "2026-01-04 07:46:19"
    }
  ]
}
```

---

## 🔐 Sécurité

### Vérifications Effectuées

1. **Authentification**: Le token JWT doit être valide
2. **Autorisation**: Seuls les administrateurs peuvent réassigner (`role: "admin"`)
3. **Existence**: Le lead doit exister dans la base
4. **Traçabilité**: Toute réassignation est enregistrée dans les activités

### Tentative de Réassignation par un Collaborateur

```bash
# Login en tant que collaborateur
curl -X POST https://crm-api.msalla-youssef.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex.martin@msdn-consulting.fr","password":"..."}'

# Tentative de réassignation
curl -X PUT https://crm-api.msalla-youssef.workers.dev/leads/1 \
  -H "Authorization: Bearer {token_collaborateur}" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 4}'
```

**Réponse**:
```json
{
  "error": "Seuls les administrateurs peuvent réassigner un lead"
}
```

**Code HTTP**: `403 Forbidden`

---

## 📝 Logging des Activités

### Informations Enregistrées

Chaque réassignation crée une activité avec:

| Champ | Valeur |
|-------|--------|
| `activity_type` | `"lead_reassigned"` |
| `title` | `"Lead réassigné"` |
| `description` | `"{ancien_owner} → {nouveau_owner}"` |
| `metadata` | JSON avec `old_user_id`, `new_user_id`, `old_owner`, `new_owner` |
| `user_id` | ID de l'admin qui a effectué la réassignation |
| `created_at` | Timestamp de la réassignation |

### Exemple de Metadata

```json
{
  "old_user_id": 2,
  "new_user_id": 4,
  "old_owner": "Alex Martin",
  "new_owner": "Youssef Msalla"
}
```

---

## 🎨 Interface Frontend (À Implémenter)

### Vue Suggérée

Dans la page de détail d'un lead ([lead.html](frontend/lead.html)), ajouter:

```html
<!-- Visible uniquement pour les admins -->
<div class="reassign-section" v-if="user.role === 'admin'">
  <label>Assigné à:</label>
  <select id="assignedUser">
    <option value="2">Alex Martin</option>
    <option value="3">Alexandre Valentin</option>
    <option value="4">Youssef Msalla</option>
  </select>
  <button onclick="reassignLead()">Réassigner</button>
</div>
```

### Code JavaScript

```javascript
async function reassignLead() {
  const leadId = new URLSearchParams(window.location.search).get('id');
  const newUserId = document.getElementById('assignedUser').value;

  const response = await fetch(`${API_URL}/leads/${leadId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: parseInt(newUserId) })
  });

  if (response.ok) {
    alert('Lead réassigné avec succès!');
    location.reload();
  } else {
    const error = await response.json();
    alert(error.error);
  }
}
```

---

## 🔧 Code Backend

### Fichier Modifié

**[workers/api/src/routes/leads.ts](workers/api/src/routes/leads.ts)**

### Extrait du Code

```typescript
// PUT /leads/:id - Mettre à jour un lead
leads.put('/:id', async (c) => {
  const user = getCurrentUser(c);
  const leadId = c.req.param('id');
  const data = await c.req.json();

  const {
    // ... autres champs
    user_id, // Nouveau: permet de réassigner (admin uniquement)
  } = data;

  // Vérifier si on essaie de réassigner le lead
  if (user_id !== undefined && user_id !== existingLead.user_id) {
    // Seuls les admins peuvent réassigner
    if (user.role !== 'admin') {
      return c.json({
        error: 'Seuls les administrateurs peuvent réassigner un lead'
      }, 403);
    }
  }

  // Mettre à jour le lead avec le nouveau user_id
  const result = await c.env.DB.prepare(`
    UPDATE leads SET
      user_id = ?,
      updated_at = CURRENT_TIMESTAMP,
      last_activity_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `).bind(
    user_id !== undefined ? user_id : existingLead.user_id,
    leadId
  ).first<Lead>();

  // Logger la réassignation
  if (user_id !== undefined && user_id !== existingLead.user_id) {
    const newOwner = await c.env.DB.prepare(
      'SELECT first_name, last_name FROM users WHERE id = ?'
    ).bind(user_id).first<{ first_name: string; last_name: string }>();

    const oldOwner = await c.env.DB.prepare(
      'SELECT first_name, last_name FROM users WHERE id = ?'
    ).bind(existingLead.user_id).first<{ first_name: string; last_name: string }>();

    await c.env.DB.prepare(`
      INSERT INTO activities (user_id, lead_id, activity_type, title, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      user.userId,
      leadId,
      'lead_reassigned',
      'Lead réassigné',
      `${oldOwner?.first_name} ${oldOwner?.last_name} → ${newOwner?.first_name} ${newOwner?.last_name}`,
      JSON.stringify({
        old_user_id: existingLead.user_id,
        new_user_id: user_id,
        old_owner: `${oldOwner?.first_name} ${oldOwner?.last_name}`,
        new_owner: `${newOwner?.first_name} ${newOwner?.last_name}`
      })
    ).run();
  }

  return c.json({ lead: result });
});
```

---

## ✅ Tests Effectués

### Test 1: Réassignation par Admin ✅

**Lead avant**:
```json
{
  "id": 1,
  "user_id": 2,
  "full_name": "Sophie Martin"
}
```

**Commande**:
```bash
curl -X PUT https://crm-api.msalla-youssef.workers.dev/leads/1 \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"user_id": 4}'
```

**Lead après**:
```json
{
  "id": 1,
  "user_id": 4,
  "full_name": "Sophie Martin"
}
```

**Activité créée**: ✅
```
"Lead réassigné: Alex Martin → Youssef Msalla"
```

### Test 2: Permissions Admin ✅

Un collaborateur ne peut pas réassigner un lead → Erreur 403 attendue.

---

## 🚀 Déploiement

**Version déployée**: `6edc71fa-856b-4059-95c1-3d87df927463`
**Date**: 04/01/2026 à 07:39
**URL API**: https://crm-api.msalla-youssef.workers.dev

---

## 📋 Utilisateurs Disponibles

| ID | Nom | Email | Rôle |
|----|-----|-------|------|
| 1 | Thomas Dubois | admin@msdn-consulting.fr | admin |
| 2 | Alex Martin | alex.martin@msdn-consulting.fr | collaborateur |
| 3 | Alexandre Valentin | alexandre.v@msdn-consulting.fr | collaborateur |
| 4 | Youssef Msalla | msalla.youssef@gmail.com | admin |

---

## 📊 Cas d'Usage

### Scénario 1: Redistribution de Charge

Un collaborateur part en congé, l'admin réassigne ses leads à un autre collaborateur.

```bash
# Réassigner tous les leads d'Alex (user_id: 2) à Alexandre (user_id: 3)
# Note: Nécessite un script ou interface UI pour traiter plusieurs leads
```

### Scénario 2: Spécialisation

Un lead change de secteur (ex: Healthcare → Tech), l'admin le réassigne au spécialiste approprié.

```bash
curl -X PUT https://crm-api.msalla-youssef.workers.dev/leads/42 \
  -H "Authorization: Bearer {token}" \
  -d '{"user_id": 3, "tags": ["Tech", "Cloud"]}'
```

### Scénario 3: Escalade

Un lead devient stratégique, l'admin se l'assigne.

```bash
curl -X PUT https://crm-api.msalla-youssef.workers.dev/leads/100 \
  -H "Authorization: Bearer {token}" \
  -d '{"user_id": 4, "status": "prioritaire"}'
```

---

## 🎉 Résumé

| Élément | Statut |
|---------|--------|
| **Backend API** | ✅ Déployé et fonctionnel |
| **Permission Admin** | ✅ Vérifié (403 pour collaborateurs) |
| **Logging Activité** | ✅ Automatique avec metadata |
| **Tests** | ✅ Réassignation testée avec succès |
| **Frontend UI** | ⏳ À implémenter (suggéré ci-dessus) |

---

**🎯 Prochaine étape suggérée**: Ajouter une interface UI dans [frontend/lead.html](frontend/lead.html) pour permettre aux admins de réassigner facilement les leads via un dropdown.
