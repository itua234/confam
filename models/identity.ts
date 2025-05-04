// identity.model.ts
import { Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';

export interface IdentityAttributes extends Model<InferAttributes<IdentityAttributes>, InferCreationAttributes<IdentityAttributes>> {
    id: string;
    customer_id: string;
    type: 'NIN' | 'BVN';
    number: string;
    verified_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

type IdentityModelStatic = typeof Model & {
    new (values?: object, options?: object): IdentityAttributes;
    associate: (models: { Customer: any }) => void;
};

module.exports = (sequelize: Sequelize) => {
    const Identity = <IdentityModelStatic>sequelize.define('Identity', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        customer_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'customers', 
                key: 'id',
            },
        },
        type: {type: DataTypes.ENUM('NIN', 'BVN'), allowNull: false},
        number: {type: DataTypes.STRING, allowNull: false},
        verified_at: {type: DataTypes.DATE, allowNull: true},
    }, {
        tableName: 'identities',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Identity.associate = (models) => {
        Identity.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'customer',
        });
    };

    return Identity;
};