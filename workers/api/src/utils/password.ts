// ============================================
// Password Utils - Simple bcrypt-like avec Web Crypto API
// ============================================

// Hash un mot de passe
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Format simple : $sha256$hash
  return `$sha256$${hashHex}`;
}

// Vérifier un mot de passe
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}
