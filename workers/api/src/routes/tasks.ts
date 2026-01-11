// ============================================
// Routes de gestion des tâches
// ============================================

import { Hono } from 'hono';
import { getCurrentUser } from '../middleware/auth';
import type { Env, Task } from '../types';

const tasks = new Hono<{ Bindings: Env }>();

// GET /tasks - Liste des tâches
tasks.get('/', async (c) => {
  try {
    const user = getCurrentUser(c);
    const { status, overdue, lead_id } = c.req.query();

    let query = `
      SELECT t.*, l.full_name as lead_name, l.company as lead_company
      FROM tasks t
      LEFT JOIN leads l ON t.lead_id = l.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Collaborateurs voient uniquement leurs tâches
    if (user.role !== 'admin') {
      conditions.push('t.user_id = ?');
      params.push(user.userId);
    }

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (lead_id) {
      conditions.push('t.lead_id = ?');
      params.push(lead_id);
    }

    if (overdue === 'true') {
      conditions.push('t.due_at < CURRENT_TIMESTAMP');
      conditions.push('t.status != ?');
      params.push('termine');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.due_at ASC, t.priority DESC';

    const stmt = c.env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    return c.json({ tasks: results || [] });
  } catch (error) {
    console.error('Get tasks error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /tasks/:id - Détail d'une tâche
tasks.get('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param('id');

    let query = `
      SELECT t.*, l.full_name as lead_name, l.company as lead_company
      FROM tasks t
      LEFT JOIN leads l ON t.lead_id = l.id
      WHERE t.id = ?
    `;
    const params: any[] = [taskId];

    if (user.role !== 'admin') {
      query += ' AND t.user_id = ?';
      params.push(user.userId);
    }

    const task = await c.env.DB.prepare(query)
      .bind(...params)
      .first();

    if (!task) {
      return c.json({ error: 'Tâche non trouvée' }, 404);
    }

    return c.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// POST /tasks - Créer une tâche
tasks.post('/', async (c) => {
  try {
    const user = getCurrentUser(c);
    const data = await c.req.json();

    const {
      title,
      description,
      status,
      priority,
      due_at,
      lead_id,
    } = data;

    if (!title) {
      return c.json({ error: 'Le titre est requis' }, 400);
    }

    // Si lead_id fourni, vérifier statut RGPD
    if (lead_id) {
      const lead = await c.env.DB.prepare(
        'SELECT status FROM leads WHERE id = ?'
      ).bind(lead_id).first<{ status: string }>();

      if (lead?.status === 'ne_plus_contacter') {
        return c.json({
          error: 'Impossible de créer une tâche pour ce lead : il ne souhaite plus être contacté (RGPD)'
        }, 403);
      }
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO tasks (
        title, description, status, priority, due_at, user_id, lead_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    ).bind(
      title,
      description || null,
      status || 'a_faire',
      priority || 'normale',
      due_at || null,
      user.userId,
      lead_id || null
    ).first<Task>();

    if (!result) {
      return c.json({ error: 'Erreur lors de la création de la tâche' }, 500);
    }

    // Créer une activité si liée à un lead
    if (lead_id) {
      await c.env.DB.prepare(
        `INSERT INTO activities (user_id, lead_id, task_id, activity_type, title, description)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        user.userId,
        lead_id,
        result.id,
        'task_created',
        'Tâche créée',
        title
      ).run();
    }

    return c.json({ task: result }, 201);
  } catch (error) {
    console.error('Create task error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// PUT /tasks/:id - Mettre à jour une tâche
tasks.put('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param('id');
    const data = await c.req.json();

    // Vérifier que la tâche existe et appartient à l'utilisateur
    let checkQuery = 'SELECT * FROM tasks WHERE id = ?';
    const checkParams: any[] = [taskId];

    if (user.role !== 'admin') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(user.userId);
    }

    const existingTask = await c.env.DB.prepare(checkQuery)
      .bind(...checkParams)
      .first<Task>();

    if (!existingTask) {
      return c.json({ error: 'Tâche non trouvée' }, 404);
    }

    const {
      title,
      description,
      status,
      priority,
      due_at,
    } = data;

    // Si le statut passe à "termine", ajouter completed_at
    const completedAt = (status === 'termine' && existingTask.status !== 'termine')
      ? new Date().toISOString()
      : existingTask.completed_at;

    const result = await c.env.DB.prepare(
      `UPDATE tasks SET
        title = ?, description = ?, status = ?, priority = ?, due_at = ?,
        completed_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
       RETURNING *`
    ).bind(
      title !== undefined ? title : existingTask.title,
      description !== undefined ? description : existingTask.description,
      status !== undefined ? status : existingTask.status,
      priority !== undefined ? priority : existingTask.priority,
      due_at !== undefined ? due_at : existingTask.due_at,
      completedAt,
      taskId
    ).first<Task>();

    // Logger le changement de statut
    if (status && status !== existingTask.status && existingTask.lead_id) {
      await c.env.DB.prepare(
        `INSERT INTO activities (user_id, lead_id, task_id, activity_type, title, description)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        user.userId,
        existingTask.lead_id,
        taskId,
        'task_updated',
        'Tâche mise à jour',
        `Statut: ${existingTask.status} → ${status}`
      ).run();
    }

    return c.json({ task: result });
  } catch (error) {
    console.error('Update task error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// DELETE /tasks/:id - Supprimer une tâche
tasks.delete('/:id', async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param('id');

    let query = 'DELETE FROM tasks WHERE id = ?';
    const params: any[] = [taskId];

    if (user.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(user.userId);
    }

    const result = await c.env.DB.prepare(query).bind(...params).run();

    if (!result.success) {
      return c.json({ error: 'Tâche non trouvée ou suppression échouée' }, 404);
    }

    return c.json({ message: 'Tâche supprimée avec succès' });
  } catch (error) {
    console.error('Delete task error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default tasks;
