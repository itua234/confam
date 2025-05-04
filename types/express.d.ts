import 'express';
import { CompanyAttributes } from "@models/company";
import { AppAttributes } from "@models/app";

declare module 'express' {
    export interface Request {
        value?: Record<string, any>;
        user?: CompanyAttributes;
        app?: Record<string, any>;
    }
}