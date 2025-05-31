'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('companies', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING, allowNull: true, unique: true },
      logo: { type: Sequelize.STRING, allowNull: true },
      password: { type: Sequelize.STRING, allowNull: false },
      domain: { type: Sequelize.STRING, allowNull: true },
      webhook_url: { type: Sequelize.STRING, allowNull: true },
      verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      notifications_enabled: { type: Sequelize.BOOLEAN, defaultValue: true },
      email_verified_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, 
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // Add indexes
    await queryInterface.addIndex('companies', ['email']);
    await queryInterface.addIndex('companies', ['phone']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('companies');
  }
};