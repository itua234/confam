import { Sequelize, Model, InferAttributes, InferCreationAttributes, DataTypes } from 'sequelize';

// Define the NextOfKinAttributes interface
export interface NextOfKinAttributes extends Model<InferAttributes<NextOfKinAttributes>, InferCreationAttributes<NextOfKinAttributes>> {
    id: string;
    name: string;
    email?: string | null; 
    phone_number: string;
    relationship: string; // e.g., 'Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'
    address: string;
    customer_id: string; 
    is_sharable: boolean; // Indicates if the next of kin information can be shared with third parties
    created_at?: Date;
    updated_at?: Date;
}

// Define the NextOfKinModelStatic type
type NextOfKinModelStatic = typeof Model & {
    new (values?: object, options?: object): NextOfKinAttributes;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const NextOfKin = <NextOfKinModelStatic>sequelize.define('NextOfKin', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING, allowNull: false },
        email: {
            type: DataTypes.STRING,
            allowNull: true, 
            set(value: string | null) {
                this.setDataValue('email', value ? value.toLowerCase() : null);
            }
        },
        phone_number: { type: DataTypes.STRING, allowNull: false },
        relationship: { type: DataTypes.STRING, allowNull: false },
        address: { type: DataTypes.TEXT, allowNull: false },
        customer_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: { tableName: 'customers' },
                key: 'id'
            }
        },
        is_sharable: { 
            type: DataTypes.BOOLEAN, 
            allowNull: false, 
            defaultValue: true,
            get() {
                return Boolean(this.getDataValue('is_sharable'));
            }
        },
    }, {
        tableName: 'next_of_kins', 
        timestamps: true, 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    return NextOfKin;
};