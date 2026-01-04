// ============================================
// CRM MSDN Consulting - API Worker
// Point d'entrée principal
// ============================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './middleware/auth';
import type { Env } from './types';

// Routes
import auth from './routes/auth';
import leads from './routes/leads';
import tasks from './routes/tasks';
import dashboard from './routes/dashboard';
import importRoutes from './routes/import';
import users from './routes/users';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('/*', cors({
  origin: '*', // En production, spécifier le domaine exact
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'crm-api' });
});

// Routes protégées - appliquer les middlewares AVANT les routes
app.use('/auth/me', requireAuth); // Protéger /auth/me
app.use('/leads/*', requireAuth);
app.use('/tasks/*', requireAuth);
app.use('/dashboard/*', requireAuth);
app.use('/import/*', requireAuth);
app.use('/users/*', requireAuth);

// Routes
app.route('/auth', auth);
app.route('/leads', leads);
app.route('/tasks', tasks);
app.route('/dashboard', dashboard);
app.route('/import', importRoutes);
app.route('/users', users);

// 404
app.notFound((c) => {
  return c.json({ error: 'Route non trouvée' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Erreur interne du serveur' }, 500);
});

export default app;
