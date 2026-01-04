// ============================================
// Routes de gestion des leads
// ============================================

import { Hono } from 'hono';
import { getCurrentUser } from '../middleware/auth';
import type { Env, Lead } from '../types';

const leads = new Hono<{ Bindings: Env }>();

// GET /leads - Liste des leads
leads.get('/', async (c) => {
  try {
    const user = getCurrentUser(c);
    const { status, search } = c.req.query();

    let query = 'SELECT * FROM leads';
    const params: any[] = [];

    // Filtres
    const conditions: string[] = [];

    // Collaborateurs voient uniquement leurs leads
    if (user.role !== 'admin') {
      conditions.push('user_id = ?');
      params.push(user.userId);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push(
        '(full_name LIKE ? OR email LIKE ? OR company LIKE ?)'
      );
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updated_at DESC';

    const stmt = c.env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all<Lead>();

    return c.json({ leads: results || [] });
  } catch (error) {
    console.error('Get leads error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /leads/:id - Détail d'un lead
leads.get('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const leadId = c.req.param('id');

    let query = 'SELECT * FROM leads WHERE id = ?';
    const params: any[] = [leadId];

    // Collaborateurs voient uniquement leurs leads
    if (user.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(user.userId);
    }

    const lead = await c.env.DB.prepare(query)
      .bind(...params)
      .first<Lead>();

    if (!lead) {
      return c.json({ error: 'Lead non trouvé' }, 404);
    }

    return c.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// POST /leads - Créer un lead
leads.post('/', async (c) => {
  try {
    const user = getCurrentUser(c);
    const data = await c.req.json();

    const {
      first_name,
      last_name,
      full_name,
      email,
      phone,
      company,
      position,
      linkedin_url,
      status,
      tags,
      notes,
    } = data;

    // Validation
    if (!email && !full_name && !company) {
      return c.json({
        error: 'Au moins un des champs suivants est requis : email, nom complet, ou entreprise'
      }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO leads (
        user_id, first_name, last_name, full_name, email, phone,
        company, position, linkedin_url, status, tags, notes,
        source, last_activity_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      RETURNING *`
    ).bind(
      user.userId,
      first_name || null,
      last_name || null,
      full_name || `${first_name || ''} ${last_name || ''}`.trim() || null,
      email || null,
      phone || null,
      company || null,
      position || null,
      linkedin_url || null,
      status || 'nouveau',
      tags ? JSON.stringify(tags) : null,
      notes || null,
      'manuel'
    ).first<Lead>();

    if (!result) {
      return c.json({ error: 'Erreur lors de la création du lead' }, 500);
    }

    // Créer une activité
    await c.env.DB.prepare(
      `INSERT INTO activities (user_id, lead_id, activity_type, title, description)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      user.userId,
      result.id,
      'lead_created',
      'Lead créé',
      `Lead ${result.full_name || result.email} créé manuellement`
    ).run();

    return c.json({ lead: result }, 201);
  } catch (error) {
    console.error('Create lead error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// PUT /leads/:id - Mettre à jour un lead
leads.put('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const leadId = c.req.param('id');
    const data = await c.req.json();

    // Vérifier que le lead existe et appartient à l'utilisateur
    let checkQuery = 'SELECT * FROM leads WHERE id = ?';
    const checkParams: any[] = [leadId];

    if (user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(user.userId);
    }

    const existingLead = await c.env.DB.prepare(checkQuery)
      .bind(...checkParams)
      .first<Lead>();

    if (!existingLead) {
      return c.json({ error: 'Lead non trouvé' }, 404);
    }

    const {
      first_name,
      last_name,
      full_name,
      email,
      phone,
      company,
      position,
      linkedin_url,
      status,
      tags,
      notes,
      user_id, // Nouveau: permet de réassigner (admin uniquement)
    } = data;

    // Vérifier si on essaie de réassigner le lead
    if (user_id !== undefined && user_id !== existingLead.user_id) {
      // Seuls les admins peuvent réassigner
      if (user.role !== 'admin') {
        return c.json({ error: 'Seuls les administrateurs peuvent réassigner un lead' }, 403);
      }
    }

    const result = await c.env.DB.prepare(
      `UPDATE leads SET
        first_name = ?, last_name = ?, full_name = ?, email = ?, phone = ?,
        company = ?, position = ?, linkedin_url = ?, status = ?, tags = ?,
        notes = ?, user_id = ?, updated_at = CURRENT_TIMESTAMP, last_activity_at = CURRENT_TIMESTAMP
       WHERE id = ?
       RETURNING *`
    ).bind(
      first_name !== undefined ? first_name : existingLead.first_name,
      last_name !== undefined ? last_name : existingLead.last_name,
      full_name !== undefined ? full_name : existingLead.full_name,
      email !== undefined ? email : existingLead.email,
      phone !== undefined ? phone : existingLead.phone,
      company !== undefined ? company : existingLead.company,
      position !== undefined ? position : existingLead.position,
      linkedin_url !== undefined ? linkedin_url : existingLead.linkedin_url,
      status !== undefined ? status : existingLead.status,
      tags !== undefined ? (tags ? JSON.stringify(tags) : null) : existingLead.tags,
      notes !== undefined ? notes : existingLead.notes,
      user_id !== undefined ? user_id : existingLead.user_id,
      leadId
    ).first<Lead>();

    // Logger le changement de statut
    if (status && status !== existingLead.status) {
      await c.env.DB.prepare(
        `INSERT INTO activities (user_id, lead_id, activity_type, title, description, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        user.userId,
        leadId,
        'status_changed',
        'Statut modifié',
        `${existingLead.status} → ${status}`,
        JSON.stringify({ old_status: existingLead.status, new_status: status })
      ).run();
    }

    // Logger la réassignation du lead
    if (user_id !== undefined && user_id !== existingLead.user_id) {
      const newOwner = await c.env.DB.prepare(
        'SELECT first_name, last_name FROM users WHERE id = ?'
      ).bind(user_id).first<{ first_name: string; last_name: string }>();

      const oldOwner = await c.env.DB.prepare(
        'SELECT first_name, last_name FROM users WHERE id = ?'
      ).bind(existingLead.user_id).first<{ first_name: string; last_name: string }>();

      await c.env.DB.prepare(
        `INSERT INTO activities (user_id, lead_id, activity_type, title, description, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
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
  } catch (error) {
    console.error('Update lead error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// DELETE /leads/:id - Supprimer un lead
leads.delete('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const leadId = c.req.param('id');

    let query = 'DELETE FROM leads WHERE id = ?';
    const params: any[] = [leadId];

    if (user.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(user.userId);
    }

    const result = await c.env.DB.prepare(query).bind(...params).run();

    if (!result.success) {
      return c.json({ error: 'Lead non trouvé ou suppression échouée' }, 404);
    }

    return c.json({ message: 'Lead supprimé avec succès' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /leads/:id/activities - Activités d'un lead
leads.get('/:id/activities', async (c) => {
  try {
    const user = getCurrentUser(c);
    const leadId = c.req.param('id');

    // Vérifier accès au lead
    let checkQuery = 'SELECT id FROM leads WHERE id = ?';
    const checkParams: any[] = [leadId];

    if (user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(user.userId);
    }

    const lead = await c.env.DB.prepare(checkQuery)
      .bind(...checkParams)
      .first();

    if (!lead) {
      return c.json({ error: 'Lead non trouvé' }, 404);
    }

    // Récupérer les activités
    const { results } = await c.env.DB.prepare(
      `SELECT a.*, u.first_name, u.last_name
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.lead_id = ?
       ORDER BY a.created_at DESC`
    ).bind(leadId).all();

    return c.json({ activities: results || [] });
  } catch (error) {
    console.error('Get lead activities error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// POST /leads/:id/activities - Ajouter une activité
leads.post('/:id/activities', async (c) => {
  try {
    const user = getCurrentUser(c);
    const leadId = c.req.param('id');
    const { activity_type, title, description, metadata } = await c.req.json();

    // Vérifier accès au lead
    let checkQuery = 'SELECT id FROM leads WHERE id = ?';
    const checkParams: any[] = [leadId];

    if (user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(user.userId);
    }

    const lead = await c.env.DB.prepare(checkQuery)
      .bind(...checkParams)
      .first();

    if (!lead) {
      return c.json({ error: 'Lead non trouvé' }, 404);
    }

    // Créer l'activité
    const result = await c.env.DB.prepare(
      `INSERT INTO activities (user_id, lead_id, activity_type, title, description, metadata)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(
      user.userId,
      leadId,
      activity_type,
      title,
      description || null,
      metadata ? JSON.stringify(metadata) : null
    ).first();

    // Mettre à jour last_activity_at du lead
    await c.env.DB.prepare(
      'UPDATE leads SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(leadId).run();

    return c.json({ activity: result }, 201);
  } catch (error) {
    console.error('Create activity error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default leads;
