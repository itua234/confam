import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import bcrypt from 'bcrypt';

// Define the CompanyAttributes interface
export interface CompanyAttributes extends Model<InferAttributes<CompanyAttributes>, InferCreationAttributes<CompanyAttributes>> {
    id: string;
    name: string;
    logo?: string;
    email: string;
    password?: string;
    domain?: string;
    webhookUrl?: string;
    verified: boolean;
    notificationsEnabled: boolean;
    email_verified_at?: Date;
}

// Define the CompanyModelStatic type
type CompanyModelStatic = typeof Model & {
    new (values?: object, options?: object): CompanyAttributes;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const Company = <CompanyModelStatic>sequelize.define('Company', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING, allowNull: false },
        logo: { type: DataTypes.STRING, allowNull: true },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            get() {
                const rawValue = this.getDataValue('email');
                return rawValue ? rawValue : null;
            },
            set(value: string) {
                this.setDataValue('email', value.toLowerCase());
            }
        },
        password: { type: DataTypes.STRING, allowNull: true },
        domain: { type: DataTypes.STRING, allowNull: true },
        webhookUrl: { type: DataTypes.STRING, allowNull: true },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            get() {
                const rawValue = this.getDataValue('verified');
                return Boolean(rawValue);
            }
        },
        notificationsEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
        email_verified_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        hooks: {
            beforeCreate: async (company: CompanyAttributes) => {
                if (company.password) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(company.password, salt);
                    company.password = hashedPassword;
                }
            },
            beforeUpdate: async (company: CompanyAttributes) => {
                if (company.changed('password') && company.password) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(company.password, salt);
                    company.password = hashedPassword;
                }
            }
        },
        tableName: 'companies',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        defaultScope: {
            //attributes: { exclude: ['createdAt', 'updatedAt'] }
        }
    });

    return Company;
};