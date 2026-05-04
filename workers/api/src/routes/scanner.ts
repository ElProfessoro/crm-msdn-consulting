// ============================================
// Routes RGPD Scanner
// Reçoit les rapports de pré-audit depuis le CLI rgpd-scanner
// Auth : clé API statique (SCANNER_API_KEY) — pas de JWT
// ============================================

import { Hono } from 'hono';
import type { Env } from '../types';

const scanner = new Hono<{ Bindings: Env }>();

// Middleware : vérification de la clé API scanner
scanner.use('/*', async (c, next) => {
  const key = c.req.header('X-Scanner-Key') || c.req.query('key');
  if (!key || key !== c.env.SCANNER_API_KEY) {
    return c.json({ error: 'Clé API invalide' }, 401);
  }
  await next();
});

// POST /scanner-reports
// Reçoit un rapport depuis le CLI rgpd-scanner après un scan
scanner.post('/reports', async (c) => {
  try {
    const body = await c.req.json();
    const {
      domain, url, company_name, scanned_at, duration_ms, status,
      score, risk_level, findings_count,
      has_privacy_policy, has_consent_banner,
      cookies_count, trackers_count, missing_headers_count,
      findings_json, detected_saas, missing_headers,
    } = body;

    if (!domain || !url) {
      return c.json({ error: 'domain et url sont requis' }, 400);
    }

    // Chercher un lead correspondant par website_url ou par domaine dans l'email
    let leadId: number | null = null;

    // 1. Correspondance exacte sur website_url
    const leadByUrl = await c.env.DB.prepare(
      `SELECT id FROM leads WHERE website_url LIKE ? OR website_url LIKE ? LIMIT 1`
    ).bind(`%${domain}%`, `%${domain}%`).first<{ id: number }>();

    if (leadByUrl) {
      leadId = leadByUrl.id;
    } else {
      // 2. Correspondance sur le domaine email (ex: @akromeca.fr)
      const leadByEmail = await c.env.DB.prepare(
        `SELECT id FROM leads WHERE email LIKE ? LIMIT 1`
      ).bind(`%@${domain}`).first<{ id: number }>();
      if (leadByEmail) leadId = leadByEmail.id;
    }

    // Insérer le rapport
    const result = await c.env.DB.prepare(`
      INSERT INTO scanner_reports (
        lead_id, domain, url, company_name, scanned_at, duration_ms, status,
        score, risk_level, findings_count,
        has_privacy_policy, has_consent_banner,
        cookies_count, trackers_count, missing_headers_count,
        findings_json, detected_saas, missing_headers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      leadId,
      domain, url, company_name ?? null,
      scanned_at ?? new Date().toISOString(),
      duration_ms ?? null,
      status ?? 'completed',
      score ?? null, risk_level ?? null, findings_count ?? 0,
      has_privacy_policy ? 1 : 0, has_consent_banner ? 1 : 0,
      cookies_count ?? 0, trackers_count ?? 0, missing_headers_count ?? 0,
      findings_json ? JSON.stringify(findings_json) : null,
      detected_saas ? JSON.stringify(detected_saas) : null,
      missing_headers ? JSON.stringify(missing_headers) : null,
    ).run();

    // Si lead trouvé : créer une activité + mettre à jour website_url si manquant
    if (leadId) {
      const riskEmoji: Record<string, string> = {
        faible: '🟢', moyen: '🟡', eleve: '🟠', critique: '🔴',
      };
      const emoji = riskEmoji[risk_level ?? ''] ?? '⚪';
      await c.env.DB.prepare(`
        INSERT INTO activities (user_id, lead_id, activity_type, title, description, metadata)
        SELECT user_id, ?, 'scan_rgpd', ?, ?, ?
        FROM leads WHERE id = ?
      `).bind(
        leadId,
        `${emoji} Pré-audit RGPD — score ${score ?? '?'}/100 (${risk_level ?? 'inconnu'})`,
        `Scan automatisé de ${url} : ${findings_count ?? 0} finding(s). ` +
          `Politique de conf.: ${has_privacy_policy ? 'oui' : 'non'}, ` +
          `Bannière consentement: ${has_consent_banner ? 'oui' : 'non'}, ` +
          `Traceurs: ${trackers_count ?? 0}.`,
        JSON.stringify({ report_id: result.meta.last_row_id, score, risk_level }),
        leadId,
      ).run();

      // Mettre à jour website_url si vide
      await c.env.DB.prepare(
        `UPDATE leads SET website_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (website_url IS NULL OR website_url = '')`
      ).bind(url, leadId).run();
    }

    return c.json({
      success: true,
      report_id: result.meta.last_row_id,
      lead_id: leadId,
      lead_matched: leadId !== null,
    }, 201);
  } catch (err: any) {
    console.error('Scanner report error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// GET /scanner-reports/lead/:leadId
// Renvoie tous les scans d'un lead, du plus récent au plus ancien
scanner.get('/reports/lead/:leadId', async (c) => {
  try {
    const leadId = c.req.param('leadId');
    const reports = await c.env.DB.prepare(`
      SELECT id, domain, url, scanned_at, duration_ms, status,
             score, risk_level, findings_count,
             has_privacy_policy, has_consent_banner,
             cookies_count, trackers_count, missing_headers_count,
             detected_saas, missing_headers, created_at
      FROM scanner_reports
      WHERE lead_id = ?
      ORDER BY scanned_at DESC
    `).bind(leadId).all();

    return c.json({ reports: reports.results ?? [] });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /scanner-reports/lead/:leadId/latest
// Dernier scan uniquement, avec les findings complets
scanner.get('/reports/lead/:leadId/latest', async (c) => {
  try {
    const leadId = c.req.param('leadId');
    const report = await c.env.DB.prepare(`
      SELECT * FROM scanner_reports
      WHERE lead_id = ?
      ORDER BY scanned_at DESC
      LIMIT 1
    `).bind(leadId).first();

    if (!report) return c.json({ report: null });

    // Parser les champs JSON
    return c.json({
      report: {
        ...report,
        findings_json:   report.findings_json   ? JSON.parse(report.findings_json as string)   : [],
        detected_saas:   report.detected_saas   ? JSON.parse(report.detected_saas as string)   : [],
        missing_headers: report.missing_headers ? JSON.parse(report.missing_headers as string) : [],
      }
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /scanner-reports/domain/:domain/latest
// Dernier scan par domaine (utile si pas encore de lead)
scanner.get('/reports/domain/:domain/latest', async (c) => {
  try {
    const domain = c.req.param('domain');
    const report = await c.env.DB.prepare(`
      SELECT * FROM scanner_reports
      WHERE domain = ?
      ORDER BY scanned_at DESC
      LIMIT 1
    `).bind(domain).first();

    if (!report) return c.json({ report: null });

    return c.json({
      report: {
        ...report,
        findings_json:   report.findings_json   ? JSON.parse(report.findings_json as string)   : [],
        detected_saas:   report.detected_saas   ? JSON.parse(report.detected_saas as string)   : [],
        missing_headers: report.missing_headers ? JSON.parse(report.missing_headers as string) : [],
      }
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default scanner;
