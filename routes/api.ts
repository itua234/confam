import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
//import authMiddleware from "@middleware/auth.middleware";
import multer, { MulterError, StorageEngine } from 'multer';
//import customerValidator from '@validators/auth.validator';

// const authRoutes = require('./authRoutes');
// const auth = require('@controllers/auth.controller');
const kycController = require('@controllers/kyc.controller');

// Configure multer for file uploads
const storage: StorageEngine = multer.memoryStorage();;
const upload = multer({ storage: storage });
// Middleware to handle multer errors
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if(err instanceof MulterError && err.code === "LIMIT_FILE_COUNT"){
        console.log("Too many files. Max allowed: 5 files");
        return res.status(422).json({
            message: "failed to create new event",
            error: {
                images: "Too many files. Max allowed: 3 files"
            }
        });
    }else if (err) {
        return res.status(500).json({
            message: "Failed to upload files",
            error: err.message
        });
    }
    next();
}

router.get('/', (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
        status: 'ok',
        app: 'allow!! API...',
        version: '1.1.0'
    });
});

export default router;