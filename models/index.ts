import { Sequelize, Model, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { Dialect } from 'sequelize/types';

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require('@config/config')[env] as {
    database: string;
    username: string;
    password: string;
    use_env_variable?: string;
    dialect: Dialect;
};
let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable] as string, config);
}else {
    sequelize = new Sequelize(
        config.database, 
        config.username, 
        config.password, 
        config
    );
}

interface Db {
    sequelize: Sequelize;
    Sequelize: typeof Sequelize;
    models: { [key: string]: typeof Model };
}

const db: Db = {
    sequelize,
    Sequelize,
    models: {}
};

// Import all models
fs.readdirSync(__dirname)
.filter((file: string) => {
    return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.ts' &&
        file.indexOf('.test.ts') === -1
    );
}).forEach((file: string) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes, Sequelize);
    db.models[model.name] = model;
});

// Establish relationships
Object.keys(db.models).forEach((modelName: string) => {
    if (typeof (db.models[modelName] as any).associate === 'function') {
        (db.models[modelName] as any).associate(db.models);
    }
});

export default db;