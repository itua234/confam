import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
const { encrypt, decrypt } = require('@util/helper');

// Define the DocumentAttributes interface
export interface DocumentAttributes extends Model<InferAttributes<DocumentAttributes>, InferCreationAttributes<DocumentAttributes>> {
    id: string;
    customer_id: string;
    identity_type: 'BVN' | 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD' | 'RESIDENT_PERMIT' | 'WORK_PERMIT' | 'NATIONAL_ID' | 'OTHER';
    identity_number: string;
    identity_hash: string;
    image?: string;
    verified: boolean;
    verified_at?: Date;
    expired_at?: Date;
}

type DocumentModelStatic = typeof Model & {
    new (values?: object, options?: object): DocumentAttributes;
    associate: (models: { Customer: any }) => void;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const Document = <DocumentModelStatic>sequelize.define('Document', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        customer_id: {
            type: DataTypes.UUID,
            references: {
              model: 'customers',
              key: 'id'
            },
            allowNull: false
        },
        identity_type: { type: DataTypes.STRING, allowNull: false },
        identity_number: { 
            type: DataTypes.STRING, 
            allowNull: false,
            get() {
                const encryptedValue = this.getDataValue('identity_number');
                return encryptedValue ? decrypt(encryptedValue) : null;
            },
            set(value: string) {
                this.setDataValue('identity_number', encrypt(value));
            }
        },
        identity_hash: { type: DataTypes.STRING, allowNull: false },
        image: { type: DataTypes.STRING, allowNull: true },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            get() {
                const rawValue = this.getDataValue('verified');
                return Boolean(rawValue);
            }
        },
        verified_at: { type: DataTypes.DATE, allowNull: true },
        expired_at: { type: DataTypes.DATE, allowNull: true }
    }, {
        tableName: 'documents',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Document.associate = (models) => {
        Document.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'customer'
        });
    };

    return Document;
};