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

import { ethers } from "ethers";

export const verifySignature = (message: string, signature: string) => {
  const signerAddress = ethers.verifyMessage(message, signature);
  return signerAddress === process.env.WEB3_SIGNER_ADDRESS;
};

// .env Eklemeleri:
// const WEB3_SIGNER_ADDRESS="0x..."
// const WEB3_SIGNER_KEY_ENCRYPTED="kdf2-encrypted-key" # Üretimde HSM/kms kullanın
export const getSigner = () => {
  // HSM veya KMS ile anahtar yönetimi yapılmalı
  const privateKey = process.env.WEB3_SIGNER_KEY_ENCRYPTED; // Şifrelenmiş anahtar
  return new ethers.Wallet(privateKey || '');
};
