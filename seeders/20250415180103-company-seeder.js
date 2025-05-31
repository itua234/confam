'use strict';

const bcrypt = require('bcrypt'); 
const { v4: uuidv4 } = require('uuid'); 
const {faker} = require("@faker-js/faker");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    // Hash the password inside the up function
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Reckless@3030", salt);

    const companies = Array.from({ length: 2 }, () => ({
      id: uuidv4(),
      name: faker.company.name(),
      email: faker.internet.email(),
      logo: faker.image.avatar(),
      password: hashedPassword,
      domain: faker.internet.domainName(),
      webhook_url: faker.internet.url(),
      verified: faker.datatype.boolean(),
      notifications_enabled: faker.datatype.boolean(),
      email_verified_at: faker.date.past(),
      created_at: new Date(),
      updated_at: new Date()
    }));
    return queryInterface.bulkInsert('companies', companies);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('companies', null, {});
  },
};