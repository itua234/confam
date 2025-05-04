import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import crypto from 'crypto';
const SECRET_SALT = process.env.SECRET_SALT || 'default_secret_salt';
const client = require("@util/client");
import { CompanyAttributes } from "./company";

// Define the AppAttributes interface
export interface AppAttributes extends Model<InferAttributes<AppAttributes>, InferCreationAttributes<AppAttributes>> {
    id: string;
    name: string;
    display_name: string;
    logo?: string;
    //description?: string;
    test_public_key: string;
    test_secret_key?: string;
    live_public_key: string;   
    live_secret_key?: string;
    mode: 'SANDBOX' | 'LIVE';
    status: 'ACTIVE' | 'INACTIVE';
    webhook_url?: string;
    company_id: string;
    company?: CompanyAttributes;
}

// Define the AppModelStatic type
type AppModelStatic = typeof Model & {
    new (values?: object, options?: object): AppAttributes;
    associate: (models: { Company: any }) => void;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const App = <AppModelStatic>sequelize.define('App', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING, allowNull: false},
        display_name: { type: DataTypes.STRING, allowNull: false },
        logo: { type: DataTypes.STRING, allowNull: true },
        test_public_key: { type: DataTypes.STRING, unique: true, allowNull: false },
        test_secret_key: {
            type: DataTypes.VIRTUAL,
            get() {
                const hashedKey = crypto
                .createHmac('sha256', SECRET_SALT) // Use HMAC with the server-side secret
                .update(this.getDataValue('test_public_key'))
                .digest('hex'); // Generate the secret key as a hex string
                return `sk_test_${hashedKey}`; // Add the prefix
            },
            set(value) {
                throw new Error('Do not try to set the `test_secret_key` value!');
            }
        },
        live_public_key: { type: DataTypes.STRING, unique: true, allowNull: false },
        live_secret_key: {
            type: DataTypes.VIRTUAL,
            get() {
                const hashedKey = crypto
                .createHmac('sha256', SECRET_SALT) // Use HMAC with the server-side secret
                .update(this.getDataValue('live_public_key'))
                .digest('hex'); // Generate the secret key as a hex string
                return `sk_live_${hashedKey}`; // Add the prefix
            },
            set(value) {
                throw new Error('Do not try to set the `live_secret_key` value!');
            },
        },
        mode: {
            type: DataTypes.ENUM('SANDBOX', 'LIVE'),
            defaultValue: 'SANDBOX', // Default to sandbox mode
        },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            defaultValue: 'ACTIVE',
        },
        webhook_url: {type: DataTypes.STRING, allowNull: true},
        company_id: {
            type: DataTypes.UUID,
            references: {
                model: { tableName: 'companies' }, // Reference the Customer table
                key: 'id',
            },
            allowNull: false,
        },
    }, {
        hooks: {
            beforeCreate: async (app: AppAttributes) => {
                // Generate unique public keys for sandbox and live modes
                app.test_public_key = `pk_test_${crypto.randomBytes(16).toString('hex')}`;
                app.live_public_key = `pk_live_${crypto.randomBytes(16).toString('hex')}`;
            },
            afterCreate: async (app: AppAttributes) => {
                const testSecret = `sk_test_${crypto .createHmac('sha256', SECRET_SALT).update(app.test_public_key).digest('hex')}`;
                const liveSecret = `sk_live_${crypto.createHmac('sha256', SECRET_SALT).update(app.live_public_key).digest('hex')}`;
            
                await client.set(`secret:${testSecret}`, app.id);
                await client.set(`secret:${liveSecret}`, app.id);
            },
            beforeUpdate: async (app) => {
                // if (app.changed('test_secret_key')) {
                //   const saltRounds = 10;
                //   const saltTest = await bcrypt.genSalt(saltRounds);
                //   app.hash_test_secret_key = await bcrypt.hash(app.test_secret_key, saltTest);
                //   // app.test_secret_key = undefined;
                // }
                // if (app.changed('live_secret_key')) {
                //   const saltRounds = 10;
                //   const saltLive = await bcrypt.genSalt(saltRounds);
                //   app.hash_live_secret_key = await bcrypt.hash(app.live_secret_key, saltLive);
                //   // app.live_secret_key = undefined;
                // }
            },
        },
        tableName: 'apps',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    App.associate = (models) => {
        App.belongsTo(models.Company, { 
            foreignKey: 'company_id', 
            as: 'company' 
        });
    };

    return App;
};