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

function generateToken() {
    return crypto.randomBytes(16).toString('hex'); // Generate a 64-character hex token
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dob = faker.date.past(30, new Date());
    console.log("birthdate", dob);
    console.log("birthdate iso", dob.toISOString());
    const customers = Array.from({ length: 5 }, () => ({
      //id: uuidv4(),
      id: faker.string.uuid(),
      token: generateToken(),
      //phone: encrypt(faker.phone.number()),
      phone: encrypt("+2348114800769"),
      dob: dob,
      email: encrypt("softech234@gmail.com"),
      email_hash: crypto.createHash('sha256').update("softech234@gmail.com").digest('hex'),
      phone_verified_at: null,
      verified_at: new Date(),
      status: "pending",
      //status: faker.helpers.arrayElement(['VERIFIED', 'PENDING']),
      is_blacklisted: faker.datatype.boolean(),
      created_at: new Date(),
      updated_at: new Date(),
    }));
    await queryInterface.bulkInsert('customers', customers,  { returning: true });

    // Retrieve the inserted customer's ID manually
    const [customer] = await queryInterface.sequelize.query(
      `SELECT id FROM customers WHERE status = 'pending' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const customerId = customer.id;
     // Generate identity data
        const identity = [
          {
            id: uuidv4(),
            type: "NIN",
            value: encrypt("1234567890"),
            // value_hash: crypto.createHash('sha256').update("1234567890").digest('hex'),
            status: 'pending',
            customer_id: customerId, 
            verified_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];
    
        // Insert apps into the database
        await queryInterface.bulkInsert('identities', identity);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('customers', null, {});
  },
};

