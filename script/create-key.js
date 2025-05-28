const crypto = require('crypto');

// Generate a 32-byte (256-bit) random key
const key = crypto.randomBytes(32);

// You can store this key in your .env file
// as a hexadecimal string or a base64 string.

// To store as hex (64 characters):
console.log('Generated Key (hex):', key.toString('hex'));

// To store as base64 (44 characters, ending with '==' for 32 bytes):
console.log('Generated Key (base64):', key.toString('base64'));

// Example output for hex:
// Generated Key (hex): 8a2b5c6d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b

// Example output for base64:
// Generated Key (base64): qy+a8n4e5e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t8u9v+w==