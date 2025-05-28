'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('permissions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      company_id: { type:Sequelize.UUID, allowNull: false },
      customer_id: { type:Sequelize.UUID, allowNull: false },
      request_id: { type:Sequelize.UUID, allowNull: false },
      shared_personal_info: { type: Sequelize.STRING, allowNull: false },
      shared_documents: { type: Sequelize.STRING, allowNull: false },
      granted_at: { type: Sequelize.DATE, allowNull: false },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      status: {type: Sequelize.ENUM('GRANTED', 'REVOKED'), defaultValue: 'GRANTED' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, 
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    // Add indexes
    await queryInterface.addIndex('permissions', ['company_id', 'customer_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('permissions');
  }
};