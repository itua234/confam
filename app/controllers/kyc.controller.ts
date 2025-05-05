import express, { Request as ExpressRequest, NextFunction, Response } from 'express';
//const { cloudinaryUpload, uploadToBlob } = require('../../services/cloudinary');
const { sequelize, models: { Request, Customer, Document } } = require('@models').default;
import crypto from 'crypto';
const { encrypt, decrypt } = require('@util/helper');
import { Transaction } from 'sequelize';
import { ref } from 'process';
const tokenVaultService = require('@services/tokenVaultService');

function generateToken() {
    return crypto.randomBytes(24).toString('hex'); // Generate a 64-character hex token
}
// Function to generate a unique hash for the identity document
function generateIdentityHash(type: string, number: string) {
    const identityString = `${type}:${number}`;
    return crypto.createHash('sha256').update(identityString).digest('hex');
}
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.initiate = async(req: ExpressRequest, res: Response) => {
    const {
        customer,
        reference,
        redirect_url,
        kyc_level,
        bank_accounts,
    } = req.body;
    try{
        const kyc_token = generateToken();
        // Create request and customer atomically
        const result = await sequelize.transaction(async (t: Transaction) => {
            const request = await Request.create({
                company_id: (req.app as any).company_id,
                reference,
                redirect_url,
                kyc_level,
                bank_accounts,
                kyc_token: kyc_token,
                token_expires_at: new Date(Date.now() + 3600 * 1000), // 1 hour from now
            }, { transaction: t });

            // Store the token mapping securely
            await tokenVaultService.storeToken(kyc_token, customer);

            return { request, customer };
        });

        const data = {
            "id": result.request.id,
            "customer": result.request.kyc_token,
            "allow_url": result.request.allow_url,
            reference: result.request.reference,
            "redirect_url": result.request.redirect_url,
            "bank_accounts": result.request.bank_accounts,
            "kyc_level": result.request.kyc_level,
            is_blacklisted: false
        };

        return res.status(200).json({
            message: 'KYC process initiated successfully',
            results: data,
            error: false
        });
    } catch (error) {
        console.log('Error initiating kyc process:', error);
        return res.status(500).json({
            message: 'An error occurred while initiating the KYC process',
            error: true
        });
    }
}

exports.showVerificationPage = async(req: ExpressRequest, res: Response) => {
    const { kyc_token } = req.params;
    try {
        // Retrieve the customer data securely using the token
        const customer = await tokenVaultService.retrieveIdentity(kyc_token);
        if (!customer) {
            return res.status(404).json({
                message: 'Customer not found or token expired',
                error: true
            });
        }
        // const request = await Request.findOne({
        //     where: {
        //         kyc_token,
        //         token_expires_at: { [Op.gt]: new Date() },
        //         token_used: false
        //     }
        // });
        const request = await Request.findOne({ where: { kyc_token } });
        if (!request) return;
        //return res.redirect('/expired-or-invalid-token');
        return res.render('main', { request, customer });
        // Generate a session-based verification token
        // const sessionToken = crypto.randomBytes(32).toString('hex');
        // await tokenVaultService.storeSessionToken(sessionToken, kyc_token, {
        //     expiresIn: '15m'
        // });
        // // Mark original token as used
        // await request.update({ token_used: true });
        // // Render with minimal data
        // return res.render('main', {
        //     sessionToken,
        //     flow: request.kyc_level
        // });

    } catch (error) {
        console.error('Error in verification page:', error);
        return res.redirect('/error');
    }
}

exports.verifyPhone = async(req: ExpressRequest, res: Response) => {
    const { phone, kyc_token } = req.body;
    try {
        // Check if token is valid
        const request = await Request.findOne({ where: { kyc_token } });
        if (!request) {
            return res.status(404).json({
                message: 'Invalid or expired token',
                error: true
            });
        }
        // Generate and store OTP securely
        const otp = generateOTP();
        const encryptedPhone = encrypt(phone);
        
        // Store OTP and phone temporarily (expires in 10 minutes)
        await tokenVaultService.storeOTP(kyc_token, {
            phone: encryptedPhone,
            otp,
            expires: Date.now() + (10 * 60 * 1000)
        });

        // TODO: Send OTP via SMS service
        console.log('OTP for testing:', otp);

        return res.status(200).json({
            message: 'OTP sent successfully',
            error: false
        });
    } catch (error) {
        console.log('Error in phone verification:', error);
        return res.status(500).json({
            message: 'An error occurred during phone verification',
            error: true
        });
    }
}

exports.verifyOTP = async(req: ExpressRequest, res: Response) => {
    const { otp, kyc_token } = req.body;
    try {
        // Retrieve stored OTP data
        const otpData = await tokenVaultService.retrieveOTP(kyc_token);
        if (!otpData || otpData.expires < Date.now()) {
            return res.status(400).json({
                message: 'OTP expired or invalid',
                error: true
            });
        }
        if (otp !== otpData.otp) {
            return res.status(400).json({
                message: 'Invalid OTP',
                error: true
            });
        }

        // Check for existing customer with this phone
        const existingCustomer = await Customer.findOne({
            where: { phone: encrypt(otpData.phone) },
            attributes: ['id', 'verified_at'],
        });

        // Clear OTP data
        await tokenVaultService.clearOTP(kyc_token);

        return res.status(200).json({
            message: 'OTP verified successfully',
            hasExistingVerification: !!existingCustomer?.verified_at,
            error: false
        });
    } catch (error) {
        console.log('Error in OTP verification:', error);
        return res.status(500).json({
            message: 'An error occurred during OTP verification',
            error: true
        });
    }
}

exports.verifyStep = async (req: ExpressRequest, res: Response) => {
    const { sessionToken } = req.body;
    
    // This will get the kyc_token and invalidate the session
    const kyc_token = await tokenVaultService.validateSession(sessionToken);
    if (!kyc_token) {
        return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Continue with verification...
}

// exports.verifyPhone = async(req: ExpressRequest, res: Response) => {
//     const { phone, sessionToken } = req.body;
    
//     try {
//         // Get session data including progress
//         const sessionData = await tokenVaultService.getSessionData(sessionToken);
//         if (!sessionData) {
//             return res.status(401).json({ error: 'Invalid session' });
//         }

//         // Check if phone is already verified in database
//         const customer = await Customer.findOne({
//             where: { kyc_token: sessionData.kyc_token }
//         });

//         if (customer.phone_verified_at) {
//             return res.status(409).json({
//                 error: 'Phone already verified',
//                 shouldRefresh: true // Tell frontend to refresh state
//             });
//         }

//         // Continue with verification...
//         await sequelize.transaction(async (t) => {
//             await customer.update({
//                 phone: encrypt(phone),
//                 phone_verified_at: new Date()
//             }, { transaction: t });
//         });

//         // Update session progress
//         const newSessionToken = await tokenVaultService.progressSession(sessionToken, 'phone');

//         return res.json({
//             success: true,
//             sessionToken: newSessionToken
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         return res.status(500).json({ error: 'Server error' });
//     }
// };
// export const logVerificationAttempt = async (requestId: string, status: string, metadata: any) => {
//     await AuditLog.create({
//         request_id: requestId,
//         action: 'VERIFICATION_ATTEMPT',
//         status,
//         metadata,
//         ip_address: metadata.ip,
//         user_agent: metadata.userAgent
//     });
// };
// <input type="hidden" name="sessionToken" value="<%= sessionToken %>" />