import express, { Request as ExpressRequest, NextFunction, Response } from 'express';
//const { cloudinaryUpload, uploadToBlob } = require('../../services/cloudinary');
const { sequelize, models: { Request, Customer, Document, Company } } = require('@models').default;
import crypto from 'crypto';
const { encrypt, decrypt } = require('@util/encryption');
import { Transaction, Op } from 'sequelize';
import { ref } from 'process';
const tokenVaultService = require('@services/tokenVaultService');
//const { createDeterministicHash } = require('@/util/deterministicHash');

// const generateToken = () => nanoid(32); // For reusable customer token
// const generateRequestSessionToken = () => nanoid(20); // For request-specific token
function generateToken() {
    return crypto.randomBytes(24).toString('hex'); // Generate a 64-character hex token
}
// Function to generate a unique hash for the identity document
function createIdentityHash(type: string, number: string) {
    const identityString = `${type}:${number}`;
    return crypto.createHash('sha256').update(identityString).digest('hex');
}
function hashFunction(value: string) {
    if (!value) return null;
    // Normalize the input (e.g., trim whitespace, convert to lowercase for email)
    const normalizedValue = String(value).trim().toLowerCase();
    return crypto.createHash('sha256').update(normalizedValue).digest('hex');
}
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

interface KYCInitiationPayload {
    reference: string;
    redirect_url: string;
    kyc_level: 'tier_1' | 'tier_2' | 'tier_3';
    bank_accounts: boolean;
    customer: {
        name: string;
        email: string;
        address: string;
        identity: {
            type: 'NIN' | 'BVN';
            number: string;
        };
    };
}

