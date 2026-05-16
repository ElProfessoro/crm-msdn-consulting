#!/usr/bin/env node
// scripts/scan-only.mjs
// Scan RGPD en masse des domaines du CSV — reprend là où import-and-scan.mjs s'est arrêté
// Usage : node scripts/scan-only.mjs <chemin-csv>

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCANNER = '/Users/msdn-consulting/Documents/GitHub/rgpd-scanner';
const CONCURRENCY = 3;
const LOG_FILE = path.join(__dirname, '..', 'scan-mass.log');

const GENERIC_DOMAINS = new Set([
  'gmail.com','yahoo.fr','yahoo.com','hotmail.com','hotmail.fr',
  'outlook.com','outlook.fr','orange.fr','free.fr','sfr.fr',
  'laposte.net','wanadoo.fr','icloud.com','protonmail.com','me.com',
  'msn.com','live.fr','live.com','bbox.fr','numericable.fr',
]);

function parseCsv(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = parseRow(lines[0]);
  return lines.slice(1).map(l => {
    const vals = parseRow(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}
function parseRow(line) {
  const result = []; let inQuote = false, cur = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}
function domainFromEmail(email) {
  if (!email || !email.includes('@')) return null;
  const d = email.split('@')[1].toLowerCase().trim();
  return GENERIC_DOMAINS.has(d) ? null : d;
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function runScan(url, company) {
  return new Promise((resolve) => {
    const args = [path.join(SCANNER, 'bin', 'scan.js'), url, '--company', company || ''];
    const env = {
      ...process.env,
      CRM_API_URL: 'https://crm-api.msalla-youssef.workers.dev',
      CRM_API_KEY: 'msdn-scanner-2026-rgpd',
      CLOUDFLARE_API_TOKEN: '9ZQJ5c-8-lffneNRoxsw5U0QnSJgvSkMW1zuL46m',
    };
    const proc = spawn('node', args, { cwd: SCANNER, env, stdio: 'pipe' });
    let out = '';
    proc.stdout.on('data', d => { out += d; });
    proc.stderr.on('data', d => { out += d; });
    proc.on('close', code => resolve({ url, code, out }));
    proc.on('error', err => resolve({ url, code: -1, out: err.message }));
    setTimeout(() => { try { proc.kill(); } catch {} resolve({ url, code: -1, out: 'TIMEOUT' }); }, 90_000);
  });
}

async function runPool(tasks, concurrency) {
  let idx = 0; let done = 0; const total = tasks.length;
  async function worker() {
    while (idx < total) {
      const task = tasks[idx++];
      const n = ++done;
      log(`[${n}/${total}] ${task.url} → en cours...`);
      const res = await runScan(task.url, task.company);
      if (res.code === 0) log(`[${n}/${total}] ${task.url} → ✓ OK`);
      else log(`[${n}/${total}] ${task.url} → ✗ code=${res.code} ${res.out.includes('TIMEOUT') ? 'TIMEOUT' : ''}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

// ── Main ──────────────────────────────────────────────────────────────────────
const csvPath = process.argv[2];
if (!csvPath) { console.error('Usage: node scripts/scan-only.mjs <csv>'); process.exit(1); }

fs.writeFileSync(LOG_FILE, `=== Scan en masse démarré ${new Date().toISOString()} ===\n`);

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8')).filter(r => r['Nom commercial'] || r['Nom']);

const seen = new Set();
const tasks = [];
for (const r of rows) {
  const domain = domainFromEmail(r['Email'] || '');
  if (!domain || seen.has(domain)) continue;
  seen.add(domain);
  tasks.push({ url: `https://${domain}`, company: r['Nom commercial'] || r['Nom légal'] || '' });
}

log(`${tasks.length} domaines uniques à scanner (${CONCURRENCY} en parallèle)`);
log(`Log complet → ${LOG_FILE}`);

await runPool(tasks, CONCURRENCY);
log(`=== Terminé — ${tasks.length} scans effectués ===`);
