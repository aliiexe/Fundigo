/**
 * Server-side AES-256-GCM encryption for sensitive text fields.
 * SECURITY: MASTER_ENC_KEY must be 32 bytes (base64). Never expose to client.
 * TODO: KMS integration for production — e.g. HashiCorp Vault.
 * Generate key: openssl rand -base64 32
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const raw = process.env.MASTER_ENC_KEY;
  if (!raw || raw.length < 32) {
    throw new Error(
      'MASTER_ENC_KEY is missing or invalid. Set a 32+ char base64 key. Generate with: openssl rand -base64 32'
    );
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`MASTER_ENC_KEY must decode to exactly ${KEY_LENGTH} bytes.`);
  }
  return buf;
}

export function encryptText(plain: string): { ciphertext: string; iv: string; tag: string } {
  const key = getKey();
  const iv = Buffer.alloc(IV_LENGTH);
  require('crypto').randomFillSync(iv);
  const cipher = require('crypto').createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptText(ciphertext: string, iv: string, tag: string): string {
  const key = getKey();
  const decipher = require('crypto').createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64'),
    { authTagLength: TAG_LENGTH }
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return decipher.update(Buffer.from(ciphertext, 'base64'), undefined, 'utf8') + decipher.final('utf8');
}
