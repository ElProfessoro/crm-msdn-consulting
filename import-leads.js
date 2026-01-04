// Script pour importer les leads CSV dans la base de données D1
// Usage: node import-leads.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const LEADS_FOLDER = './Leads';
const USER_ID = 4; // ID de l'utilisateur Youssef Msalla
const DATABASE_NAME = 'crm-database';

// Fonction pour échapper les apostrophes dans les chaînes SQL
function escapeSql(str) {
  if (!str) return '';
  return str.toString().replace(/'/g, "''");
}

// Fonction pour parser une ligne CSV avec gestion des guillemets
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Fonction pour parser un fichier CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Fonction pour mapper les données CSV vers le schéma de la base de données
function mapLeadData(csvRow, source) {
  const firstName = csvRow['Prénom'] || '';
  const lastName = csvRow['Nom'] || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    user_id: USER_ID,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName || null,
    email: csvRow['Email'] || csvRow['Email générique'] || null,
    phone: csvRow['Tél portable'] || csvRow['Tél standard'] || null,
    company: csvRow['Nom commercial'] || csvRow['Nom légal'] || null,
    position: csvRow['Poste occupé'] || null,
    linkedin_url: csvRow['URL LinkedIn du prospect'] || null,
    status: 'nouveau',
    tags: JSON.stringify([
      csvRow['Activité source Pharow'] || '',
      csvRow['Secteur NAF'] || '',
      csvRow['Nom de la liste Pharow'] || ''
    ].filter(t => t)),
    notes: [
      csvRow['Description issue du site internet'] || '',
      csvRow['Adresse du siège complète'] ? `Adresse: ${csvRow['Adresse du siège complète']}` : '',
      csvRow['Effectif réel'] ? `Effectif: ${csvRow['Effectif réel']}` : '',
      csvRow['Tranche d\'effectif corrigée'] ? `Tranche: ${csvRow['Tranche d\'effectif corrigée']}` : '',
      csvRow['Chiffre d\'affaires en euros'] ? `CA: ${csvRow['Chiffre d\'affaires en euros']}€` : '',
      csvRow['URL du site internet'] ? `Site: ${csvRow['URL du site internet']}` : '',
      csvRow['URL de la page LinkedIn'] ? `LinkedIn Entreprise: ${csvRow['URL de la page LinkedIn']}` : '',
      csvRow['SIREN'] ? `SIREN: ${csvRow['SIREN']}` : '',
    ].filter(n => n).join('\n'),
    source: source
  };
}

// Fonction pour générer l'INSERT SQL
function generateInsertSQL(lead) {
  return `INSERT INTO leads (
    user_id, first_name, last_name, full_name, email, phone,
    company, position, linkedin_url, status, tags, notes, source
  ) VALUES (
    ${lead.user_id},
    '${escapeSql(lead.first_name)}',
    '${escapeSql(lead.last_name)}',
    ${lead.full_name ? "'" + escapeSql(lead.full_name) + "'" : 'NULL'},
    ${lead.email ? "'" + escapeSql(lead.email) + "'" : 'NULL'},
    ${lead.phone ? "'" + escapeSql(lead.phone) + "'" : 'NULL'},
    ${lead.company ? "'" + escapeSql(lead.company) + "'" : 'NULL'},
    ${lead.position ? "'" + escapeSql(lead.position) + "'" : 'NULL'},
    ${lead.linkedin_url ? "'" + escapeSql(lead.linkedin_url) + "'" : 'NULL'},
    '${lead.status}',
    '${escapeSql(lead.tags)}',
    ${lead.notes ? "'" + escapeSql(lead.notes) + "'" : 'NULL'},
    '${escapeSql(lead.source)}'
  );`;
}

// Fonction principale
async function main() {
  console.log('='.repeat(80));
  console.log('IMPORT DES LEADS CSV DANS LA BASE DE DONNÉES');
  console.log('='.repeat(80));
  console.log('');

  // Lire les fichiers CSV
  const csvFiles = fs.readdirSync(LEADS_FOLDER)
    .filter(file => file.endsWith('.csv'))
    .map(file => path.join(LEADS_FOLDER, file));

  console.log(`📁 Fichiers CSV trouvés: ${csvFiles.length}`);
  csvFiles.forEach(file => console.log(`   - ${path.basename(file)}`));
  console.log('');

  let allLeads = [];
  let stats = {};

  // Parser chaque fichier
  for (const csvFile of csvFiles) {
    const fileName = path.basename(csvFile);
    console.log(`📖 Lecture de ${fileName}...`);

    const rows = parseCSV(csvFile);
    console.log(`   ✅ ${rows.length} lignes trouvées`);

    const leads = rows.map(row => mapLeadData(row, fileName));
    allLeads.push(...leads);
    stats[fileName] = leads.length;
  }

  console.log('');
  console.log('📊 Statistiques:');
  Object.entries(stats).forEach(([file, count]) => {
    console.log(`   - ${file}: ${count} leads`);
  });
  console.log(`   📍 TOTAL: ${allLeads.length} leads`);
  console.log('');

  // Générer le fichier SQL
  const sqlFile = './schema/004_import_pharow_leads.sql';
  console.log(`📝 Génération du fichier SQL: ${sqlFile}`);

  let sqlContent = `-- ============================================
-- Import des leads Pharow
-- Total: ${allLeads.length} leads
-- Assigné à: Youssef Msalla (user_id: ${USER_ID})
-- Généré le: ${new Date().toISOString()}
-- ============================================

`;

  // Générer les INSERT statements par batch de 50 pour éviter les requêtes trop longues
  const batchSize = 50;
  for (let i = 0; i < allLeads.length; i += batchSize) {
    const batch = allLeads.slice(i, i + batchSize);
    sqlContent += `-- Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allLeads.length / batchSize)} (${batch.length} leads)\n`;
    batch.forEach(lead => {
      sqlContent += generateInsertSQL(lead) + '\n';
    });
    sqlContent += '\n';
  }

  fs.writeFileSync(sqlFile, sqlContent, 'utf8');
  console.log(`   ✅ Fichier SQL généré avec succès`);
  console.log('');

  // Afficher quelques exemples de leads
  console.log('📋 Exemples de leads:');
  allLeads.slice(0, 3).forEach((lead, i) => {
    console.log(`\n   Lead ${i + 1}:`);
    console.log(`   - Nom: ${lead.full_name}`);
    console.log(`   - Email: ${lead.email || 'N/A'}`);
    console.log(`   - Téléphone: ${lead.phone || 'N/A'}`);
    console.log(`   - Entreprise: ${lead.company || 'N/A'}`);
    console.log(`   - Poste: ${lead.position || 'N/A'}`);
  });
  console.log('');

  // Proposer d'exécuter l'import
  console.log('='.repeat(80));
  console.log('PRÊT POUR L\'IMPORT');
  console.log('='.repeat(80));
  console.log('');
  console.log('Pour importer les leads dans la base de données, exécutez:');
  console.log('');
  console.log(`  npx wrangler d1 execute ${DATABASE_NAME} --remote --file=${sqlFile}`);
  console.log('');
  console.log('Ou pour tester en local d\'abord:');
  console.log('');
  console.log(`  npx wrangler d1 execute ${DATABASE_NAME} --local --file=${sqlFile}`);
  console.log('');
  console.log('='.repeat(80));
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
