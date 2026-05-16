#!/usr/bin/env node
// scripts/import-and-scan.mjs
//
// 1. Vide leads / tasks / activities / scanner_reports du CRM (garde les users)
// 2. Importe les prospects du CSV Pharow dans la table leads
// 3. Lance un scan RGPD en masse sur les domaines extraits des emails
//
// Usage :
//   node scripts/import-and-scan.mjs <chemin-csv>

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WRANGLER = path.join(ROOT, 'node_modules', '.bin', 'wrangler');
const SCANNER = path.join('/Users/msdn-consulting/Documents/GitHub/rgpd-scanner');
const DB_NAME = 'crm-database';
const USER_ID = 4; // Youssef Msalla (admin)
const CONCURRENCY = 3; // scans Puppeteer en parallèle max

// Domaines email génériques à ignorer pour le scan site
const GENERIC_DOMAINS = new Set([
  'gmail.com','yahoo.fr','yahoo.com','hotmail.com','hotmail.fr',
  'outlook.com','outlook.fr','orange.fr','free.fr','sfr.fr',
  'laposte.net','wanadoo.fr','live.fr','live.com','icloud.com',
  'protonmail.com','me.com','msn.com','bbox.fr','numericable.fr',
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function wranglerExec(sql) {
  const cmd = `CLOUDFLARE_API_TOKEN=9ZQJ5c-8-lffneNRoxsw5U0QnSJgvSkMW1zuL46m \
    node ${WRANGLER} d1 execute ${DB_NAME} --remote --command ${JSON.stringify(sql)} 2>&1`;
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
}

function wranglerFile(filePath) {
  const cmd = `CLOUDFLARE_API_TOKEN=9ZQJ5c-8-lffneNRoxsw5U0QnSJgvSkMW1zuL46m \
    node ${WRANGLER} d1 execute ${DB_NAME} --remote --file ${filePath} 2>&1`;
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 });
}

// Parse CSV naïf (respecte les guillemets doubles)
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
  const result = [];
  let inQuote = false, cur = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

function domainFromEmail(email) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1].toLowerCase().trim();
  if (GENERIC_DOMAINS.has(domain)) return null;
  return domain;
}

// ── Scan runner ──────────────────────────────────────────────────────────────

function runScan(url, companyName, naf) {
  return new Promise((resolve) => {
    const args = [
      path.join(SCANNER, 'bin', 'scan.js'),
      url,
      '--company', companyName || '',
    ];
    if (naf) args.push('--naf', naf);

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
    proc.on('close', (code) => resolve({ url, code, out }));
    proc.on('error', (err) => resolve({ url, code: -1, out: err.message }));

    // Timeout 90s par scan
    setTimeout(() => { proc.kill(); resolve({ url, code: -1, out: 'TIMEOUT' }); }, 90_000);
  });
}

