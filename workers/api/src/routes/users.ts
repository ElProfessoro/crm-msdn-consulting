// ============================================
// Routes de gestion des utilisateurs
// ============================================

import { Hono } from 'hono';
import { getCurrentUser } from '../middleware/auth';
import type { Env, User } from '../types';

const users = new Hono<{ Bindings: Env }>();

// GET /users - Liste des utilisateurs (pour les admins)
users.get('/', async (c) => {
  try {
    const user = getCurrentUser(c);

    // Seuls les admins peuvent lister tous les utilisateurs
    if (user.role !== 'admin') {
      return c.json({ error: 'Accès refusé' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY first_name, last_name'
    ).all<User>();

    return c.json({ users: results || [] });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default users;
