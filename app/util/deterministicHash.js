const crypto = require('crypto');

function createDeterministicHash(value) {
    if (!value) return null;
    // Normalize the input (e.g., trim whitespace, convert to lowercase for email)
    const normalizedValue = String(value).trim().toLowerCase();
    return crypto.createHash('sha256').update(normalizedValue).digest('hex');
}

module.exports = { createDeterministicHash };