async function runScansWithConcurrency(tasks, concurrency) {
  let idx = 0;
  let done = 0;
  const total = tasks.length;

  async function worker() {
    while (idx < total) {
      const task = tasks[idx++];
      process.stdout.write(`  [${done + 1}/${total}] Scan ${task.url} ...`);
      const result = await runScan(task.url, task.company, task.naf);
      done++;
      if (result.code === 0) {
        console.log(' ✓');
      } else {
        console.log(` ✗ (code ${result.code})`);
        if (result.out.includes('TIMEOUT')) console.log('    → Timeout 90s');
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/import-and-scan.mjs <chemin-csv>');
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(csvContent).filter(r => r['Nom commercial'] || r['Nom']);
console.log(`\n📋 ${rows.length} prospects trouvés dans le CSV`);

// ─── ÉTAPE 1 : Nettoyage ────────────────────────────────────────────────────
console.log('\n🗑  Étape 1 — Nettoyage de la base CRM...');
try {
  wranglerExec('DELETE FROM scanner_reports;');
  console.log('  scanner_reports → vidé');
  wranglerExec('DELETE FROM activities;');
  console.log('  activities → vidé');
  wranglerExec('DELETE FROM tasks;');
  console.log('  tasks → vidé');
  wranglerExec('DELETE FROM leads;');
  console.log('  leads → vidé');
  wranglerExec("DELETE FROM sqlite_sequence WHERE name IN ('leads','tasks','activities','scanner_reports');");
  console.log('  séquences → remises à zéro');
} catch (e) {
  console.error('Erreur nettoyage:', e.message);
  process.exit(1);
}

// ─── ÉTAPE 2 : Import leads ─────────────────────────────────────────────────
console.log('\n📥 Étape 2 — Import des prospects...');

// D1 supporte max ~100 statements par fichier → on splitte en chunks
const CHUNK = 50;
let totalInserted = 0;

for (let start = 0; start < rows.length; start += CHUNK) {
  const chunk = rows.slice(start, start + CHUNK);
  const stmts = chunk.map(r => {
    const firstName = r['Prénom'] || '';
    const lastName  = r['Nom'] || '';
    const fullName  = [firstName, lastName].filter(Boolean).join(' ');
    const email     = r['Email'] || '';
    const phone     = r['Tél portable'] || r['Tél standard'] || '';
    const company   = r['Nom commercial'] || r['Nom légal'] || '';
    const position  = r['Poste occupé'] || '';
    const secteurNaf = r['Secteur NAF'] || '';
    const activite  = r['Activité source Pharow'] || '';
    const effectif  = r['Tranche d\'effectif corrigée'] || r['Effectif réel'] || '';
    const nomLegal  = r['Nom légal'] || '';
    const emailGen  = r['Email générique'] || '';
    const reliability = r['Fiabilité de l\'email'] || '';

    // website_url depuis domaine email
    const domain = domainFromEmail(email);
    const websiteUrl = domain ? `https://${domain}` : null;

    // tags JSON
    const tags = [];
    if (activite) tags.push(activite);
    if (effectif) tags.push(effectif);
    if (reliability) tags.push(`Email ${reliability}`);
    const tagsJson = JSON.stringify(tags);

    // notes
    const notesParts = [];
    if (nomLegal && nomLegal !== company) notesParts.push(`Nom légal : ${nomLegal}`);
    if (emailGen && emailGen !== email) notesParts.push(`Email générique : ${emailGen}`);
    if (r['Tél standard'] && r['Tél standard'] !== phone) notesParts.push(`Tél standard : ${r['Tél standard']}`);
    if (secteurNaf) notesParts.push(`Secteur : ${secteurNaf}`);
    const notes = notesParts.join(' | ') || null;

    return `INSERT INTO leads (user_id, first_name, last_name, full_name, email, phone, company, position, status, source, tags, notes, website_url) VALUES (${USER_ID}, ${esc(firstName)}, ${esc(lastName)}, ${esc(fullName)}, ${esc(email)}, ${esc(phone)}, ${esc(company)}, ${esc(position)}, 'nouveau', 'pharow', ${esc(tagsJson)}, ${esc(notes)}, ${esc(websiteUrl)});`;
  });

  const sql = stmts.join('\n');
  const tmpFile = path.join('/tmp', `crm-import-${start}.sql`);
  fs.writeFileSync(tmpFile, sql);

  try {
    wranglerFile(tmpFile);
    totalInserted += chunk.length;
    process.stdout.write(`  ${totalInserted}/${rows.length} leads insérés\r`);
  } catch (e) {
    console.error(`\n  Erreur chunk ${start}-${start + CHUNK}:`, e.message.slice(0, 200));
  } finally {
    fs.unlinkSync(tmpFile);
  }
}
console.log(`\n  ✓ ${totalInserted} leads importés`);

// ─── ÉTAPE 3 : Scan en masse ─────────────────────────────────────────────────
console.log('\n🔍 Étape 3 — Scan RGPD en masse...');

// Déduplication par domaine
const seen = new Set();
const scanTasks = [];

for (const r of rows) {
  const email = r['Email'] || '';
  const domain = domainFromEmail(email);
  if (!domain || seen.has(domain)) continue;
  seen.add(domain);

  scanTasks.push({
    url: `https://${domain}`,
    company: r['Nom commercial'] || r['Nom légal'] || '',
    naf: null,
  });
}

console.log(`  ${scanTasks.length} domaines uniques à scanner (${CONCURRENCY} en parallèle)`);
console.log(`  Les résultats sont poussés automatiquement vers le CRM via crm-push.js\n`);

await runScansWithConcurrency(scanTasks, CONCURRENCY);

console.log('\n✅ Import + scan terminés !');
console.log(`   • ${totalInserted} leads dans le CRM`);
console.log(`   • ${scanTasks.length} scans lancés → résultats dans scanner_reports`);
