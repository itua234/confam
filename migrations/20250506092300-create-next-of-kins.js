'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('next_of_kins', {
            id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
            name: { type: Sequelize.STRING, allowNull: false },
            email: { type: Sequelize.STRING, allowNull: true },
            phone_number: { type: Sequelize.STRING, allowNull: false },
            relationship: { type: Sequelize.STRING, allowNull: false },
            address: { type: Sequelize.TEXT, allowNull: false },
            customer_id: { type: Sequelize.UUID, allowNull: false },
            is_sharable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { type: Sequelize.DATE, allowNull: false }, 
            updated_at: { type: Sequelize.DATE, allowNull: false }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('next_of_kins');
    }
};
