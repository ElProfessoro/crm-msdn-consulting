// ============================================
// Routes RingOver - Intégration téléphonie
// ============================================

import { Hono } from 'hono';
import { getCurrentUser } from '../middleware/auth';
import type { Env } from '../types';

const ringover = new Hono<{ Bindings: Env }>();

const RINGOVER_API_URL = 'https://public-api.ringover.com/v2';

// POST /ringover/call - Initier un appel via RingOver
ringover.post('/call', async (c) => {
  try {
    const user = getCurrentUser(c);
    const { to_number, lead_id } = await c.req.json();

    if (!to_number) {
      return c.json({ error: 'Le numéro de téléphone est requis' }, 400);
    }

    // Récupérer la clé API RingOver depuis les variables d'environnement
    const ringoverApiKey = c.env.RINGOVER_API_KEY;
    if (!ringoverApiKey) {
      return c.json({ error: 'Configuration RingOver manquante' }, 500);
    }

    // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
    const cleanNumber = to_number.replace(/[\s\-\(\)]/g, '');

    // Convertir au format international si nécessaire
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith('0')) {
      // Remplacer le 0 initial par +33 pour la France
      formattedNumber = '33' + cleanNumber.substring(1);
    } else if (cleanNumber.startsWith('+')) {
      formattedNumber = cleanNumber.substring(1);
    }

    // Appeler l'API RingOver pour initier le callback
    const ringoverResponse = await fetch(`${RINGOVER_API_URL}/callback`, {
      method: 'POST',
      headers: {
        'Authorization': ringoverApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_number: parseInt(formattedNumber),
        timeout: 45,
        device: 'ALL'
      }),
    });

    if (!ringoverResponse.ok) {
      const errorText = await ringoverResponse.text();
      console.error('RingOver API error:', errorText);
      return c.json({
        error: 'Erreur lors de l\'initiation de l\'appel',
        details: errorText
      }, ringoverResponse.status);
    }

    const ringoverData = await ringoverResponse.json();

    // Si lead_id est fourni, créer une activité
    if (lead_id) {
      await c.env.DB.prepare(
        `INSERT INTO activities (
          user_id, lead_id, activity_type, title, description,
          call_id, channel_id, call_status, call_direction, to_number, metadata
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        user.userId,
        lead_id,
        'call_made',
        'Appel initié via RingOver',
        `Appel vers ${to_number}`,
        String(ringoverData.call_id || ''),
        String(ringoverData.channel_id || ''),
        'ringing',
        'outbound',
        formattedNumber,
        JSON.stringify({
          to_number: formattedNumber,
          ringover_response: ringoverData
        })
      ).run();

      // Mettre à jour last_activity_at du lead
      await c.env.DB.prepare(
        'UPDATE leads SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(lead_id).run();
    }

    return c.json({
      success: true,
      message: 'Appel en cours d\'initiation',
      data: ringoverData
    }, 200);

  } catch (error) {
    console.error('Initiate call error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /ringover/calls - Récupérer l'historique des appels RingOver
ringover.get('/calls', async (c) => {
  try {
    const user = getCurrentUser(c);
    const { lead_id, start_date, end_date, limit } = c.req.query();

    const ringoverApiKey = c.env.RINGOVER_API_KEY;
    if (!ringoverApiKey) {
      return c.json({ error: 'Configuration RingOver manquante' }, 500);
    }

    // Construire les paramètres de requête
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (limit) params.append('limit_count', limit);

    // Récupérer l'historique des appels depuis RingOver
    const ringoverResponse = await fetch(
      `${RINGOVER_API_URL}/calls?${params.toString()}`,
      {
        headers: {
          'Authorization': ringoverApiKey,
        },
      }
    );

    if (!ringoverResponse.ok) {
      const errorText = await ringoverResponse.text();
      console.error('RingOver API error:', errorText);
      return c.json({ error: 'Erreur lors de la récupération de l\'historique' }, 500);
    }

    const callsData = await ringoverResponse.json();

    // Si lead_id est fourni, filtrer les appels pour ce lead
    if (lead_id) {
      // Récupérer le numéro de téléphone du lead
      const lead = await c.env.DB.prepare(
        'SELECT phone FROM leads WHERE id = ?'
      ).bind(lead_id).first<{ phone: string }>();

      if (lead && lead.phone) {
        const cleanLeadNumber = lead.phone.replace(/[\s\-\(\)]/g, '');
        // Filtrer les appels qui correspondent au numéro du lead
        const filteredCalls = callsData.calls?.filter((call: any) => {
          const toNumber = call.to_number?.toString() || '';
          const fromNumber = call.from_number?.toString() || '';
          return toNumber.includes(cleanLeadNumber) || fromNumber.includes(cleanLeadNumber);
        }) || [];

        return c.json({ calls: filteredCalls });
      }
    }

    return c.json(callsData);

  } catch (error) {
    console.error('Get calls error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default ringover;
