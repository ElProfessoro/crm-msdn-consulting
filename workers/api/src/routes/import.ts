// ============================================
// Routes d'import CSV/Excel
// ============================================

import { Hono } from 'hono';
import { getCurrentUser } from '../middleware/auth';
import type { Env } from '../types';

const importRoutes = new Hono<{ Bindings: Env }>();

// POST /import/upload - Upload un fichier CSV
importRoutes.post('/upload', async (c) => {
  try {
    const user = getCurrentUser(c);
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }

    // Vérifier le type de fichier
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx?)$/i)) {
      return c.json({
        error: 'Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)'
      }, 400);
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'Fichier trop volumineux (max 5MB)' }, 400);
    }

    // Générer une clé unique pour R2
    const timestamp = Date.now();
    const r2Key = `imports/${user.userId}/${timestamp}_${file.name}`;

    // Upload vers R2
    await c.env.R2_BUCKET.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Créer l'enregistrement d'import
    const importRecord = await c.env.DB.prepare(
      `INSERT INTO imports (user_id, filename, r2_key, status)
       VALUES (?, ?, ?, 'processing')
       RETURNING *`
    ).bind(user.userId, file.name, r2Key).first();

    return c.json({
      import: importRecord,
      message: 'Fichier uploadé avec succès'
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Erreur lors de l\'upload' }, 500);
  }
});

// POST /import/:id/process - Traiter un import
importRoutes.post('/:id/process', async (c) => {
  try {
    const user = getCurrentUser(c);
    const importId = c.req.param('id');
    const { mapping } = await c.req.json();

    // Récupérer l'import
    const importRecord = await c.env.DB.prepare(
      'SELECT * FROM imports WHERE id = ? AND user_id = ?'
    ).bind(importId, user.userId).first<any>();

    if (!importRecord) {
      return c.json({ error: 'Import non trouvé' }, 404);
    }

    // Récupérer le fichier depuis R2
    const file = await c.env.R2_BUCKET.get(importRecord.r2_key);

    if (!file) {
      return c.json({ error: 'Fichier non trouvé dans le stockage' }, 404);
    }

    const content = await file.text();

    // Parser le CSV simple (pour l'instant, on assume du CSV)
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1);

    let imported = 0;
    let failed = 0;

    // Traiter chaque ligne
    for (const row of rows) {
      try {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const data: any = {};

        // Appliquer le mapping
        headers.forEach((header, index) => {
          const crmField = mapping[header];
          if (crmField && values[index]) {
            data[crmField] = values[index];
          }
        });

        // Vérifier qu'on a au moins un email
        if (!data.email) {
          failed++;
          continue;
        }

        // Vérifier si le lead existe déjà
        const existing = await c.env.DB.prepare(
          'SELECT id FROM leads WHERE email = ? AND user_id = ?'
        ).bind(data.email, user.userId).first();

        if (existing) {
          failed++;
          continue; // Ignorer les doublons
        }

        // Créer le lead
        await c.env.DB.prepare(
          `INSERT INTO leads (
            user_id, full_name, email, phone, company, position,
            status, source, last_activity_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'nouveau', 'import_csv', CURRENT_TIMESTAMP)`
        ).bind(
          user.userId,
          data.full_name || data.nom_complet || null,
          data.email,
          data.phone || data.telephone || null,
          data.company || data.entreprise || null,
          data.position || data.poste || null
        ).run();

        imported++;
      } catch (error) {
        console.error('Row import error:', error);
        failed++;
      }
    }

    // Mettre à jour l'import
    await c.env.DB.prepare(
      `UPDATE imports SET
        total_rows = ?,
        imported_rows = ?,
        failed_rows = ?,
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(rows.length, imported, failed, importId).run();

    return c.json({
      message: 'Import terminé',
      total: rows.length,
      imported,
      failed,
    });
  } catch (error) {
    console.error('Process import error:', error);

    // Marquer l'import comme échoué
    await c.env.DB.prepare(
      `UPDATE imports SET status = 'failed', error_message = ? WHERE id = ?`
    ).bind(String(error), c.req.param('id')).run();

    return c.json({ error: 'Erreur lors du traitement' }, 500);
  }
});

// GET /import/history - Historique des imports
importRoutes.get('/history', async (c) => {
  try {
    const user = getCurrentUser(c);

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM imports WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(user.userId).all();

    return c.json({ imports: results || [] });
  } catch (error) {
    console.error('Get import history error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default importRoutes;
