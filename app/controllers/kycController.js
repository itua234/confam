// kyc-widget-service/controllers/kycController.js
const { User, KYCData } = require('../models');
const otpService = require('../services/otpService');
const ninBvnService = require('../services/ninBvnService');
const idVerificationService = require('../services/idVerificationService');
const bankVerificationService = require('../services/bankVerificationService');
const facialRecognitionService = require('../services/facialRecognitionService');
const { v4: uuidv4 } = require('uuid');

const kycSessions = {}; // In-memory storage for KYC sessions (replace with Redis in production)

class KYCController {
  async initiateKYC(req, res) {
    const { phoneNumber, dateOfBirth, startupId, redirectUrl } = req.body; // Expect startupId

    if (!phoneNumber || !dateOfBirth || !startupId || !redirectUrl) {
      return res.status(400).json({ error: 'Missing required fields for KYC initiation' });
    }

    try {
      const user = await User.findOrCreate({
        where: { phoneNumber },
        defaults: { dateOfBirth },
      });

      const sessionId = uuidv4();
      kycSessions[sessionId] = {
        userId: user[0].id,
        startupId,
        redirectUrl,
        currentStep: 'phone-otp',
        kycData: {},
      };

      const otp = await otpService.generateOTP(phoneNumber);
      await otpService.sendOTP(phoneNumber, otp);

      res.status(200).json({ sessionId, message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error initiating KYC:', error);
      res.status(500).json({ error: 'Failed to initiate KYC' });
    }
  }

  async verifyOTP(req, res) {
    const { sessionId, otp } = req.body;
    const session = kycSessions[sessionId];

    if (!session) {
      return res.status(404).json({ error: 'Invalid or expired session' });
    }

    try {
      const user = await User.findByPk(session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (await otpService.verifyOTP(user.phoneNumber, otp)) {
        session.currentStep = 'personal-info';
        res.status(200).json({ message: 'OTP verified successfully', nextStep: 'personal-info' });
      } else {
        res.status(400).json({ error: 'Invalid OTP' });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }

  async submitPersonalInfo(req, res) {
    const { sessionId, firstName, lastName /* ... other personal info ... */ } = req.body;
    const session = kycSessions[sessionId];

    if (!session || session.currentStep !== 'personal-info') {
      return res.status(400).json({ error: 'Invalid session or step' });
    }

    session.kycData = { ...session.kycData, firstName, lastName /* ... other personal info ... */ };
    session.currentStep = 'identity';
    res.status(200).json({ message: 'Personal info submitted', nextStep: 'identity' });
  }

  async submitIdentity(req, res) {
    const { sessionId, identityType, identityNumber, identityImage } = req.body;
    const session = kycSessions[sessionId];

    if (!session || session.currentStep !== 'identity') {
      return res.status(400).json({ error: 'Invalid session or step' });
    }

    session.kycData = { ...session.kycData, governmentIdType: identityType, governmentIdNumber: identityNumber, governmentIdImage: identityImage };

    // Simulate identity verification
    const verificationResult = await idVerificationService.verifyID(identityType, identityNumber, identityImage);
    if (verificationResult.isValid) {
      session.currentStep = 'address';
      res.status(200).json({ message: 'Identity submitted and verified (simulated)', nextStep: 'address' });
    } else {
      return res.status(400).json({ error: 'Identity verification failed (simulated)' });
    }
  }

  async submitAddress(req, res) {
    const { sessionId, address } = req.body;
    const session = kycSessions[sessionId];

    if (!session || session.currentStep !== 'address') {
      return res.status(400).json({ error: 'Invalid session or step' });
    }

    session.kycData = { ...session.kycData, address };
    session.currentStep = 'bank-details';
    res.status(200).json({ message: 'Address submitted', nextStep: 'bank-details' });
  }

  async submitBankDetails(req, res) {
    const { sessionId, bankName, bankAccountNumber } = req.body;
    const session = kycSessions[sessionId];

    if (!session || session.currentStep !== 'bank-details') {
      return res.status(400).json({ error: 'Invalid session or step' });
    }

    session.kycData = { ...session.kycData, bankName, bankAccountNumber };

    // Simulate bank account verification
    const verificationResult = await bankVerificationService.verifyAccount(bankName, bankAccountNumber);
    if (verificationResult.isValid) {
      session.currentStep = 'data-access';
      res.status(200).json({ message: 'Bank details submitted and verified (simulated)', nextStep: 'data-access' });
    } else {
      return res.status(400).json({ error: 'Bank account verification failed (simulated)' });
    }
  }

  async grantDataAccess(req, res) {
    const { sessionId, dataAccessPermission } = req.body;
    const session = kycSessions[sessionId];

    if (!session || session.currentStep !== 'data-access') {
      return res.status(400).json({ error: 'Invalid session or step' });
    }

    session.kycData.dataAccessPermission = dataAccessPermission === true;
    session.currentStep = 'facial-recognition';
    res.status(200).json({ message: 'Data access permission granted', nextStep: 'facial-recognition' });
  }

  async performFacialRecognition(req, res) {
    const { sessionId, faceImage } = req.body;
    const session = kycSessions[sessionId];

    if (!session || session.currentStep !== 'facial-recognition') {
      return res.





      const { User, KYCData, KYCRequest } = require('../models');
const otpService = require('../services/otpService');
const { v4: uuidv4 } = require('uuid');

const WIDGET_BASE_URL = process.env.WIDGET_BASE_URL || 'http://localhost:8080/widget'; // Your hosted widget URL

class KYCController {
  async initiateKYC(req, res) {
    const { reference, redirect_url, kyc_level, bank_accounts, customer, startupId } = req.body;

    if (!reference || !redirect_url || !startupId || !customer?.name) {
      return res.status(400).json({ error: 'Missing required fields for KYC initiation' });
    }

    try {
      const kycRequest = await KYCRequest.create({
        reference,
        startupId,
        redirectUrl: redirect_url,
        kycLevel: kyc_level,
        bankAccountsRequired: bank_accounts,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        identityType: customer.identity?.type,
        identityNumber: customer.identity?.number,
        status: 'initiated',
      });

      const widgetUrl = `${WIDGET_BASE_URL}?kycRequestId=${kycRequest.id}`;
      res.status(200).json({ widgetUrl });
    } catch (error) {
      console.error('Error initiating KYC:', error);
      res.status(500).json({ error: 'Failed to initiate KYC' });
    }
  }

  async verifyPhone(req, res) {
    const { kycRequestId, phoneNumber } = req.body;

    if (!kycRequestId || !phoneNumber) {
      return res.status(400).json({ error: 'Missing KYC Request ID or Phone Number' });
    }

    try {
      const kycRequest = await KYCRequest.findByPk(kycRequestId);
      if (!kycRequest) {
        return res.status(404).json({ error: 'KYC Request not found' });
      }

      const [user] = await User.findOrCreate({
        where: { phoneNumber },
        defaults: { dateOfBirth: new Date() }, // You might not have DOB at this stage
      });

      kycRequest.userId = user.id;
      await kycRequest.save();

      const otp = await otpService.generateOTP(phoneNumber);
      await otpService.sendOTP(phoneNumber, otp);

      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error verifying phone:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }

  async verifyOTP(req, res) {
    const { kycRequestId, otp } = req.body;

    if (!kycRequestId || !otp) {
      return res.status(400).json({ error: 'Missing KYC Request ID or OTP' });
    }

    try {
      const kycRequest = await KYCRequest.findByPk(kycRequestId, { include: 'user' });
      if (!kycRequest || !kycRequest.user) {
        return res.status(404).json({ error: 'KYC Request or associated User not found' });
      }

      if (await otpService.verifyOTP(kycRequest.user.phoneNumber, otp)) {
        kycRequest.status = 'phone_verified';
        await kycRequest.save();
        res.status(200).json({ message: 'OTP verified successfully' });
      } else {
        res.status(400).json({ error: 'Invalid OTP' });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }

  // ... other controller methods for submitting personal info, identity, etc.,
  // will now use the kycRequestId to track the user's progress within the session.

  async submitPersonalInfo(req, res) {
    const { kycRequestId, firstName, lastName, dateOfBirth } = req.body;
    // ... find KYCRequest, update User or create KYCData ...
  }

  async submitIdentity(req, res) {
    const { kycRequestId, identityType, identityNumber, identityImage } = req.body;
    // ... find KYCRequest, update KYCData ...
  }

  // ... and so on for other steps, using kycRequestId to manage the session.

  async completeVerification(req, res) {
    const { kycRequestId } = req.body;
    // ... find KYCRequest, perform final checks, update status to 'kyc_completed' ...
  }

  async getVerifiedData(req, res) {
    const { userId } = req.params;
    // ... logic to retrieve and share verified data (with consent) ...
  }
}

module.exports = new KYCController();