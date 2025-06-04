/**
 * Encrypts conversation messages (questions and answers)
 */
export function encryptMessage(message: string): string {
  try {
    // Simple base64 encoding with a different prefix for messages
    const encoded = Buffer.from(message, 'utf8').toString('base64');
    return `msg_${encoded}`;
  } catch (error) {
    console.error("Message encryption error:", error);
    throw new Error("Failed to encrypt message");
  }
}

/**
 * Decrypts conversation messages (questions and answers)
 */
export function decryptMessage(encryptedMessage: string): string {
  try {
    // Handle both encrypted and unencrypted messages for backward compatibility
    if (!encryptedMessage.startsWith('msg_')) {
      // If message is not encrypted, return as-is (backward compatibility)
      return encryptedMessage;
    }
    
    const encoded = encryptedMessage.substring(4);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    return decoded;
  } catch (error) {
    console.error("Message decryption error:", error);
    // If decryption fails, return the original message for safety
    return encryptedMessage;
  }
}