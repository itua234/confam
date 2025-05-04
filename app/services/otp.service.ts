const { v4: uuidv4 } = require('uuid');
const otpStorage: Record<string, any> = {}; // In-memory storage for OTPs (replace with Redis in production)

export default class OTPService {
  async generateOTP(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes
    otpStorage[phone] = { otp, expiry };
    console.log(`Generated OTP for ${phone}: ${otp}`);
    return otp;
  }

  async sendOTP(phone: string, otp: string | number) {
    console.log(`Simulating sending OTP "${otp}" to ${phone}`);
    return true;
  }

  async verifyOTP(phone: string, enteredOTP: string | number) {
    const storedData = otpStorage[phone];
    if (storedData && storedData.expiry > Date.now() && storedData.otp === enteredOTP) {
      delete otpStorage[phone]; // Remove OTP after successful verification
      return true;
    }
    return false;
  }
}