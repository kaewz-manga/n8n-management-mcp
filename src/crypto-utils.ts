/**
 * Cryptographic Utilities for SaaS Platform
 * Uses Web Crypto API (available in Cloudflare Workers)
 */

// ============================================
// Password Hashing (PBKDF2)
// ============================================

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  // Combine salt + hash and encode as base64
  const combined = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  combined.set(salt);
  combined.set(new Uint8Array(hash), SALT_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();

  // Decode stored hash
  const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
  const salt = combined.slice(0, SALT_LENGTH);
  const originalHash = combined.slice(SALT_LENGTH);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const newHash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  // Constant-time comparison
  const newHashArray = new Uint8Array(newHash);
  if (originalHash.length !== newHashArray.length) return false;

  let result = 0;
  for (let i = 0; i < originalHash.length; i++) {
    result |= originalHash[i] ^ newHashArray[i];
  }

  return result === 0;
}

// ============================================
// JWT Token Generation/Verification
// ============================================

interface JWTPayload {
  sub: string; // user_id
  email: string;
  plan: string;
  is_admin?: number;
  iat: number;
  exp: number;
}

/**
 * Generate a JWT token
 */
export async function generateJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 24 * 60 * 60 // 24 hours default
): Promise<string> {
  const encoder = new TextEncoder();

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  const signatureB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${message}.${signatureB64}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const encoder = new TextEncoder();
    const parts = token.split('.');

    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(base64UrlDecode(signatureB64), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(message)
    );

    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadB64));

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================
// API Key Generation
// ============================================

/**
 * Generate a new API key
 * Returns both the key (to show user once) and hash (to store)
 */
export async function generateApiKey(): Promise<{ key: string; hash: string; prefix: string }> {
  // Generate 32 random bytes
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const keyBody = base64UrlEncode(String.fromCharCode(...randomBytes));
  const key = `n2f_${keyBody}`;
  const prefix = key.substring(0, 11); // "n2f_" + 7 chars

  // Hash the key for storage
  const hash = await hashApiKey(key);

  return { key, hash, prefix };
}

/**
 * Hash an API key for storage/lookup
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(key));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================
// AES Encryption for n8n API Keys
// ============================================

const IV_LENGTH = 12;

/**
 * Encrypt sensitive data (e.g., n8n API key)
 */
export async function encrypt(plaintext: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();

  // Derive a key from the encryption key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('n8n-mcp-saas-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt sensitive data
 */
export async function decrypt(encrypted: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Derive the same key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('n8n-mcp-saas-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return decoder.decode(plaintext);
}

// ============================================
// UUID Generation
// ============================================

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

// ============================================
// Base64 URL Encoding/Decoding
// ============================================

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  // Add padding
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

// ============================================
// TOTP (Time-based One-Time Password)
// RFC 6238 compliant for Google Authenticator
// ============================================

const TOTP_PERIOD = 30; // 30 seconds
const TOTP_DIGITS = 6;
const TOTP_SECRET_LENGTH = 20; // 20 bytes = 160 bits

// Base32 alphabet (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a random TOTP secret (20 bytes, base32 encoded)
 */
export function generateTOTPSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOTP_SECRET_LENGTH));
  return base32Encode(bytes);
}

/**
 * Generate otpauth:// URI for QR code
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = 'n8n Management MCP'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Verify a TOTP code
 * Allows 1 time step before and after for clock drift
 */
export async function verifyTOTP(secret: string, code: string, window: number = 1): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);

  // Check within window (current, past, future)
  for (let i = -window; i <= window; i++) {
    const expectedCode = await generateTOTPCode(secret, counter + i);
    if (constantTimeEqual(code, expectedCode)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a TOTP code for a given counter value
 */
async function generateTOTPCode(secret: string, counter: number): Promise<string> {
  // Decode base32 secret to bytes
  const secretBytes = base32Decode(secret);

  // Convert counter to 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  // HMAC-SHA1
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const hmac = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hmacBytes = new Uint8Array(hmac);

  // Dynamic truncation (RFC 4226)
  const offset = hmacBytes[19] & 0x0f;
  const binary =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

/**
 * Base32 encode bytes to string
 */
function base32Encode(bytes: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      result += BASE32_CHARS[(value >> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

/**
 * Base32 decode string to bytes
 */
function base32Decode(str: string): Uint8Array {
  str = str.toUpperCase().replace(/[^A-Z2-7]/g, '');

  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < str.length; i++) {
    const charIndex = BASE32_CHARS.indexOf(str[i]);
    if (charIndex === -1) continue;

    value = (value << 5) | charIndex;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
