// Script pour créer un utilisateur admin
// Usage: node create-admin.js

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `$sha256$${hashHex}`;
}

async function main() {
  const email = 'msalla.youssef@gmail.com';
  const password = 'Rsk0405$?G6677';
  const firstName = 'Youssef';
  const lastName = 'Msalla';
  const role = 'admin';

  const passwordHash = await hashPassword(password);

  console.log('='.repeat(60));
  console.log('CREATION UTILISATEUR ADMINISTRATEUR');
  console.log('='.repeat(60));
  console.log('');
  console.log('Informations:');
  console.log(`  Email: ${email}`);
  console.log(`  Prénom: ${firstName}`);
  console.log(`  Nom: ${lastName}`);
  console.log(`  Rôle: ${role}`);
  console.log('');
  console.log('Hash du mot de passe:');
  console.log(`  ${passwordHash}`);
  console.log('');
  console.log('='.repeat(60));
  console.log('SQL à exécuter:');
  console.log('='.repeat(60));
  console.log('');
  console.log(`INSERT INTO users (email, password_hash, first_name, last_name, role)`);
  console.log(`VALUES ('${email}', '${passwordHash}', '${firstName}', '${lastName}', '${role}');`);
  console.log('');
  console.log('='.repeat(60));
  console.log('Commande Wrangler:');
  console.log('='.repeat(60));
  console.log('');
  console.log(`wrangler d1 execute <NOM_DATABASE> --remote --command="INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ('${email}', '${passwordHash}', '${firstName}', '${lastName}', '${role}');"`);
  console.log('');
}

main().catch(console.error);
