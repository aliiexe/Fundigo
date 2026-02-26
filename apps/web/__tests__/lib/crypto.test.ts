/**
 * Unit test skeleton for lib/crypto.ts
 * Run with: pnpm test
 */
import { encryptText, decryptText } from '@/lib/crypto';

describe('crypto', () => {
  beforeAll(() => {
    process.env.MASTER_ENC_KEY = Buffer.alloc(32, 'a').toString('base64');
  });

  it('encrypts and decrypts text round-trip', () => {
    const plain = 'sensitive merchant name';
    const { ciphertext, iv, tag } = encryptText(plain);
    expect(ciphertext).toBeTruthy();
    expect(iv).toBeTruthy();
    expect(tag).toBeTruthy();
    const dec = decryptText(ciphertext, iv, tag);
    expect(dec).toBe(plain);
  });

  it('throws when MASTER_ENC_KEY is missing', () => {
    const orig = process.env.MASTER_ENC_KEY;
    delete process.env.MASTER_ENC_KEY;
    expect(() => encryptText('x')).toThrow(/MASTER_ENC_KEY/);
    process.env.MASTER_ENC_KEY = orig;
  });
});
