import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
import authMiddleware from "@middleware/auth.middleware";
import multer, { MulterError, StorageEngine } from 'multer';
import kycValidator from '@validators/kyc.validator';

// const authRoutes = require('./authRoutes');
// const auth = require('@controllers/auth.controller');
const kycController = require('@controllers/kyc.controller');

// Configure multer for file uploads
const storage: StorageEngine = multer.memoryStorage();
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

router.post('/allow/initiate', [
    authMiddleware.authenticateAppBySecretKey,
    //kycValidator.initialize_kyc
], kycController.initiate);
router.get('/allow/:kyc_token', [], kycController.fetch_request);
router.post('/allow', [], kycController.dummyEndpoint);
// router.get('/allow/verification/:kyc_token', kycController.showVerificationPage);
// router.post('/allow/verify-phone', kycController.verifyPhone);

// router.get('/allow/customers', function (req: Request, res: Response) {
    
// });
// router.route('/allow/customers/:reference') 
// .get(function (req: Request, res: Response) {
//     res.json({
//         status: 'ok',
//         app: 'allow!! API...',
//         version: '1.1.0'
//     });
// }).delete(function (req: Request, res: Response) {
//     res.json({
//         status: 'ok',
//         app: 'allow!! API...',
//         version: '1.1.0'
//     });
// });

// router.post('/allow/customers/blacklist', function (req: Request, res: Response) {
//     res.json({
//         status: 'ok',
//         app: 'allow!! API...',
//         version: '1.1.0'
//     });
// });
// router.post('/allow/customers/whitelist', function (req: Request, res: Response) {
//     res.json({
//         status: 'ok',
//         app: 'allow!! API...',
//         version: '1.1.0'
//     });
// });

// router.post('/initiate', kycController.initiateKYC);
// router.post('/verify-phone', kycController.verifyPhone);
// router.post('/verify-otp', kycController.verifyOTP);
// router.post('/submit-personal-info', kycController.submitPersonalInfo);
// router.post('/submit-identity', kycController.submitIdentity);
// router.post('/submit-address', kycController.submitAddress);
// router.post('/submit-bank-details', kycController.submitBankDetails);
// router.post('/grant-data-access', kycController.grantDataAccess);
// router.post('/perform-facial-recognition', kycController.performFacialRecognition);
// router.post('/complete-verification', kycController.completeVerification);
// router.get('/verified-data/:userId', kycController.getVerifiedData); // For startups to request data

export default router;