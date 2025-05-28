import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
const { encrypt, decrypt } = require('@util/helper');

export interface CustomerAttributes extends Model<InferAttributes<CustomerAttributes>, InferCreationAttributes<CustomerAttributes>> {
    id: string;
    token: string;
    phone?: string | null;
    phone_verified_at?: Date;
    encrypted_pii: string;
    status: 'pending' | 'verified' | 'rejected';
    kyc_level_achieved: 'none' | 'basic' | 'advanced';
    verified_at?: Date;
    is_blacklisted: boolean;
    verification_details?: string | null;
}

type CustomerModelStatic = typeof Model & {
    new (values?: object, options?: object): CustomerAttributes;
    associate: (models: { Permission: any; Document: any, Identity: any }) => void;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const Customer = <CustomerModelStatic>sequelize.define('Customer', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        token: { type: DataTypes.STRING, allowNull: false },
        phone: {
            type: DataTypes.TEXT,
            unique: true,
            allowNull: true,
            get() {
                const value = this.getDataValue('phone');
                return value ? decrypt(value) : null;
            },
            set(value: string) {
                if (value) {
                    this.setDataValue('phone', encrypt(value));
                } else {
                    this.setDataValue('phone', null);
                }
            }
        },
        phone_verified_at: { type: DataTypes.DATE, allowNull: true },
        encrypted_pii: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('pending', 'verified', 'rejected'), defaultValue: 'pending' },
        kyc_level_achieved: {
            type: DataTypes.ENUM(
            'none', 'basic', 'advanced'
            ),
            defaultValue: 'none'
        },
        verified_at: { type: DataTypes.DATE, allowNull: true },
        is_blacklisted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            get() {
                return Boolean(this.getDataValue('is_blacklisted'));
            }
        },
        //verification_details: { type: DataTypes.TEXT, allowNull: true }
    }, {
        tableName: 'customers',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Customer.associate = (models) => {
        Customer.hasMany(models.Permission);
        Customer.hasMany(models.Document, {
            foreignKey: 'customer_id',
            as: 'documents'
        });
        Customer.hasMany(models.Identity, { 
            foreignKey: 'customer_id',
            as: 'identities',
        });
    };

    return Customer;
};