import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateApiKey,
  hashApiKey,
  encrypt,
  decrypt,
  generateUUID,
} from '../src/crypto-utils';

describe('Crypto Utils', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('API Key Generation', () => {
    it('should generate API key with correct format', async () => {
      const { key, hash, prefix } = await generateApiKey();

      // API key format: saas_ + base64url encoded random bytes
      expect(key).toMatch(/^saas_[A-Za-z0-9_-]+$/);
      expect(key.length).toBeGreaterThan(20);
      expect(prefix).toBe(key.substring(0, 12));
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate unique keys', async () => {
      const key1 = await generateApiKey();
      const key2 = await generateApiKey();

      expect(key1.key).not.toBe(key2.key);
      expect(key1.hash).not.toBe(key2.hash);
    });

    it('should hash API key consistently', async () => {
      const { key } = await generateApiKey();
      const hash1 = await hashApiKey(key);
      const hash2 = await hashApiKey(key);

      expect(hash1).toBe(hash2);
    });
  });

  describe('Encryption/Decryption', () => {
    const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    it('should encrypt and decrypt text', async () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const plaintext = 'my-secret-api-key';
      const encrypted1 = await encrypt(plaintext, testKey);
      const encrypted2 = await encrypt(plaintext, testKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', async () => {
      const plaintext = '';
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', async () => {
      const plaintext = 'api-key-with-special-chars-!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = 'api-key-with-unicode-日本語-한국어-中文';
      const encrypted = await encrypt(plaintext, testKey);
      const decrypted = await decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('UUID Generation', () => {
    it('should generate valid UUID format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }

      expect(uuids.size).toBe(100);
    });
  });
});