exports.initiate = async(req: ExpressRequest, res: Response) => {
    const {
        customer,
        reference,
        redirect_url,
        kyc_level,
        bank_accounts,
    } = req.body;
    if(!reference) {
        return res.status(400).json({
            message: 'Invalid reference, please retry with a unique reference',
            error: true
        });
    }
    if (!customer || !customer.name || !customer.email || !customer.address || !customer.identity ||
        !customer.identity.type || !customer.identity.number ||
        !redirect_url || !kyc_level) {
        return res.status(400).json({
            message: 'Missing required customer or request fields.',
            error: true
        });
    }
    // Ensure the identity type is one of the expected types
    const validIdentityTypes = ['BVN', 'NIN']; // Add other types if your Document model supports them
    if (!validIdentityTypes.includes(customer.identity.type.toUpperCase())) {
        return res.status(400).json({
            message: `Invalid identity type: ${customer.identity.type}. Must be one of ${validIdentityTypes.join(', ')}.`,
            error: true
        });
    }
    try{
        const kyc_token = generateToken();
        // Encrypt the initial customer PII
        const encrypted_data = encrypt(JSON.stringify(customer));
        // Get company_id from req.app or wherever it's stored
        const app = (req.app as any);
        const webhook_url = app.webhook_url;
        
        // Create request and customer atomically
        const result = await sequelize.transaction(async (t: Transaction) => {
            const request = await Request.create({
                company_id: app.company_id,
                reference,
                redirect_url,
                kyc_level,
                bank_accounts_requested: bank_accounts,
                kyc_token: kyc_token,
                token_expires_at: new Date(Date.now() + 3600 * 1000), // 1 hour from now
                encrypted_data
            }, { transaction: t });

            // Store the token mapping securely
            //await tokenVaultService.storeToken(kyc_token, customer);

            return { request, customer };
        });

        const data = {
            "id": result.request.id,
            customer: result.customer.token || result.request.kyc_token,
            "allow_url": result.request.allow_url,
            reference: result.request.reference,
            "redirect_url": result.request.redirect_url,
            "bank_accounts": result.request.bank_accounts_requested,
            "kyc_level": result.request.kyc_level,
            is_blacklisted: false
        };

        // --- Send Webhook Request ---
        if (webhook_url) {
            const payload = {
                event: 'kyc.initiation.requested',
                data: {
                    app: app.id,
                    business: app.company_id,
                    id: result.request.id,
                    status: result.request.status,
                    reference: result.request.reference,
                    created_at: result.request.created_at,
                    kyc_level: result.request.kyc_level,
                    bank_accounts: result.request.bank_accounts_requested,
                    is_blacklisted: false,
                    meta: {}
                }
            };
            // Using a non-blocking approach for webhook sending
            // This means the API response won't wait for the webhook to complete.
            // For production, consider using a message queue (e.g., RabbitMQ, Kafka)
            // or a dedicated background job for more reliable webhook delivery and retries.
        }

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


async function lookupCustomer(payload: any) {
    const { customer } = payload;
    let foundCustomer = null;
    // Case 1: Lookup by email if available
    if (customer.email) {
        foundCustomer = await Customer.findOne({
            where: { email: customer.email },
        });
    }
    // Case 2: If no customer is found by email, try lookup via identity details
    if (!foundCustomer && customer.identity) {
        const { type, number } = customer.identity;
        // Compute a hash of the identity number if that is how you store it.
        const identityHash = hashFunction(number);
        const foundIdentity = await Identity.findOne({
            where: {
                type: type,
                value: identityHash,
            },
            include: [
                {
                    model: Customer,
                    as: 'customer',
                },
            ]
        });
        if (foundIdentity && foundIdentity.customer) {
            console.log(`Customer found by ${foundIdentity.type} in identity records`);
            foundCustomer = foundIdentity.customer;
        }
    }
    return foundCustomer;
}
/**
   * Create new customer record
   */
const createNewCustomer = async (payload: any) => {
    const { customer: customerData } = payload;
    const identityHash = hashFunction(customerData.identity.number);
    
    const newCustomer = await Customer.create({
        token: generateToken(),
        phone: null, // Will be updated during verification
        phone_hash: null,
        dob: new Date(), // Placeholder, will be updated from verification
        dob_hash: hashFunction(new Date().toISOString()),
        // Set identity fields
        [customerData.identity.type.toLowerCase()]: customerData.identity.number,
        [`${customerData.identity.type.toLowerCase()}_hash`]: identityHash,
      
        // Store customer data in encrypted PII
        encrypted_pii: encrypt(JSON.stringify({
            name: customerData.name,
            email: customerData.email,
            address: customerData.address,
            identity_type: customerData.identity.type,
            identity_number: customerData.identity.number
        })),
      
        status: 'pending',
        kyc_level_achieved: 'none',
        is_blacklisted: false
    });
    
    console.log('New customer created:', newCustomer.id);
    return newCustomer;
}

exports.fetch_kyc_request = async(req: ExpressRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            message:  'Invalid KYC request ID',
            error: true
        });
    }
    try {
       const request = await Request.findOne({ 
            where: { 
                id,
                token_expires_at: { [Op.gt]: new Date() }
            } 
        });
        if (!request) {
            return res.status(400).json({
                message: 'Invalid KYC request ID',
                error: true
            });
        }
        // Decrypt initial customer data to pre-fill if needed, or get phone number from it
        const customer = JSON.parse(decrypt(request.encrypted_data));
        
        const identityNumberHash = createIdentityHash(
            customer.identity.type,
            customer.identity.number
        );  
        const document = await Document.findOne({
            where: {
                identity_number_hash: identityNumberHash
            }
        });
        console.log('Document found:', document);
        if(document) {
            const existing_customer = await Customer.findOne({
                where: { id: document.customer_id }
            });
            console.log('Existing customer found:', existing_customer);
            customer.token = existing_customer.token;
        }
        
        //return res.redirect('/expired-or-invalid-token');
        //return res.render('main', { request, customer });
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
        //console.log('Error in verification page:', error);
        return res.status(500).json({
            message: 'An error occurred while fetching verification page',
            error: true
        });
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