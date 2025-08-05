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
