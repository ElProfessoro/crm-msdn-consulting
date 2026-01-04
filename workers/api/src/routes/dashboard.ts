// ============================================
// Routes du dashboard (statistiques)
// ============================================

import { Hono } from 'hono';
import { getCurrentUser } from '../middleware/auth';
import type { Env } from '../types';

const dashboard = new Hono<{ Bindings: Env }>();

// GET /dashboard/stats - Statistiques du dashboard
dashboard.get('/stats', async (c) => {
  try {
    const user = getCurrentUser(c);

    // Filtrage par utilisateur si collaborateur
    const userFilter = user.role === 'admin' ? '' : 'AND user_id = ?';
    const userParam = user.role === 'admin' ? [] : [user.userId];

    // Leads gagnés ce mois
    const leadsWon = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM leads
       WHERE status = 'gagne'
       AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')
       ${userFilter}`
    ).bind(...userParam).first<{ count: number }>();

    // Leads perdus ce mois
    const leadsLost = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM leads
       WHERE status = 'perdu'
       AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')
       ${userFilter}`
    ).bind(...userParam).first<{ count: number }>();

    // Tâches collectées aujourd'hui
    const tasksToday = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM tasks
       WHERE date(created_at) = date('now')
       ${userFilter.replace('user_id', 't.user_id')}`
    ).bind(...userParam).first<{ count: number }>();

    // Taux de conversion ce mois
    const totalLeadsMonth = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM leads
       WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
       ${userFilter}`
    ).bind(...userParam).first<{ count: number }>();

    const conversionRate = totalLeadsMonth?.count && totalLeadsMonth.count > 0
      ? Math.round((leadsWon?.count || 0) / totalLeadsMonth.count * 100)
      : 0;

    return c.json({
      stats: {
        leads_won_month: leadsWon?.count || 0,
        leads_lost_month: leadsLost?.count || 0,
        tasks_today: tasksToday?.count || 0,
        conversion_rate: conversionRate,
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /dashboard/priority-tasks - Tâches prioritaires
dashboard.get('/priority-tasks', async (c) => {
  try {
    const user = getCurrentUser(c);

    const userFilter = user.role === 'admin' ? '' : 'WHERE t.user_id = ?';
    const userParam = user.role === 'admin' ? [] : [user.userId];

    const { results } = await c.env.DB.prepare(
      `SELECT t.*, l.full_name as lead_name, l.company as lead_company
       FROM tasks t
       LEFT JOIN leads l ON t.lead_id = l.id
       ${userFilter}
       ${userFilter ? 'AND' : 'WHERE'} t.status != 'termine'
       ORDER BY
         CASE t.priority
           WHEN 'haute' THEN 1
           WHEN 'normale' THEN 2
           WHEN 'basse' THEN 3
         END,
         t.due_at ASC
       LIMIT 3`
    ).bind(...userParam).all();

    return c.json({ tasks: results || [] });
  } catch (error) {
    console.error('Get priority tasks error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /dashboard/recent-leads - Derniers leads
dashboard.get('/recent-leads', async (c) => {
  try {
    const user = getCurrentUser(c);

    const userFilter = user.role === 'admin' ? '' : 'WHERE user_id = ?';
    const userParam = user.role === 'admin' ? [] : [user.userId];

    const { results } = await c.env.DB.prepare(
      `SELECT l.*, u.first_name as owner_first_name, u.last_name as owner_last_name
       FROM leads l
       LEFT JOIN users u ON l.user_id = u.id
       ${userFilter}
       ORDER BY l.created_at DESC
       LIMIT 5`
    ).bind(...userParam).all();

    return c.json({ leads: results || [] });
  } catch (error) {
    console.error('Get recent leads error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /dashboard/recent-activities - Activités récentes
dashboard.get('/recent-activities', async (c) => {
  try {
    const user = getCurrentUser(c);

    const userFilter = user.role === 'admin' ? '' : 'WHERE a.user_id = ?';
    const userParam = user.role === 'admin' ? [] : [user.userId];

    const { results } = await c.env.DB.prepare(
      `SELECT a.*, u.first_name, u.last_name, l.full_name as lead_name
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN leads l ON a.lead_id = l.id
       ${userFilter}
       ORDER BY a.created_at DESC
       LIMIT 10`
    ).bind(...userParam).all();

    return c.json({ activities: results || [] });
  } catch (error) {
    console.error('Get recent activities error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /dashboard/next-appointment - Prochain RDV
dashboard.get('/next-appointment', async (c) => {
  try {
    const user = getCurrentUser(c);

    const userFilter = user.role === 'admin' ? '' : 'WHERE t.user_id = ?';
    const userParam = user.role === 'admin' ? [] : [user.userId];

    const appointment = await c.env.DB.prepare(
      `SELECT t.*, l.full_name as lead_name, l.company as lead_company
       FROM tasks t
       LEFT JOIN leads l ON t.lead_id = l.id
       ${userFilter}
       ${userFilter ? 'AND' : 'WHERE'} t.due_at >= datetime('now')
       AND t.status != 'termine'
       ORDER BY t.due_at ASC
       LIMIT 1`
    ).bind(...userParam).first();

    return c.json({ appointment: appointment || null });
  } catch (error) {
    console.error('Get next appointment error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default dashboard;
