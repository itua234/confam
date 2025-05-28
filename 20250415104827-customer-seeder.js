'use strict';
require('dotenv').config();
const crypto = require("crypto");
const {faker} = require("@faker-js/faker");
const { v4: uuidv4 } = require('uuid'); // Add this for UUID generation
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'; // Must be 32 characters
const IV_LENGTH = 16; // For AES, this is always 16
const FIXED_IV = Buffer.from('1234567890123456');
const ALGORITHM = 'aes-256-cbc'; 

function encrypt(text) {
  if (!text) return text;
  
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, FIXED_IV);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    const customers = Array.from({ length: 5 }, () => ({
      //id: uuidv4(),
      id: faker.string.uuid(),
      phone: encrypt(faker.phone.number()),
      phone_verified_at: null,
      verified: faker.datatype.boolean(),
      verified_at: new Date(),
      status: faker.helpers.arrayElement(['VERIFIED', 'PENDING']),
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

