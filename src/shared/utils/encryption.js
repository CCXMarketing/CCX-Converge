/**
 * @fileoverview Encryption utility for Converge Integrations Module.
 * Provides AES-GCM encryption/decryption via Web Crypto API with base64 fallback.
 * Used to encrypt API keys before storing in Firestore.
 *
 * @module encryption
 * @requires VITE_ENCRYPTION_KEY environment variable (32-char hex string)
 */

const ENCRYPTION_KEY_HEX = import.meta.env.VITE_ENCRYPTION_KEY;

/**
 * Converts a hex string to a Uint8Array byte array.
 * @param {string} hex - Hex-encoded string (e.g., "a3f8b2c1...")
 * @returns {Uint8Array} Byte array representation
 * @throws {Error} If hex string has odd length or contains invalid characters
 */
function hexToBytes(hex) {
  if (!hex || hex.length % 2 !== 0) {
    throw new Error('Invalid hex string: must have even length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex character at position ${i}`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

/**
 * Converts a Uint8Array to a base64 string.
 * Uses btoa with fallback for environments without it.
 * @param {Uint8Array} bytes - Byte array to encode
 * @returns {string} Base64-encoded string
 */
function bytesToBase64(bytes) {
  try {
    const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    return btoa(binary);
  } catch {
    // Fallback: manual base64 encoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    const len = bytes.length;
    for (let i = 0; i < len; i += 3) {
      const a = bytes[i];
      const b = i + 1 < len ? bytes[i + 1] : 0;
      const c = i + 2 < len ? bytes[i + 2] : 0;
      result += chars[a >> 2];
      result += chars[((a & 3) << 4) | (b >> 4)];
      result += i + 1 < len ? chars[((b & 15) << 2) | (c >> 6)] : '=';
      result += i + 2 < len ? chars[c & 63] : '=';
    }
    return result;
  }
}

/**
 * Converts a base64 string to a Uint8Array.
 * Uses atob with fallback for environments without it.
 * @param {string} base64 - Base64-encoded string
 * @returns {Uint8Array} Decoded byte array
 */
function base64ToBytes(base64) {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    // Fallback: manual base64 decoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const cleanBase64 = base64.replace(/=+$/, '');
    const bytes = [];
    for (let i = 0; i < cleanBase64.length; i += 4) {
      const a = chars.indexOf(cleanBase64[i]);
      const b = chars.indexOf(cleanBase64[i + 1]);
      const c = i + 2 < cleanBase64.length ? chars.indexOf(cleanBase64[i + 2]) : 0;
      const d = i + 3 < cleanBase64.length ? chars.indexOf(cleanBase64[i + 3]) : 0;
      bytes.push((a << 2) | (b >> 4));
      if (i + 2 < cleanBase64.length) bytes.push(((b & 15) << 4) | (c >> 2));
      if (i + 3 < cleanBase64.length) bytes.push(((c & 3) << 6) | d);
    }
    return new Uint8Array(bytes);
  }
}

/**
 * Derives a CryptoKey from the hex encryption key for AES-GCM operations.
 * @returns {Promise<CryptoKey>} AES-GCM CryptoKey for encrypt/decrypt
 * @throws {Error} If VITE_ENCRYPTION_KEY is not set or Web Crypto API unavailable
 */
async function getEncryptionKey() {
  if (!ENCRYPTION_KEY_HEX) {
    throw new Error(
      'Encryption key not configured. Set VITE_ENCRYPTION_KEY in your .env file.'
    );
  }

  if (!window.crypto || !window.crypto.subtle) {
    throw new Error(
      'Web Crypto API is not available. Ensure you are using HTTPS or localhost.'
    );
  }

  const keyBytes = hexToBytes(ENCRYPTION_KEY_HEX);

  return await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 128 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-GCM.
 * Generates a random 12-byte IV for each encryption operation.
 * Output format: base64(IV + ciphertext)
 *
 * @param {string} text - Plaintext string to encrypt
 * @returns {Promise<string>} Base64-encoded encrypted string (IV prepended)
 * @throws {Error} If text is empty, encryption key is missing, or encryption fails
 *
 * @example
 * const encrypted = await encrypt('my-secret-api-key');
 * // Returns: "base64encodedstring..."
 */
export async function encrypt(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Encryption failed: text must be a non-empty string.');
  }

  try {
    const key = await getEncryptionKey();

    // Generate a random 12-byte initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encode plaintext to bytes
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);

    // Encrypt using AES-GCM
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    // Combine IV + ciphertext into a single array
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(iv.length + encryptedBytes.length);
    combined.set(iv, 0);
    combined.set(encryptedBytes, iv.length);

    // Return as base64 string
    return bytesToBase64(combined);
  } catch (error) {
    if (error.message.includes('Encryption key not configured') ||
        error.message.includes('Web Crypto API') ||
        error.message.includes('Encryption failed')) {
      throw error;
    }
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts an AES-GCM encrypted base64 string back to plaintext.
 * Expects input format: base64(IV + ciphertext) where IV is 12 bytes.
 *
 * @param {string} encryptedText - Base64-encoded encrypted string (IV prepended)
 * @returns {Promise<string>} Decrypted plaintext string
 * @throws {Error} If encryptedText is empty, key is missing, or decryption fails
 *
 * @example
 * const decrypted = await decrypt(encryptedString);
 * // Returns: "my-secret-api-key"
 */
export async function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Decryption failed: encryptedText must be a non-empty string.');
  }

  try {
    const key = await getEncryptionKey();

    // Decode base64 to bytes
    const combined = base64ToBytes(encryptedText);

    // Minimum length check: 12 bytes IV + at least 1 byte ciphertext + 16 bytes auth tag
    if (combined.length < 29) {
      throw new Error('Decryption failed: encrypted data is too short or corrupted.');
    }

    // Extract IV (first 12 bytes) and ciphertext (remainder)
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    // Decrypt using AES-GCM
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    // Decode bytes back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    if (error.message.includes('Encryption key not configured') ||
        error.message.includes('Web Crypto API') ||
        error.message.includes('Decryption failed')) {
      throw error;
    }
    throw new Error(`Decryption failed: ${error.message}`);
  }
}
