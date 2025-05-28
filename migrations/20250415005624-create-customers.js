'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      token: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: true, unique: true },
      phone_verified_at: {type: Sequelize.DATE, allowNull: true },
      encrypted_pii: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM(
         'pending', 'verified', 'rejected'
        ),
        defaultValue: 'pending'
      },
      kyc_level_achieved: {
        type: Sequelize.ENUM(
         'none', 'basic', 'advanced'
        ),
        defaultValue: 'none'
      },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      is_blacklisted: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false }, 
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    // Add index on phone for faster lookups when searching by phone
    await queryInterface.addIndex('customers', ['phone']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customers');
  }
};
