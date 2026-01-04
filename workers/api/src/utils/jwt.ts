// ============================================
// JWT Utils - Simple implementation
// Pas de dépendance externe
// ============================================

import type { JWTPayload } from '../types';

// Encode base64url
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Decode base64url
function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

// Sign JWT avec HMAC-SHA256
async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
}

// Créer un JWT
export async function createJWT(
  payload: JWTPayload,
  secret: string,
  expiresIn: number = 7 * 24 * 60 * 60 // 7 jours par défaut
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(fullPayload));
  const message = `${headerEncoded}.${payloadEncoded}`;
  const signature = await sign(message, secret);

  return `${message}.${signature}`;
}

// Vérifier un JWT
export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signature] = parts;
    const message = `${headerEncoded}.${payloadEncoded}`;

    // Vérifier signature
    const expectedSignature = await sign(message, secret);
    if (signature !== expectedSignature) return null;

    // Décoder payload
    const payload = JSON.parse(base64urlDecode(payloadEncoded)) as JWTPayload;

    // Vérifier expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
