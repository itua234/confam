import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
const { encrypt, decrypt } = require('@util/helper');

export interface CustomerAttributes extends Model<InferAttributes<CustomerAttributes>, InferCreationAttributes<CustomerAttributes>> {
    id: string;
    token: string;
    phone: string;
    phone_verified_at?: Date | null;
    encrypted_pii?: string | null;
    status: 'pending' | 'verified' | 'rejected';
    kyc_level_achieved: 'none' | 'tier_1' | 'tier_2' | 'tier_3';
    verified_at?: Date | null;
    is_blacklisted: boolean;
    verification_details?: string | null;

    phone_hash: string;
    dob: Date;
    dob_hash: string;
    nin?: string | null;
    bvn?: string | null;
    nin_hash?: string | null;
    bvn_hash?: string | null;
    address?: string | null;
    access_type: 'temporary' | 'permanent';
    facial_recognition_passed: boolean;
}

type CustomerModelStatic = typeof Model & {
    new (values?: object, options?: object): CustomerAttributes;
    associate: (models: { Permission: any; Document: any, Identity: any }) => void;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const Customer = <CustomerModelStatic>sequelize.define('Customer', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        token: { type: DataTypes.STRING, allowNull: false, unique: true },
        phone: {
            type: DataTypes.TEXT,
            allowNull: false,
            get() {
                return decrypt(this.getDataValue('phone'));
            }
        },
        phone_hash: { type: DataTypes.TEXT, allowNull: false },
        dob: { type: DataTypes.DATE, allowNull: false },
        dob_hash: { type: DataTypes.TEXT, allowNull: false },
        phone_verified_at: { type: DataTypes.DATE, allowNull: true },
        encrypted_pii: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('pending', 'verified', 'rejected'), allowNull: false, defaultValue: 'pending' },
        kyc_level_achieved: {
            type: DataTypes.ENUM(
                'none', 'tier_1', 'tier_2', 'tier_3'
            ),
            allowNull: false,
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
        nin: {type: DataTypes.STRING, allowNull: true },
        bvn: {type: DataTypes.STRING, allowNull: true },
        nin_hash: { type: DataTypes.TEXT, allowNull: true, unique: true },
        bvn_hash: { type: DataTypes.TEXT, allowNull: true, unique: true },
        address: { type: DataTypes.STRING, allowNull: true },
        access_type: { type: DataTypes.ENUM("temporary", "permanent"), allowNull: false, defaultValue: "permanent" },
        facial_recognition_passed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        //verification_details: { type: DataTypes.TEXT, allowNull: true }
    }, {
        hooks: {
            beforeUpdate: (customer: CustomerAttributes) => {
                // Set verification timestamp when status becomes verified
                if (customer.status === 'verified' && !customer.verified_at) {
                    customer.verified_at = new Date();
                }
                // Clear verification timestamp when status is not verified
                if (customer.status !== 'verified') {
                    customer.verified_at = null;
                }
            }
        },
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