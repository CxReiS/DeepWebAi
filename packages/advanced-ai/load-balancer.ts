import { encrypt, decrypt } from "./encryption";

export class APIKeyManager {
  private keys = new Map<string, EncryptedKey>();

  async addKey(provider: string, key: string, userId: string) {
    // Kullanıcı başına şifrelenmiş key storage
    const encrypted = await encrypt(key, userId);
    this.keys.set(`${userId}:${provider}`, encrypted);

    // Neon DB'ye kaydet
    await sql`
      INSERT INTO api_keys (user_id, provider, encrypted_key)
      VALUES (${userId}, ${provider}, ${encrypted})
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET encrypted_key = ${encrypted}
    `;
  }

  async rotateKeys() {
    // Otomatik key rotation için cron job
  }
}
