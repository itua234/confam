'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      request_id: { type:Sequelize.UUID, allowNull: false },
      status: {
        type: Sequelize.ENUM(
          'PENDING', 
          'SUCCESS', 
          'FAILED'
        ),
        defaultValue: 'PENDING'
      },
      action: {
        type: Sequelize.ENUM(
          'CREATE', 
          'UPDATE', 
          'DELETE', 
          'LOGIN', 
          'LOGOUT', 
          'TRANSACTION',
          'VERIFICATION_ATTEMPT'
        )
      },
      metadata: { type: Sequelize.TEXT, allowNull: true },
      ip_address: { type: Sequelize.STRING, allowNull: true },
      user_agent: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }, 
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Logs');
  }
};