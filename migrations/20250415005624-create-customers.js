'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      token: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING, allowNull: false },
      phone_hash: { type: Sequelize.TEXT, allowNull: false },
      dob: { type: Sequelize.DATE, allowNull: false },
      dob_hash: { type: Sequelize.TEXT, allowNull: false },
      phone_verified_at: {type: Sequelize.DATE, allowNull: true },
      encrypted_pii: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM(
          'pending', 'verified', 'rejected'
        ),
        defaultValue: 'pending',
        allowNull: false
      },
      kyc_level_achieved: {
        type: Sequelize.ENUM(
         'none', 'tier_1', 'tier_2', 'tier_3'
        ),
        defaultValue: 'none',
        allowNull: false
      },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      is_blacklisted: { type: Sequelize.BOOLEAN, defaultValue: false },
      nin: {type: Sequelize.STRING, allowNull: true },
      bvn: {type: Sequelize.STRING, allowNull: true },
      nin_hash: { type: Sequelize.TEXT, allowNull: true, unique: true },
      bvn_hash: { type: Sequelize.TEXT, allowNull: true, unique: true },
      address: { type: Sequelize.STRING, allowNull: true },
      access_type: { type: Sequelize.ENUM("temporary", "permanent"), allowNull: false, defaultValue: "permanent" },
      facial_recognition_passed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false }, 
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    // Add indexes for faster lookups when searching
    await queryInterface.addIndex('customers', ['token']);
    await queryInterface.addIndex('customers', ['phone_hash']);
    await queryInterface.addIndex('customers', ['nin_hash']);
    await queryInterface.addIndex('customers', ['bvn_hash']);
    await queryInterface.addIndex('customers', ['status']);
    await queryInterface.addIndex('customers', ['kyc_level_achieved']);
    await queryInterface.addIndex('customers', ['is_blacklisted']);
    await queryInterface.addIndex('customers', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('customers');
  }
};
