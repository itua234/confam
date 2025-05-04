import { Sequelize, Model, InferAttributes, InferCreationAttributes } from 'sequelize';

// Define the PermissionAttributes interface
export interface PermissionAttributes extends Model<InferAttributes<PermissionAttributes>, InferCreationAttributes<PermissionAttributes>> {
    id: string;
    company_id: string;
    customer_id: string;
    request_id: string;
    shared_personal_info: Record<string, any>; // JSON object with boolean values
    shared_documents: Record<string, any>; // JSON object with boolean values
    granted_at: Date;
    revoked_at: Date;
    status: 'GRANTED' | 'REVOKED';
}

// Define the PermissionModelStatic type
type PermissionModelStatic = typeof Model & {
    new (values?: object, options?: object): PermissionAttributes;
    associate: (models: { Company: any; Customer: any }) => void;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const Permission = <PermissionModelStatic>sequelize.define('Permission', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        company_id: {
            type: DataTypes.UUID,
            references: {
                model: { tableName: 'companies' },
                key: 'id'
            },
            allowNull: false
        },
        customer_id: {
            type: DataTypes.UUID,
            references: {
                model: { tableName: 'customers' },
                key: 'id'
            },
            allowNull: false
        },
        request_id: {
            type: DataTypes.UUID,
            references: {
                model: { tableName: 'requests' },
                key: 'id'
            },
            allowNull: false
        },
        shared_personal_info: {type: DataTypes.STRING, allowNull: false},
        shared_documents: { type: DataTypes.STRING, allowNull: false},
        granted_at: { type: DataTypes.DATE, allowNull: false },
        revoked_at: { type: DataTypes.DATE, allowNull: true },
        status: {type: DataTypes.ENUM('GRANTED', 'REVOKED'), defaultValue: 'GRANTED'}
    }, {
        tableName: 'permissions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        defaultScope: {
            //attributes: { exclude: ['createdAt', 'updatedAt'] }
        }
    });

    Permission.associate = (models) => {
        Permission.belongsTo(models.Company, {
            as: 'companies',
            foreignKey: 'company_id'
        });
        Permission.belongsTo(models.Customer, {
            as: 'customers',
            foreignKey: 'customer_id'
        });
    };

    return Permission;
};