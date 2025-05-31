require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const { encrypt, decrypt } = require('./utils/encryption');
const { sendOtpSms } = require('./services/smsService'); // New service

const KycRequest = require('./models/KycRequest');
const CustomerKycProfile = require('./models/CustomerKycProfile');
const OtpSession = require('./models/OtpSession');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For handling form submissions from redirect

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- API Endpoint for Partner to Initiate KYC ---
// POST /api/kyc/initiate
app.post('/api/kyc/initiate', async (req, res) => {
    try {
        const { reference, redirect_url, kyc_level, bank_accounts, customer } = req.body;

        // Basic validation
        if (!reference || !redirect_url || !kyc_level || !customer || !customer.name || !customer.email || !customer.identity) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Encrypt the initial customer PII
        const encryptedCustomerInitialData = encrypt(JSON.stringify(customer));

        // Check if a profile already exists for this customer (e.g., by identity.number or email)
        // For BVN/NIN, this is a strong identifier.
        let existingKycProfile = await CustomerKycProfile.findOne({
            'encryptedPii': { $regex: customer.identity.number, $options: 'i' } // Simplified check, ideally decrypt and match
        });

        let customerKycToken;
        if (existingKycProfile) {
            // Customer already exists and has a KYC profile
            customerKycToken = existingKycProfile.kycToken;
            console.log(`Re-using existing KYC profile for ${customer.email}, token: ${customerKycToken}`);
            // You might want to update kyc_level if requested level is higher
            if (kyc_level > existingKycProfile.kycLevelAchieved) {
                // Trigger an update process or re-verification for higher tier
                // For simplicity, we'll assume it's implicitly handled.
            }
        } else {
            // New customer, generate a new token
            customerKycToken = nanoid(20); // Shorter for URL-friendliness
            const newKycProfile = new CustomerKycProfile({
                kycToken: customerKycToken,
                encryptedPii: encryptedCustomerInitialData, // Initial PII, will be updated upon full verification
                kycStatus: 'pending',
                kycLevelAchieved: 'none',
                isBlacklisted: false
            });
            await newKycProfile.save();
            console.log(`Created new KYC profile for ${customer.email}, token: ${customerKycToken}`);
        }

        const requestId = nanoid(10); // Unique request ID
        const allowUrl = `${process.env.BASE_URL}/kyc/allow?id=${requestId}`; // Construct your allow URL

        // Store the KYC request
        const kycRequest = new KycRequest({
            requestId: requestId,
            partnerReference: reference,
            redirectUrl: redirect_url,
            kycLevelRequested: kyc_level,
            bankAccountsRequested: bank_accounts,
            encryptedCustomerInitialData: encryptedCustomerInitialData,
            customerKycToken: customerKycToken,
            status: 'initiated'
        });
        await kycRequest.save();

        res.status(200).json({
            id: requestId,
            customer: customerKycToken,
            allow_url: allowUrl,
            reference: reference,
            redirect_url: redirect_url,
            bank_accounts: bank_accounts,
            kyc_level: kyc_level, // This is the *requested* level
            is_blacklisted: existingKycProfile ? existingKycProfile.isBlacklisted : false // Default for new is false
        });

    } catch (error) {
        console.error('Error initiating KYC:', error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

// --- User lands on this page via redirect from partner ---
// GET /kyc/allow
app.get('/kyc/allow', async (req, res) => {
    try {
        const { id: requestId } = req.query; // Get the request ID from query params

        if (!requestId) {
            return res.status(400).send('Invalid KYC request ID.');
        }

        const kycRequest = await KycRequest.findOne({ requestId });

        if (!kycRequest) {
            return res.status(404).send('KYC request not found.');
        }

        // Decrypt initial customer data to pre-fill if needed, or get phone number from it
        const initialCustomerData = JSON.parse(decrypt(kycRequest.encryptedCustomerInitialData));
        const customerKycProfile = await CustomerKycProfile.findOne({ kycToken: kycRequest.customerKycToken });

        // If phone number is already verified for this customer, we might skip OTP step
        if (customerKycProfile && customerKycProfile.isPhoneNumberVerified && customerKycProfile.phoneNumber) {
            // If already verified, directly proceed to final KYC verification or completion
            // For now, redirect to a "KYC already completed" or direct to final step.
            // In a real system, you'd trigger the actual KYC check here if not done,
            // then redirect to partner.
            console.log(`Phone number already verified for ${customerKycProfile.phoneNumber}.`);
            // Trigger actual KYC verification if not already done
            if (customerKycProfile.kycStatus !== 'verified') {
                 // **Trigger actual KYC verification with 3rd party here**
                 // A separate async process or function call
                 await performKycVerification(customerKycProfile, kycRequest); // Function to be implemented below
            }
            return res.redirect(`${kycRequest.redirectUrl}?customer_token=${kycRequest.customerKycToken}&status=completed`);
        }

        // Render a page/modal that asks for phone number and sends OTP
        // This would be a simple HTML page or a frontend framework rendering a modal
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>KYC Verification</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; }
                    .modal-content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
                    input { padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; width: calc(100% - 22px); }
                    button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    button:hover { background-color: #0056b3; }
                    #message { color: green; margin-top: 10px; }
                    #error { color: red; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="modal-content">
                    <h2>Verify Your Phone Number for KYC</h2>
                    <p>A phone number is required for subsequent KYC processes.</p>
                    <form id="otpForm">
                        <input type="tel" id="phoneNumber" placeholder="Enter your phone number (e.g., 08012345678)" required value="${initialCustomerData.customer.phoneNumber || ''}">
                        <button type="button" onclick="sendOtp()">Send OTP</button>
                        <div id="otpInput" style="display:none;">
                            <input type="text" id="otpCode" placeholder="Enter OTP" required>
                            <button type="submit">Verify OTP</button>
                        </div>
                        <p id="message"></p>
                        <p id="error"></p>
                    </form>
                </div>

                <script>
                    const requestId = "${requestId}";
                    const kycToken = "${kycRequest.customerKycToken}";
                    let phoneNumberValue = document.getElementById('phoneNumber').value; // Get initial value

                    async function sendOtp() {
                        phoneNumberValue = document.getElementById('phoneNumber').value;
                        if (!phoneNumberValue) {
                            document.getElementById('error').innerText = 'Please enter a phone number.';
                            return;
                        }
                        document.getElementById('message').innerText = 'Sending OTP...';
                        document.getElementById('error').innerText = '';

                        try {
                            const response = await fetch('/api/otp/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ phoneNumber: phoneNumberValue, kycToken: kycToken })
                            });
                            const data = await response.json();
                            if (response.ok) {
                                document.getElementById('message').innerText = 'OTP sent successfully! Check your phone.';
                                document.getElementById('otpInput').style.display = 'block';
                            } else {
                                document.getElementById('error').innerText = data.message || 'Failed to send OTP.';
                                document.getElementById('message').innerText = '';
                            }
                        } catch (err) {
                            document.getElementById('error').innerText = 'Network error. Please try again.';
                            document.getElementById('message').innerText = '';
                        }
                    }

                    document.getElementById('otpForm').addEventListener('submit', async function(event) {
                        event.preventDefault();
                        const otpCode = document.getElementById('otpCode').value;
                        if (!otpCode) {
                            document.getElementById('error').innerText = 'Please enter the OTP.';
                            return;
                        }
                        document.getElementById('message').innerText = 'Verifying OTP...';
                        document.getElementById('error').innerText = '';

                        try {
                            const response = await fetch('/api/otp/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ phoneNumber: phoneNumberValue, otp: otpCode, kycToken: kycToken, requestId: requestId })
                            });
                            const data = await response.json();
                            if (response.ok) {
                                document.getElementById('message').innerText = 'OTP verified! Redirecting...';
                                window.location.href = data.redirect_url; // Redirect to partner's URL
                            } else {
                                document.getElementById('error').innerText = data.message || 'OTP verification failed.';
                                document.getElementById('message').innerText = '';
                            }
                        } catch (err) {
                            document.getElementById('error').innerText = 'Network error during OTP verification.';
                            document.getElementById('message').innerText = '';
                        }
                    });
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error on /kyc/allow:', error);
        res.status(500).send('An error occurred during KYC process initiation.');
    }
});

// --- OTP Sending Endpoint ---
// POST /api/otp/send
app.post('/api/otp/send', async (req, res) => {
    try {
        const { phoneNumber, kycToken } = req.body;
        if (!phoneNumber || !kycToken) {
            return res.status(400).json({ message: 'Phone number and KYC token are required.' });
        }

        // Basic phone number format validation (improve this for production)
        if (!/^\d{10,15}$/.test(phoneNumber)) {
            return res.status(400).json({ message: 'Invalid phone number format.' });
        }

        // Ensure the KYC token exists
        const customerProfile = await CustomerKycProfile.findOne({ kycToken });
        if (!customerProfile) {
            return res.status(404).json({ message: 'KYC profile not found for this token.' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        // Store OTP
        // Consider invalidating previous OTPs for the same number/token if multiple requests are made
        await OtpSession.deleteMany({ phoneNumber, kycToken }); // Clear old OTPs
        const otpSession = new OtpSession({ phoneNumber, otp, expiresAt, kycToken });
        await otpSession.save();

        // Send OTP via SMS service
        const smsSent = await sendOtpSms(phoneNumber, otp);

        if (smsSent) {
            res.status(200).json({ message: 'OTP sent successfully.' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP SMS.' });
        }

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Internal server error sending OTP.' });
    }
});

// --- OTP Verification Endpoint ---
// POST /api/otp/verify
app.post('/api/otp/verify', async (req, res) => {
    try {
        const { phoneNumber, otp, kycToken, requestId } = req.body;
        if (!phoneNumber || !otp || !kycToken || !requestId) {
            return res.status(400).json({ message: 'Missing required OTP verification fields.' });
        }

        const otpRecord = await OtpSession.findOne({
            phoneNumber,
            otp,
            kycToken,
            expiresAt: { $gt: new Date() } // Not expired
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // OTP is valid. Mark phone as verified and trigger KYC processing.
        await OtpSession.deleteOne({ _id: otpRecord._id }); // Delete used OTP

        const customerProfile = await CustomerKycProfile.findOne({ kycToken });
        if (!customerProfile) {
            return res.status(404).json({ message: 'KYC profile not found for this token.' });
        }

        const kycRequest = await KycRequest.findOne({ requestId });
        if (!kycRequest) {
            return res.status(404).json({ message: 'KYC request not found.' });
        }

        customerProfile.phoneNumber = phoneNumber;
        customerProfile.isPhoneNumberVerified = true;
        customerProfile.updatedAt = new Date();
        await customerProfile.save();

        kycRequest.status = 'kyc_processing';
        kycRequest.updatedAt = new Date();
        await kycRequest.save();

        // **Important:** Trigger the actual KYC verification with 3rd party here asynchronously
        // This is where you'd call your BVN/NIN verification service.
        performKycVerification(customerProfile, kycRequest)
            .catch(err => console.error('Error in background KYC verification:', err)); // Handle errors

        // Redirect the user back to the partner's redirect_url with the token
        // You can add status query params here:
        const finalRedirectUrl = `${kycRequest.redirectUrl}?customer_token=${kycToken}&status=success&kyc_level=${customerProfile.kycLevelAchieved || kycRequest.kycLevelRequested}`;

        res.status(200).json({
            message: 'OTP verified successfully. KYC processing initiated.',
            redirect_url: finalRedirectUrl
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Internal server error verifying OTP.' });
    }
});


// --- Background KYC Verification Function ---
// This function will be called AFTER phone number is verified.
async function performKycVerification(customerProfile, kycRequest) {
    try {
        console.log(`Starting KYC verification for token: ${customerProfile.kycToken}`);

        // 1. Decrypt initial PII from the KYC request or customer profile
        const initialCustomerData = JSON.parse(decrypt(customerProfile.encryptedPii));
        const { name, email, address, identity } = initialCustomerData.customer;

        // 2. Integrate with 3rd party KYC provider (e.g., for BVN/NIN verification)
        // This is highly dependent on your chosen provider's API.
        // Example:
        // const kycProviderResult = await thirdPartyKycService.verifyIdentity({
        //     fullName: name,
        //     dob: initialCustomerData.customer.dob, // Assuming DOB is also in initial data
        //     idType: identity.type,
        //     idNumber: identity.number,
        //     phoneNumber: customerProfile.phoneNumber // Use the now verified phone number
        // });

        let kycVerifiedStatus = 'pending'; // Default
        let kycLevelAchieved = 'none';
        let isBlacklisted = false;
        let verifiedPii = initialCustomerData.customer; // Default to initial data

        // --- SIMULATED KYC PROVIDER CALL ---
        if (identity.type === 'BVN' && identity.number === '12345678900') {
            kycVerifiedStatus = 'verified';
            kycLevelAchieved = 'tier_1'; // Assuming BVN maps to tier 1
            isBlacklisted = false;
            // In a real scenario, the KYC provider returns verified data,
            // which you would use to update `verifiedPii`.
            verifiedPii = {
                name: "Samuel Olamide", // KYC provider might return standardized name
                email: "samuel.olamide@neem.com",
                address: "20, Angel's Place, Eke street off NTA road, Ikeja Lagos",
                identity: { type: "BVN", number: "12345678900" },
                phoneNumber: customerProfile.phoneNumber // From our verification
            };
        } else {
            kycVerifiedStatus = 'rejected';
            kycLevelAchieved = 'none';
            isBlacklisted = true; // Example: if KYC fails, mark as blacklisted
        }
        // --- END SIMULATED KYC PROVIDER CALL ---

        // 3. Update CustomerKycProfile with results
        customerProfile.kycStatus = kycVerifiedStatus;
        customerProfile.kycLevelAchieved = kycLevelAchieved;
        customerProfile.isBlacklisted = isBlacklisted;
        customerProfile.encryptedPii = encrypt(JSON.stringify(verifiedPii)); // Overwrite with verified PII
        customerProfile.verificationDetails = {
            provider: 'SimulatedKYCProvider', // Replace with actual provider name
            status: kycVerifiedStatus,
            externalId: `prov-id-${nanoid(15)}` // ID from external provider
        };
        customerProfile.updatedAt = new Date();
        await customerProfile.save();

        // 4. Update the original KycRequest status
        kycRequest.status = 'completed';
        kycRequest.updatedAt = new Date();
        await kycRequest.save();

        console.log(`KYC verification completed for token: ${customerProfile.kycToken}. Status: ${kycVerifiedStatus}`);

    } catch (error) {
        console.error(`Error during KYC verification for token ${customerProfile.kycToken}:`, error);
        // Mark KYC process as failed
        customerProfile.kycStatus = 'rejected';
        customerProfile.isBlacklisted = true; // Or handle failure differently
        customerProfile.updatedAt = new Date();
        await customerProfile.save();

        kycRequest.status = 'failed';
        kycRequest.updatedAt = new Date();
        await kycRequest.save();
    }
}


// --- Endpoint for external systems to query KYC status by token ---
// GET /api/kyc/status/:kycToken
app.get('/api/kyc/status/:kycToken', async (req, res) => {
    try {
        const { kycToken } = req.params;

        const customerProfile = await CustomerKycProfile.findOne({ kycToken });

        if (!customerProfile) {
            return res.status(404).json({ message: 'KYC token not found.' });
        }

        res.status(200).json({
            customer: customerProfile.kycToken,
            kyc_level: customerProfile.kycLevelAchieved,
            is_blacklisted: customerProfile.isBlacklisted,
            status: customerProfile.kycStatus,
            phoneNumberVerified: customerProfile.isPhoneNumberVerified
            // You might expose more data here if authorized and necessary
        });

    } catch (error) {
        console.error('Error fetching KYC status:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Save to Identity table for better data organization
const verificationResponse = await thirdPartyNinService.verify(nin);

if (verificationResponse.success) {
  // Update customer core fields
  await customer.update({
    nin: nin,
    nin_hash: hashFunction(nin),
    kyc_level_achieved: 'tier_1',
    status: customer.status === 'pending' ? 'verified' : customer.status,
    verified_at: new Date()
  });

  // Create identity record for NIN verification data
  await models.Identity.create({
    customer_id: customer.id,
    identity_type: 'NIN',
    identity_value: nin,
    verification_status: 'verified',
    verification_date: new Date(),
    verification_provider: 'NIMC',
    verification_reference: verificationResponse.reference_id,
    
    // Store personal details
    verified_data: encrypt(JSON.stringify({
      first_name: verificationResponse.data.first_name,
      last_name: verificationResponse.data.last_name,
      middle_name: verificationResponse.data.middle_name,
      date_of_birth: verificationResponse.data.date_of_birth,
      gender: verificationResponse.data.gender,
      address: verificationResponse.data.address,
      phone: verificationResponse.data.phone,
      verification_score: verificationResponse.data.confidence_score
    })),
    
    metadata: JSON.stringify({
      api_response_hash: hashFunction(JSON.stringify(verificationResponse)),
      verification_timestamp: verificationResponse.timestamp,
      data_quality_score: verificationResponse.data_quality_score
    })
  });
}

class CustomerVerificationService {
  static async processNinVerification(customer: CustomerAttributes, nin: string) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify with third party
      const verificationResponse = await thirdPartyNinService.verify(nin);
      
      if (!verificationResponse.success) {
        throw new Error(`NIN verification failed: ${verificationResponse.error}`);
      }

      // Update customer record
      await customer.update({
        nin: nin,
        nin_hash: hashFunction(nin),
        kyc_level_achieved: this.determineKycLevel(customer, 'nin_verified'),
        verification_details: JSON.stringify({
          ...JSON.parse(customer.verification_details || '{}'),
          nin_verification: {
            verified: true,
            date: new Date(),
            provider: verificationResponse.provider,
            reference: verificationResponse.reference_id,
            confidence_score: verificationResponse.confidence_score
          }
        })
      }, { transaction });

      // Store detailed verification data
      const identityRecord = await models.Identity.create({
        customer_id: customer.id,
        identity_type: 'NIN',
        identity_value: nin,
        verification_status: 'verified',
        verification_date: new Date(),
        verification_provider: verificationResponse.provider,
        verification_reference: verificationResponse.reference_id,
        
        verified_data: encrypt(JSON.stringify({
          personal_details: {
            first_name: verificationResponse.data.first_name,
            last_name: verificationResponse.data.last_name,
            middle_name: verificationResponse.data.middle_name,
            date_of_birth: verificationResponse.data.date_of_birth,
            gender: verificationResponse.data.gender
          },
          contact_details: {
            address: verificationResponse.data.address,
            phone: verificationResponse.data.phone,
            email: verificationResponse.data.email
          },
          verification_metadata: {
            confidence_score: verificationResponse.confidence_score,
            data_quality_indicators: verificationResponse.quality_indicators,
            verification_timestamp: verificationResponse.timestamp
          }
        }))
      }, { transaction });

      // Update customer status if needed
      if (customer.status === 'pending') {
        await customer.update({
          status: 'verified',
          verified_at: new Date()
        }, { transaction });
      }

      await transaction.commit();
      
      return {
        success: true,
        customer_updated: true,
        identity_record_id: identityRecord.id,
        kyc_level: customer.kyc_level_achieved
      };

    } catch (error) {
      await transaction.rollback();
      
      // Log failed verification attempt
      await models.Identity.create({
        customer_id: customer.id,
        identity_type: 'NIN',
        identity_value: nin,
        verification_status: 'failed',
        verification_date: new Date(),
        verification_provider: 'NIMC',
        metadata: JSON.stringify({
          error: error.message,
          verification_attempt: true
        })
      });
      
      throw error;
    }
  }

  private static determineKycLevel(customer: CustomerAttributes, newVerification: string): string {
    // Logic to determine appropriate KYC level based on completed verifications
    const currentLevel = customer.kyc_level_achieved;
    
    if (newVerification === 'nin_verified' && currentLevel === 'none') {
      return 'tier_1';
    }
    
    // Add more logic based on your KYC requirements
    return currentLevel;
  }
}