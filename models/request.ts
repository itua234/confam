import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { nanoid } from 'nanoid';

export interface RequestAttributes extends Model<InferAttributes<RequestAttributes>, InferCreationAttributes<RequestAttributes>> {
    id: string;
    reference: string;
    redirect_url: string;
    kyc_level: string;
    bank_accounts_requested: boolean;
    encrypted_data?: string;
    allow_url?: string;
    kyc_token: string;
    token_expires_at: Date;
    company_id: string;
    status: 'initiated' | 'otp_pending' | 'kyc_processing' | 'completed' | 'failed';
    created_at?: Date;
    updated_at?: Date;
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
        kyc_level: { type: DataTypes.ENUM('tier_1', 'tier_2', 'tier_3'), defaultValue: 'tier_1' },
        bank_accounts_requested: { type: DataTypes.BOOLEAN, defaultValue: false },
        encrypted_data: { type: DataTypes.TEXT, allowNull: true },
        allow_url: {type: DataTypes.STRING, allowNull: true },
        kyc_token: DataTypes.STRING, 
        token_expires_at: { type: DataTypes.DATE, allowNull: false },
        company_id: {
            type: DataTypes.UUID,
            references: {
                model: { tableName: 'companies' },
                key: 'id',
            },
            allowNull: false
        },
        status: { type: DataTypes.ENUM('initiated', 'otp_pending', 'kyc_processing', 'completed', 'failed'), defaultValue: 'initiated' },
    }, {
        hooks: {
            beforeCreate: (request) => {
                if (!request.allow_url) {
                    request.allow_url = `http://127.0.0.1:5173/${request.kyc_token}`;
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
    return crypto.randomUUID().replace(/-/g, "");
    //return "re" + nanoid(10).toUpperCase();
}