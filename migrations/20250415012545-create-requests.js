'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('requests', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      company_id: { type:Sequelize.UUID, allowNull: false },
      reference: { type: Sequelize.STRING, allowNull: false, unique: true },
      redirect_url: { type: Sequelize.STRING, allowNull: false },
      kyc_level: { type: Sequelize.ENUM('basic', 'advanced'), defaultValue: 'basic' },
      bank_accounts_requested: { type: Sequelize.BOOLEAN, defaultValue: false },
      encrypted_data: { type: Sequelize.TEXT, allowNull: true },
      allow_url: {type: Sequelize.STRING, allowNull: true},
      kyc_token: {type: Sequelize.STRING, allowNull: false},
      token_expires_at: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.ENUM('initiated', 'otp_pending', 'kyc_processing', 'completed', 'failed'), defaultValue: 'initiated' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, 
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    // Add index on reference for faster lookups
    await queryInterface.addIndex('requests', ['reference']);
    // Add index on customer_id for faster lookups when searching by identity document
    await queryInterface.addIndex('requests', ['kyc_token']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('requests');
  }
};