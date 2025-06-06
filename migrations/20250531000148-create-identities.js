'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('identities', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      customer_id: { type:Sequelize.UUID, allowNull: false },
      type: {
        type: Sequelize.ENUM(
         'NIN',
         "BVN"
        ),
        allowNull: false
      },
      value: { type: Sequelize.TEXT, allowNull: false },
      verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      verification_provider: { type: Sequelize.STRING, allowNull: true },
      provider_reference: {type: Sequelize.STRING, allowNull: true },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }, 
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    // Add index on customer_id for faster lookups
    await queryInterface.addIndex('identities', ['customer_id']);
    // Add index on identity_hash for faster lookups when searching by identity identitie
    // await queryInterface.addIndex('identities', ['identity_hash'], {
    //   unique: true
    // });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('identities');
  }
};
