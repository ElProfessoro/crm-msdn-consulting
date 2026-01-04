// ============================================
// Middleware d'authentification
// ============================================

import { Context } from 'hono';
import { verifyJWT } from '../utils/jwt';
import type { Env, JWTPayload } from '../types';

// Étendre le contexte Hono avec l'utilisateur
export interface AuthContext {
  user: JWTPayload;
}

// Middleware pour vérifier l'authentification
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Function) {
  const authHeader = c.req.header('Authorization');
  const cookieToken = await c.req.header('Cookie')?.split(';')
    .find(cookie => cookie.trim().startsWith('token='))
    ?.split('=')[1];

  const token = authHeader?.replace('Bearer ', '') || cookieToken;

  if (!token) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ error: 'Token invalide ou expiré' }, 401);
  }

  // Ajouter l'utilisateur au contexte
  c.set('user', payload);

  await next();
}

// Middleware pour vérifier le rôle admin
export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Function) {
  const user = c.get('user') as JWTPayload;

  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Accès refusé - Admin uniquement' }, 403);
  }

  await next();
}

// Récupérer l'utilisateur courant depuis le contexte
export function getCurrentUser(c: Context): JWTPayload {
  return c.get('user') as JWTPayload;
}
