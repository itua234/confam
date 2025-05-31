'use strict';

const crypto = require('crypto');
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid'); 
const { createClient } = require("redis");
const client = createClient({
  url: `rediss://default:AaZeAAIjcDEyZjZjMTdjYmZmMzU0MDk3ODFmY2I0ZmIyNDY0NjIzNHAxMA@generous-sunfish-42590.upstash.io:6379`,
  socket: {
    connectTimeout: 10000, // Set timeout to 10 seconds
  },
});
client.on("error", (error) => {
  throw error;
  //console.error(error);
});
client.on("connect", () => {
  console.log('Redis URL:', `rediss://default:AaZeAAIjcDEyZjZjMTdjYmZmMzU0MDk3ODFmY2I0ZmIyNDY0NjIzNHAxMA@generous-sunfish-42590.upstash.io:6379`);
  console.log("Connected to Redis");
});
(async () => {
  try {
    await client.connect();
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
})();
const SECRET_SALT = process.env.SECRET_SALT || 'default_secret_salt'; 
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash the password inside the up function
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Reckless@3030", salt);
    // Create companies
    await queryInterface.bulkInsert(
      'companies',
      [
        {
          id: uuidv4(),
          name: 'Tech Innovators Inc.',
          logo: 'https://example.com/logo1.png',
          email: 'johndoe@example.com',
          password: hashedPassword,
          domain: 'techinnovators.com',
          webhook_url: 'https://webhooks.techinnovators.com',
          verified: true,
          notifications_enabled: true,
          email_verified_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      { returning: true }
    );

    // Retrieve the inserted company's ID manually
    const [company] = await queryInterface.sequelize.query(
      `SELECT id FROM companies WHERE email = 'johndoe@example.com' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const companyId = company.id;

    // Generate apps data
    const apps = [
      {
        id: uuidv4(),
        name: 'Sample App',
        display_name: 'Sample Application',
        logo: 'https://example.com/logo.png',
        test_public_key: `pk_test_${crypto.randomBytes(16).toString('hex')}`,
        live_public_key: `pk_live_${crypto.randomBytes(16).toString('hex')}`,
        mode: 'SANDBOX',
        status: 'ACTIVE',
        webhook_url: 'https://example.com/webhook',
        company_id: companyId, // Associate the app with the company
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Insert apps into the database
    await queryInterface.bulkInsert('apps', apps);

    // Add secret keys to Redis
    for (const app of apps) {
      const testSecret = `sk_test_${crypto.createHmac('sha256', SECRET_SALT).update(app.test_public_key).digest('hex')}`;
      const liveSecret = `sk_live_${crypto.createHmac('sha256', SECRET_SALT).update(app.live_public_key).digest('hex')}`;

      console.log('Test Secret:', testSecret);
      console.log('Live Secret:', liveSecret);
      console.log('App ID:', app.id);
      await client.set(`secret:${testSecret}`, app.id); // Store test secret key in Redis
      await client.set(`secret:${liveSecret}`, app.id); // Store live secret key in Redis
    }
  },

  down: async (queryInterface) => {
    // Clean up Redis keys
    const keys = await client.keys('secret:*'); // Fetch all keys matching the pattern
    for (const key of keys) {
      await client.del(key); // Delete each key
    }
    // Delete data from the database
    await queryInterface.bulkDelete('apps', null, {});
    await queryInterface.bulkDelete('companies', null, {});
  },
};
