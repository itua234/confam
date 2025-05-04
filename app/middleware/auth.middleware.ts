import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');
import { JwtPayload } from 'jsonwebtoken';
const { 
    TOKEN_SECRET, 
    APP_TOKEN, 
    REFRESH_TOKEN_SECRET, 
    TOKEN_EXPIRE, 
    REFRESH_TOKEN_EXPIRE 
} = process.env;
const logger = require('@util/logger');
import { get } from 'lodash';
;const client = require("@util/client");
const { models: { App, Company } } = require('@models').default;

//export the auth middlewares
export default {
    // authGuard: async (req: Request, res: Response, next: NextFunction) => {
    //     try{
    //         const authHeader = req.headers['authorization'];
    //         const token = authHeader && authHeader.split(' ')[1];
    //         if (token == null) return res.status(401).json({ error: true, message: "unauthenticated" });
    //         console.log(token);

    //         const decoded = jwt.verify(token, TOKEN_SECRET as string) as JwtPayload;
    //         const getUser = await User.findOne({
    //             where: { email: decoded.user.email },
    //             raw: true,
    //         });
    //         if(!getUser) throw 'Invalid Access Token Sent';
    //         req.user = getUser;
    //         next();
    //     }catch (error) {
    //         return res.status(401).json({ 
    //             error: true, 
    //             message: 'Unauthenticated' 
    //         });
    //     }
    // },

    appGuard: (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers['authorization'];
        const appKey = authHeader && authHeader.split(' ')[1];
        if (appKey === APP_TOKEN) {
            next();
        } else {
            return res.status(403).json({ error: true, message: "Forbidden" });
        }
    },

    createAccessToken: (user: Record<string, any>): string => {
        return jwt.sign({ user }, TOKEN_SECRET || 'default_token_secret', { algorithm: 'RS256', expiresIn: TOKEN_EXPIRE });
    },

    createRefreshToken: (user: Record<string, any>): string => {
        return jwt.sign({ user: user.id }, REFRESH_TOKEN_SECRET || 'default_token_secret', { algorithm: 'RS256', expiresIn: REFRESH_TOKEN_EXPIRE });
    },

    authenticateAppBySecretKey: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | any> => {
        const rawToken = req.headers['x-allow-key'];
        let token: string | null = null;
        if (typeof rawToken === 'string') {
            token = rawToken;
        } else if (Array.isArray(rawToken) && rawToken.length > 0) {
            token = rawToken[0]; // Use the first token if it's an array
            if (rawToken.length > 1) {
                logger.warn(`Multiple API keys found in 'x-allow-key' header, using the first one.`);
            }
        }
        const requestStartTime = Date.now();
        const requestMethod = req.method;
        const requestUrl = req.originalUrl;
        const clientIp = req.ip;
        //const userAgent = req.headers['user-agent'];
        logger.info(`Request received: ${requestMethod} ${requestUrl} from ${clientIp}`);

        if (token == null) {
            logger.warn(`Authentication failed: Missing API key.`);
            return res.status(401).json({ error: true, message: "unauthenticated" });
        }

        console.log(token);
        logger.info(`Attempting authentication with key: ${token.substring(0, 6)}... (masked)`);

        try{
            const appId = await client.get(`secret:${token}`);
            if (!appId) {
                logger.error(`Authentication failed: Invalid API key - ${token.substring(0, 6)}...`);
                return res.status(401).json({ error: true, message: "Invalid API key" });
            }
        
            // Fetch the app and include the company association
            const app = await App.findOne({ 
                where: { id: appId },
                include: [
                    {
                        model: Company,
                        as: 'company'
                    }
                ]
            });
            if (!app) {
                logger.error(`Authentication failed: App not found for ID: ${appId}`);
                return res.status(404).json({ error: true, message: "App not found" });
            }

            req.app = app;
            const responseTime = Date.now() - requestStartTime;
            logger.info(`Authentication successful for App ID: ${appId} (Company: ${get(app, 'company.name', 'N/A')}). Request processed in ${responseTime}ms.`);
            next();
        } catch (error: any) {
            logger.error(`Authentication error for key ${token.substring(0, 6)}...:`, error);
            return res.status(500).json({ error: true, message: "Authentication error" });
        }
    }
}