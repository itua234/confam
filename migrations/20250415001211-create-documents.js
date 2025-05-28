'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      customer_id: { type:Sequelize.UUID, allowNull: false },
      identity_type: {
        type: Sequelize.ENUM(
          'BVN',
          'NIN',
          'PASSPORT',
          'DRIVERS_LICENSE',
          'VOTERS_CARD',
          'RESIDENT_PERMIT',
          'WORK_PERMIT',
          'NATIONAL_ID',
          'OTHER'
        ),
        allowNull: false
      },
      identity_number: { type: Sequelize.STRING, allowNull: false },
      identity_hash: { type: Sequelize.STRING, allowNull: false },
      image: { type: Sequelize.STRING, allowNull: true },
      verified: {type: Sequelize.BOOLEAN, defaultValue: false },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      expired_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, 
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    // Add index on customer_id for faster lookups
    await queryInterface.addIndex('documents', ['customer_id']);
    // Add index on identity_hash for faster lookups when searching by identity document
    await queryInterface.addIndex('documents', ['identity_hash'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents');
  }
};
