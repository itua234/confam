import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
const { encrypt, decrypt } = require('@util/helper');

export interface CustomerAttributes extends Model<InferAttributes<CustomerAttributes>, InferCreationAttributes<CustomerAttributes>> {
    id: string;
    token: string;
    phone?: string | null;
    phone_verified_at?: Date;
    verified: boolean;
    verified_at?: Date;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    is_blacklisted: boolean;
}

type CustomerModelStatic = typeof Model & {
    new (values?: object, options?: object): CustomerAttributes;
    associate: (models: { Permission: any; Document: any, Identity: any }) => void;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const Customer = <CustomerModelStatic>sequelize.define('Customer', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        token: { type: DataTypes.TEXT, allowNull: false },
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
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            get() {
                return Boolean(this.getDataValue('verified'));
            }
        },
        verified_at: { type: DataTypes.DATE, allowNull: true },
        status: { type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'), defaultValue: 'PENDING' },
        is_blacklisted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            get() {
                return Boolean(this.getDataValue('is_blacklisted'));
            }
        },
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