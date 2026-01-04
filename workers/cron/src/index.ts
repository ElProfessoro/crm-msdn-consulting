// ============================================
// CRM MSDN Consulting - Cron Worker
// Alertes et notifications automatiques
// ============================================

interface Env {
  DB: D1Database;
  // Pour envoyer des emails, vous pourriez utiliser:
  // - Cloudflare Email Routing (gratuit)
  // - Mailchannels API (gratuit avec Workers)
  // - Ou simplement stocker les notifications en DB pour affichage UI
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  due_at: string;
  user_id: number;
  lead_id: number | null;
  notified: number;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron job started at:', new Date().toISOString());

    try {
      // Récupérer les tâches nécessitant une notification
      // 1. Tâches à échéance dans l'heure
      // 2. Tâches en retard non notifiées
      const { results: tasksToNotify } = await env.DB.prepare(
        `SELECT t.*, u.email, u.first_name, u.last_name
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         WHERE t.status != 'termine'
         AND t.notified = 0
         AND (
           -- Tâches qui arrivent à échéance dans l'heure
           (t.due_at BETWEEN datetime('now') AND datetime('now', '+1 hour'))
           OR
           -- Tâches déjà en retard
           t.due_at < datetime('now')
         )
         ORDER BY t.due_at ASC`
      ).all<Task & User>();

      console.log(`Found ${tasksToNotify?.length || 0} tasks to notify`);

      if (!tasksToNotify || tasksToNotify.length === 0) {
        return;
      }

      // Traiter chaque tâche
      for (const task of tasksToNotify) {
        const isOverdue = new Date(task.due_at) < new Date();
        const notificationType = isOverdue ? 'task_overdue' : 'task_due';

        // Créer la notification
        await env.DB.prepare(
          `INSERT INTO notifications (user_id, task_id, notification_type, title, message)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          task.user_id,
          task.id,
          notificationType,
          isOverdue ? `Tâche en retard : ${task.title}` : `Tâche à venir : ${task.title}`,
          task.description || 'Échéance proche'
        ).run();

        // Marquer la tâche comme notifiée
        await env.DB.prepare(
          'UPDATE tasks SET notified = 1 WHERE id = ?'
        ).bind(task.id).run();

        console.log(`Notification created for task ${task.id} (${notificationType})`);

        // OPTIONNEL: Envoyer un email
        // Vous pouvez intégrer ici l'envoi d'email via Mailchannels ou autre
        // await sendEmail(task.email, task.title, task.description);
      }

      // Nettoyer les anciennes notifications (> 30 jours)
      await env.DB.prepare(
        `DELETE FROM notifications
         WHERE created_at < datetime('now', '-30 days')`
      ).run();

      console.log('Cron job completed successfully');
    } catch (error) {
      console.error('Cron job error:', error);
      throw error;
    }
  },

  // Handler HTTP optionnel pour tester manuellement
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'POST' && new URL(request.url).pathname === '/trigger') {
      // Déclencher manuellement le cron
      await this.scheduled(
        { scheduledTime: Date.now(), cron: '*/15 * * * *' } as ScheduledEvent,
        env,
        {} as ExecutionContext
      );

      return new Response(JSON.stringify({ message: 'Cron triggered manually' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Cron Worker - Use POST /trigger to run manually', {
      status: 200,
    });
  },
};

// Fonction helper pour envoyer des emails (à implémenter)
// async function sendEmail(to: string, subject: string, body: string) {
//   // Utiliser Mailchannels, Resend, ou autre service compatible Workers
//   // Exemple avec Mailchannels (gratuit):
//   /*
//   const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       personalizations: [{ to: [{ email: to }] }],
//       from: { email: 'notifications@crm.msdn-consulting.fr' },
//       subject,
//       content: [{ type: 'text/plain', value: body }],
//     }),
//   });
//   return response.ok;
//   */
// }
