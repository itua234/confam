const { KYCData, User } = require('../models');

class DataSharingService {
  async getVerifiedKYCData(userId, fieldsToShare) {
    const kycData = await KYCData.findOne({
      where: { userId, isVerified: true },
      include: [{ model: User, as: 'user' }],
    });

    if (!kycData) {
      return null;
    }

    const dataToShare = {};
    if (fieldsToShare && Array.isArray(fieldsToShare)) {
      fieldsToShare.forEach(field => {
        if (kycData[field] !== undefined) {
          dataToShare[field] = kycData[field];
        }
        if (kycData.user && kycData.user[field] !== undefined) {
          dataToShare[field] = kycData.user[field];
        }
      });
    } else {
      // Share all relevant data by default
      dataToShare.phoneNumber = kycData.user.phoneNumber;
      dataToShare.dateOfBirth = kycData.user.dateOfBirth;
      dataToShare.nin = kycData.nin;
      dataToShare.bvn = kycData.bvn;
      dataToShare.governmentIdType = kycData.governmentIdType;
      dataToShare.governmentIdNumber = kycData.governmentIdNumber;
      dataToShare.address = kycData.address;
      dataToShare.bankName = kycData.bankName;
      dataToShare.bankAccountNumber = kycData.bankAccountNumber;
      dataToShare.facialRecognitionStatus = kycData.facialRecognitionStatus;
      // ... other relevant fields
    }

    return dataToShare;
  }
}

module.exports = new DataSharingService();