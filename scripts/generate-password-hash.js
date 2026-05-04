#!/usr/bin/env node
// ============================================
// Script pour générer un hash de mot de passe
// Usage: node generate-password-hash.js "votre-mot-de-passe"
// ============================================

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `$sha256$${hashHex}`;
}

async function generateStrongPassword() {
  // Générer un mot de passe fort aléatoire
  const length = 20;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  // S'assurer d'avoir au moins un de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Remplir le reste
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mélanger le mot de passe
  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
}

async function main() {
  const password = process.argv[2] || await generateStrongPassword();

  console.log('='.repeat(60));
  console.log('Génération de hash pour le CRM MSDN Consulting');
  console.log('='.repeat(60));
  console.log('');
  console.log('Mot de passe:', password);
  console.log('');

  const hash = await hashPassword(password);
  console.log('Hash SHA-256:', hash);
  console.log('');
  console.log('⚠️  IMPORTANT: Sauvegardez ce mot de passe en sécurité !');
  console.log('='.repeat(60));
}

main().catch(console.error);
