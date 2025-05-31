'use strict';
require('dotenv').config();
const crypto = require("crypto");
const {faker} = require("@faker-js/faker");
const { v4: uuidv4 } = require('uuid'); // Add this for UUID generation
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'; // Must be 32 characters
const IV_LENGTH = 16; // For AES, this is always 16
const FIXED_IV = Buffer.from('1234567890123456');
const algorithm = 'aes-256-gcm';

function encrypt(text) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Ensure key is a buffer
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    const customers = Array.from({ length: 5 }, () => ({
      //id: uuidv4(),
      id: faker.string.uuid(),
      token: uuidv4(),
      //phone: encrypt(faker.phone.number()),
      phone: encrypt("+2348114800769"),
      phone_verified_at: null,
      verified_at: new Date(),
      status: "pending",
      //status: faker.helpers.arrayElement(['VERIFIED', 'PENDING']),
      is_blacklisted: faker.datatype.boolean(),
      created_at: new Date(),
      updated_at: new Date(),
    }));
    return queryInterface.bulkInsert('customers', customers);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('customers', null, {});
  },
};

