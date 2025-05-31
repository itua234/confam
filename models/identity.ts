import { Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
const { decrypt } = require('@util/encryption');

export interface IdentityAttributes extends Model<InferAttributes<IdentityAttributes>, InferCreationAttributes<IdentityAttributes>> {
    id: string;
    customer_id: string;
    type: 'NIN' | 'BVN';
    value: string;
    value_hash: string;
    status: 'pending' | 'verified' | 'rejected' | 'expired' | 'revoked' | 'suspended';
    verification_provider?: string;
    provider_reference?: string| null;
    verified_at?: Date | null;
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
        type: { type: DataTypes.ENUM('NIN', 'BVN'), allowNull: false },
        value: { 
            type: DataTypes.TEXT, 
            allowNull: false,
            get() {
                const encryptedValue = this.getDataValue('value');
                return encryptedValue ? decrypt(encryptedValue) : null;
            }
        },
        value_hash: { type: DataTypes.TEXT, allowNull: false },
        status: {
            type: DataTypes.ENUM(
                'pending', 'verified', 'rejected', 'expired', 'revoked', 'suspended'
            ),
            defaultValue: 'pending',
            allowNull: false
        },
        verification_provider: { type: DataTypes.STRING, allowNull: true },
        provider_reference: { type: DataTypes.STRING, allowNull: true },
        verified_at: { type: DataTypes.DATE, allowNull: true },
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