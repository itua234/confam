'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('apps', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      company_id: { type:Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      display_name: { type: Sequelize.STRING, allowNull: false },
      logo: { type: Sequelize.STRING, allowNull: true },
      test_public_key: { type: Sequelize.STRING, allowNull: false, unique: true },
      live_public_key: { type: Sequelize.STRING, allowNull: false, unique: true },
      mode: { type: Sequelize.ENUM('SANDBOX', 'LIVE'), defaultValue: 'SANDBOX' },
      status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
      webhook_url: {type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }, 
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    // Add indexes
    //await queryInterface.addIndex('apps', ['company_id']); // faster lookups by company
    await queryInterface.addIndex('apps', ['test_public_key']);
    await queryInterface.addIndex('apps', ['live_public_key']);
    //await queryInterface.addIndex('apps', ['status']); // optional: useful for filtering by status
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('apps');
  }
};