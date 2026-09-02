import CryptoJS from 'crypto-js';

// Using a simplified E2EE simulation for prototyping
// In a real app, this would use public/private key pairs (RSA/ECC) to exchange an AES key
// Here, we simulate it by using a deterministic key based on participant UIDs.
// This is for demonstration of "Encrypted" functionality on the client side.

const getSharedSecret = (uid1: string, uid2: string) => {
  const sorted = [uid1, uid2].sort().join(':');
  // Hash to create a consistent AES key for this pair
  return CryptoJS.SHA256(sorted).toString();
};

export const encryptMessage = (text: string, currentUid: string, otherUid: string): string => {
  if (!text) return text;
  try {
    const key = getSharedSecret(currentUid, otherUid);
    return CryptoJS.AES.encrypt(text, key).toString();
  } catch (e) {
    console.error("Encryption failed", e);
    return text;
  }
};

export const decryptMessage = (ciphertext: string, currentUid: string, otherUid: string): string => {
  if (!ciphertext) return ciphertext;
  try {
    const key = getSharedSecret(currentUid, otherUid);
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || ciphertext; // return ciphertext if decryption fails
  } catch (e) {
    console.error("Decryption failed", e);
    return ciphertext;
  }
};
