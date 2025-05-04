import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
//const { v4: uuidv4 } = require('uuid');
//import { nanoid } from 'nanoid';

export interface RequestAttributes extends Model<InferAttributes<RequestAttributes>, InferCreationAttributes<RequestAttributes>> {
    id: string;
    reference: string;
    redirect_url: string;
    kyc_level: string;
    bank_accounts: boolean;
    allow_url?: string;
    kyc_token: string;
    token_expires_at: Date;
    company_id: string;
    customer_id?: string;
}

// Define the CustomerModelStatic type
type ModelStatic = typeof Model & {
    new (values?: object, options?: object): RequestAttributes;
    //associate: (models: { User: any; Customer: any }) => void;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const Request = <ModelStatic>sequelize.define('Request', {
        id: { 
            type: DataTypes.UUID, 
            primaryKey: true, 
            defaultValue: () => generateCustomId(),
            unique: true
        },  
        reference: { type: DataTypes.STRING, allowNull: false, unique: true },
        redirect_url: { type: DataTypes.STRING, allowNull: false },
        kyc_level: { type: DataTypes.ENUM('basic', 'advanced'), allowNull: false },
        bank_accounts: { type: DataTypes.BOOLEAN, allowNull: false },
        allow_url: {type: DataTypes.STRING, allowNull: true},
        kyc_token: DataTypes.STRING, 
        token_expires_at: DataTypes.DATE,
        company_id: {
            type: DataTypes.UUID,
            references: {
                model: { tableName: 'companies' },
                key: 'id',
            },
            allowNull: false
        },
        customer_id: {
            type: DataTypes.UUID,
            references: {
                model: { tableName: 'customers' },
                key: 'id',
            },
            allowNull: true,
        },
    }, {
        hooks: {
            beforeCreate: (request) => {
                if (!request.allow_url) {
                    request.allow_url = `https://api.allow.com/${request.kyc_token}`;
                }
            },
        },
        tableName: 'requests',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Request;
};

function generateCustomId() {
    return "re" + crypto.randomUUID().replace(/-/g, "").substring(0, 10).toUpperCase();
    // return "re" + nanoid(10).toUpperCase();

    // const prefix = 're'; // Your custom prefix
    // const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    // const timestampPart = Date.now().toString(36).substring(4, 7);
    // return `${prefix}${randomPart}${timestampPart}`;
}