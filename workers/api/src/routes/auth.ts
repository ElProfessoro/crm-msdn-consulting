// ============================================
// Routes d'authentification
// ============================================

import { Hono } from 'hono';
import { createJWT } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import type { Env, User } from '../types';

const auth = new Hono<{ Bindings: Env }>();

// POST /auth/login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email et mot de passe requis' }, 400);
    }

    // Récupérer l'utilisateur
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first<User & { password_hash: string }>();

    if (!user) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    // Créer le JWT
    const token = await createJWT(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      c.env.JWT_SECRET
    );

    // Retourner l'utilisateur et le token
    const { password_hash, ...userWithoutPassword } = user;

    return c.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// POST /auth/register (pour créer de nouveaux comptes)
auth.post('/register', async (c) => {
  try {
    const { email, password, first_name, last_name, role } = await c.req.json();

    if (!email || !password || !first_name || !last_name) {
      return c.json({ error: 'Tous les champs sont requis' }, 400);
    }

    // Vérifier si l'email existe déjà
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ error: 'Cet email est déjà utilisé' }, 400);
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, email, first_name, last_name, role, created_at`
    ).bind(
      email,
      passwordHash,
      first_name,
      last_name,
      role || 'collaborateur'
    ).first<User>();

    if (!result) {
      return c.json({ error: 'Erreur lors de la création du compte' }, 500);
    }

    // Créer le JWT
    const token = await createJWT(
      {
        userId: result.id,
        email: result.email,
        role: result.role,
      },
      c.env.JWT_SECRET
    );

    return c.json({
      user: result,
      token,
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /auth/me (récupérer l'utilisateur courant)
// Note: Cette route nécessite l'authentification, le middleware est appliqué dans index.ts
auth.get('/me', async (c) => {
  try {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    // Récupérer les infos complètes
    const fullUser = await c.env.DB.prepare(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ?'
    ).bind(user.userId).first<User>();

    if (!fullUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    return c.json({ user: fullUser });
  } catch (error) {
    console.error('Get me error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default auth;
