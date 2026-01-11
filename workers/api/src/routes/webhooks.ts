// ============================================
// Routes pour les webhooks RingOver
// ============================================

import { Hono } from 'hono';
import type { Env } from '../types';

const webhooks = new Hono<{ Bindings: Env }>();

// Webhook RingOver - Call Hangup (appel terminé)
webhooks.post('/ringover/call-hangup', async (c) => {
  try {
    const body = await c.req.json();

    // Vérifier l'authentification du webhook
    const authHeader = c.req.header('Authorization');
    // Note: La clé webhook devrait être configurée dans les variables d'environnement
    // Pour l'instant, on accepte toutes les requêtes (à sécuriser en production)

    console.log('Webhook call-hangup received:', JSON.stringify(body));

    const { event, data } = body;

    if (event !== 'hangup' || !data) {
      return c.json({ error: 'Invalid webhook event' }, 400);
    }

    const {
      call_id,
      channel_id,
      duration_in_seconds,
      record,
      direction,
      from_number,
      to_number,
      start_time,
      hangup_time
    } = data;

    // Trouver l'activité correspondante dans la base
    const activity = await c.env.DB.prepare(`
      SELECT id, lead_id FROM activities
      WHERE call_id = ? OR channel_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(String(call_id), String(channel_id)).first();

    if (activity) {
      // Mettre à jour l'activité avec les informations de fin d'appel
      await c.env.DB.prepare(`
        UPDATE activities
        SET
          call_duration = ?,
          call_status = 'ended',
          recording_url = ?,
          call_direction = ?,
          from_number = ?,
          to_number = ?,
          metadata = ?,
          description = ?
        WHERE id = ?
      `).bind(
        duration_in_seconds,
        record || null,
        direction,
        String(from_number),
        String(to_number),
        JSON.stringify({
          start_time,
          hangup_time,
          duration: duration_in_seconds
        }),
        `Appel ${direction === 'outbound' ? 'sortant' : 'entrant'} - Durée: ${Math.floor(duration_in_seconds / 60)}m ${duration_in_seconds % 60}s`,
        activity.id
      ).run();

      // Mettre à jour last_activity_at du lead
      if (activity.lead_id) {
        await c.env.DB.prepare(`
          UPDATE leads SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(activity.lead_id).run();
      }

      console.log(`Activity ${activity.id} updated with call hangup data`);
    } else {
      console.warn(`No activity found for call_id ${call_id} or channel_id ${channel_id}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error processing call hangup webhook:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Webhook RingOver - Call Record Available (enregistrement disponible)
webhooks.post('/ringover/call-record-available', async (c) => {
  try {
    const body = await c.req.json();

    console.log('Webhook call-record-available received:', JSON.stringify(body));

    const { event, data } = body;

    if (event !== 'record_available' || !data) {
      return c.json({ error: 'Invalid webhook event' }, 400);
    }

    const { call_id, record_link, record_duration } = data;

    // Trouver l'activité correspondante
    const activity = await c.env.DB.prepare(`
      SELECT id, lead_id, description FROM activities
      WHERE call_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(String(call_id)).first();

    if (activity) {
      // Mettre à jour avec le lien d'enregistrement
      await c.env.DB.prepare(`
        UPDATE activities
        SET recording_url = ?,
            description = ?
        WHERE id = ?
      `).bind(
        record_link,
        `${activity.description || 'Appel'} - Enregistrement disponible (${record_duration})`,
        activity.id
      ).run();

      console.log(`Activity ${activity.id} updated with recording link`);
    } else {
      console.warn(`No activity found for call_id ${call_id}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error processing call record available webhook:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Webhook RingOver - Call Answered (appel décroché)
webhooks.post('/ringover/call-answered', async (c) => {
  try {
    const body = await c.req.json();

    console.log('Webhook call-answered received:', JSON.stringify(body));

    const { event, data } = body;

    if (event !== 'answered' || !data) {
      return c.json({ error: 'Invalid webhook event' }, 400);
    }

    const { call_id, channel_id } = data;

    // Mettre à jour le statut de l'activité
    await c.env.DB.prepare(`
      UPDATE activities
      SET call_status = 'answered'
      WHERE call_id = ? OR channel_id = ?
    `).bind(String(call_id), String(channel_id)).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error processing call answered webhook:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Webhook RingOver - Call Missed (appel manqué)
webhooks.post('/ringover/call-missed', async (c) => {
  try {
    const body = await c.req.json();

    console.log('Webhook call-missed received:', JSON.stringify(body));

    const { event, data } = body;

    if (event !== 'missed' || !data) {
      return c.json({ error: 'Invalid webhook event' }, 400);
    }

    const { call_id, channel_id } = data;

    // Mettre à jour le statut de l'activité
    await c.env.DB.prepare(`
      UPDATE activities
      SET call_status = 'missed',
          description = 'Appel manqué'
      WHERE call_id = ? OR channel_id = ?
    `).bind(String(call_id), String(channel_id)).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error processing call missed webhook:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default webhooks;
