'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      customer_id: { type:Sequelize.UUID, allowNull: false },
      type: {
        type: Sequelize.ENUM(
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
      value: { type: Sequelize.TEXT, allowNull: false },
      value_hash: { type: Sequelize.TEXT, allowNull: false },
      image: { type: Sequelize.STRING, allowNull: true },
      verified: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      expired_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }, 
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    // Add index on customer_id for faster lookups
    await queryInterface.addIndex('documents', ['customer_id']);
    // Add index on identity_hash for faster lookups when searching by identity document
    // await queryInterface.addIndex('documents', ['identity_hash'], {
    //   unique: true
    // });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents');
  }
};
