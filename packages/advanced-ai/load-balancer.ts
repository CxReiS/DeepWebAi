/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { encrypt } from "./encryption";
import { sql } from "../shared-types";

interface EncryptedKey {
  data: string;
  iv: string;
}

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
    throw new Error('Key rotation not implemented yet');
  }
}
