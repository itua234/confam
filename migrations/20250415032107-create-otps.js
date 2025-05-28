'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('otps', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      otpable_id: {type: Sequelize.UUID, allowNull: false},
      otpable_type: {type: Sequelize.STRING, allowNull: false},
      code: {type: Sequelize.STRING, allowNull: false},
      valid: {type: Sequelize.BOOLEAN, defaultValue: true},
      purpose: {
        type: Sequelize.ENUM(
            'email_verification',
            'phone_verification',
        ),
        defaultValue: 'phone_verification',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }, // Add created_at
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('otps');
  }
};