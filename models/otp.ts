import { Sequelize, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

// Define the OtpAttributes interface
export interface OtpAttributes extends Model<InferAttributes<OtpAttributes>, InferCreationAttributes<OtpAttributes>> {
    id: number;
    otpable_id: number;
    otpable_type: string;
    code: string;
    valid: boolean;
    purpose: 'email_verification' | 'phone_verification' | 'password_reset' | 'password_change';
}

// Define the OtpModelStatic type
type OtpModelStatic = typeof Model & {
    new (values?: object, options?: object): OtpAttributes;
};

module.exports = (sequelize: Sequelize, DataTypes: typeof import('sequelize').DataTypes) => {
    const Otp = <OtpModelStatic>sequelize.define('Otp', {
        id: {type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4},
        otpable_id: {type: DataTypes.UUID, allowNull: false},
        otpable_type: {type: DataTypes.STRING, allowNull: false},
        code: {type: DataTypes.STRING, allowNull: false},
        valid: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            get() {
                return Boolean(this.getDataValue('valid'));
            }
        },
        purpose: {
            type: DataTypes.ENUM(
                'email_verification',
                'phone_verification',
                'password_reset',
                'password_change'
            ),
            defaultValue: 'email_verification',
        },
    }, {
        tableName: 'otps',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        defaultScope: {
            //attributes: { exclude: ['createdAt', 'updatedAt'] }
        }
    });

    return Otp;
};