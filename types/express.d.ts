import 'express';
import { CompanyAttributes } from "@models/company";
import { AppAttributes } from "@models/app";
import Request from "express"

// declare module 'express' {
//     export interface Request {
//         value?: Record<string, any>;
//         user?: CompanyAttributes;
//         app?: Record<string, any>;
//     }
// }

// Extend the existing Request interface
declare global {
    namespace Express {
        interface Request {
            value?: Record<string, any>;
            user?: CompanyAttributes;
            app?: Record<string, any>;
        }
    }
}