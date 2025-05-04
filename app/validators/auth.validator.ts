import { Request, Response, NextFunction } from 'express';
import niv from 'node-input-validator';
import { Sequelize, QueryTypes, Op } from 'sequelize';
const { sequelize }: { 
    sequelize: Sequelize; 
} = require('@models');
const {returnValidationError} = require("@util/helper");

niv.extend('hasSpecialCharacter', ({ value }: { value: string }) => {
    if(!value.match(/[^a-zA-Z0-9]/)){
        //Return an error if the value does not contain a special character
        return false;
    }
    return true;
})
niv.extend('containsNumber', ({ value }: { value: string }) => {
    if(!value.match(/\d/)){
        //Return an error if the value does not contain a special character
        return false;
    }
    return true;
})
niv.extend('isSingleWord', ({ value }: { value: string }) => {
    if(value.includes(" ")){
        //Return an error if the value does not contain a special character
        return false;
    }
    return true;
})
niv.extend('unique', async ({ attr, value, args }: { attr: string; value: string; args: string[] }) => {
    const table = args[0];
    const field = args[1] || attr;
    const excludeId = args[2]; // Optional: ID to exclude from the check (for updates)
    // Validate table name and field to prevent SQL injection
    if (!table || !field) {
        throw new Error('Table name and field are required for the unique validation');
    }

    let query = `SELECT * FROM ${table} WHERE ${field} = ?`;
    const replacements: any[] = [value];
    if (excludeId) {
        query += ' AND id != ?';
        replacements.push(excludeId);
    }
    query += ' LIMIT 1';

    const result = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT,
    });

    return result.length === 0; // Return true if no matching record is found
})
niv.extend('exists', async ({ attr, value, args }: { attr: string; value: string; args: string[] }) => {
    const field = args[1] || attr;
    let result = await sequelize.query(`SELECT * FROM ${args[0]} WHERE ${field}=? LIMIT 1`,{
        replacements: [value],
        type: QueryTypes.SELECT
    })
    return result.length !== 0; // Return true if matching record is found
});
niv.extend('confirmed', ({ attr, value }: { attr: string; value: string }, validator: niv.Validator) => {
    const field = `${attr}_confirmation`;
    const secondValue = validator.inputs[field];
    return value === secondValue;
});
niv.extend('phoneWithCountryCode', ({value}: {value: string}) => {
    const phoneWithCountryCodeRegex = /^\+[1-9]{1}[0-9]{1,14}$/; // Adjust regex based on your requirements
    return phoneWithCountryCodeRegex.test(value);
});
niv.extend('verified', async ({attr, value, args}: { attr: string; value: string; args: string[]}) => {
    const table = args[0];
    const field = args[1] || attr;
    const verifiedField = args[2] || field+'_verified_at';

    // Validate table and field to prevent SQL injection
    if (!table || !field) {
        throw new Error('Table name and field are required for the verified validation');
    }

    // Query the database dynamically
    const query = `SELECT * FROM ${table} WHERE ${field} = ? AND ${verifiedField} IS NOT NULL LIMIT 1`;
    const replacements: any[] = [value];

    const result = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT,
    });

    return result.length === 0; // Return true if no matching record is found
});
niv.extendMessages({
    hasSpecialCharacter: 'The :attribute field must have a special character',
    containsNumber: 'The :attribute field must contain a number',
    isSingleWord: 'The :attribute field must be a single word',
    exists: 'The selected :attribute is invalid.',
    verified: 'This :attribute already exist',
    phoneWithCountryCode: 'The phone number must include a valid country code and be in the correct format.'
});

//export the schemas
export default {
    login: async(req: Request, res: Response, next: NextFunction) => {
        const v = new niv.Validator(req.body, {
            email: 'required|email',
            password: 'required|string',
        });

        let matched = await v.check();
        if(!matched){
            let errors = v.errors;
            returnValidationError(errors, res, "Login failed");
        }else{
            if(!req.value){
                req.value = {}
            }
            req.body = v.inputs;
            next();
        }
    },

    google_login: async(req: Request, res: Response, next: NextFunction) => {
        const v = new niv.Validator(req.body, {
            email: 'required|string|email',
            firstname: 'required|string',
            lastname: 'required|string',
            photo: 'required|string',
            googleId: 'required|string',
        });

        let matched = await v.check();
        if(!matched){
            let errors = v.errors;
            returnValidationError(errors, res, "Google authentication failed");
        }else{
            if(!req.value){
                req.value = {}
            }
            req.body = v.inputs;
            next();
        }
    },

    validateCustomerPayload: async (req: Request, res: Response, next: NextFunction) => {
        const v = new niv.Validator(req.body, {
            'customer.name': 'required|string',
            'customer.address': 'required|string',
            'customer.email': 'required|email',
            'customer.identity.number': 'required|string|minLength:11|maxLength:11',
            'customer.identity.type': 'required|string|in:bvn,nin,passport',
            'reference': 'required|string',
            'redirect_url': 'required|url',
            'kyc_level': 'required|string|in:tier_1,tier_2,tier_3',
            'bank_accounts': 'boolean',
        });

        const matched = await v.check();
        if (!matched) {
            const errors = v.errors;
            returnValidationError(errors, res, "Validation failed for customer payload");
        } else {
            if (!req.value) {
                req.value = {};
            }
            req.body = v.inputs;
            next();
        }
    },
}
// {
//     reference: 'required|string',
//     redirect_url: 'required|string|url',
//     kyc_level: 'required|string|in:tier_1,tier_2,tier_3',
//     bank_accounts: 'required|boolean',
//     'customer.name': 'required|string',
//     'customer.email': 'required|string|email',
//     'customer.address': 'required|string',
//     'customer.identity.type': 'required|string|in:BVN,NIN',
//     'customer.identity.number': 'required|string',
// }