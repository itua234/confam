import { Response } from 'express';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'; // Must be 32 characters
const IV_LENGTH = 16; // For AES, this is always 16
const FIXED_IV = Buffer.from('1234567890123456');
const ALGORITHM = 'aes-256-cbc'; 

export function encrypt(text: string): string {
    if (!text) return text;
    
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, FIXED_IV);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!text) return text;
    
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, FIXED_IV);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

const returnValidationError = (errors: any, res: Response, message: string) => {
    Object.keys(errors).forEach((key, index) => {
        errors[key] = errors[key]["message"];
    });

    return res.status(422).json({
        message: message,
        error: errors
    });
}

module.exports = {encrypt, decrypt, returnValidationError};