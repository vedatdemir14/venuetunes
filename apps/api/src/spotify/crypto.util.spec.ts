import { randomBytes } from 'crypto';
import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from './crypto.util';

describe('crypto.util', () => {
  const key = randomBytes(32).toString('hex');

  it('şifreler ve geri çözer', () => {
    const secret = 'AQD-ornek-refresh-token-degeri-123';
    const enc = encryptSecret(secret, key);
    expect(enc).not.toContain(secret);
    expect(decryptSecret(enc, key)).toBe(secret);
  });

  it('her şifrelemede farklı çıktı üretir (rastgele IV)', () => {
    expect(encryptSecret('a', key)).not.toBe(encryptSecret('a', key));
  });

  it('yanlış anahtarla çözme hata fırlatır', () => {
    const enc = encryptSecret('gizli', key);
    const wrongKey = randomBytes(32).toString('hex');
    expect(() => decryptSecret(enc, wrongKey)).toThrow();
  });

  it('bozuk formatta hata fırlatır', () => {
    expect(() => decryptSecret('gecersiz', key)).toThrow('Geçersiz şifreli veri formatı');
  });
});
