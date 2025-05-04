class KYCService {
    constructor(options) {
      this.companyId = options.companyId;
      this.apiKey = options.apiKey;
      this.environment = options.environment || 'production';
      this.baseUrl = this.environment === 'sandbox' 
        ? 'https://sandbox.yourkycapi.com' 
        : 'https://api.yourkycapi.com';
      this.modal = null;
    }
  
    init() {
      // Load any required CSS
      this.injectStyles();
    }
  
    verifyUser(options) {
      return new Promise((resolve, reject) => {
        // Check if user is already verified
        this.checkExistingVerification(options.userIdentifier)
          .then(existing => {
            if (existing) {
              resolve(existing);
            } else {
              this.showVerificationModal(options)
                .then(result => resolve(result))
                .catch(err => reject(err));
            }
          })
          .catch(err => reject(err));
      });
    }
  
    checkExistingVerification(userIdentifier) {
      // Hash the identifier (email/phone) to match with stored users
      const hashedIdentifier = this.hashIdentifier(userIdentifier);
      
      return fetch(`${this.baseUrl}/api/users/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-ID': this.companyId,
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({ hashedIdentifier })
      }).then(response => response.json());
    }
  
    showVerificationModal(options) {
      return new Promise((resolve, reject) => {
        // Create and show modal
        this.modal = document.createElement('div');
        this.modal.id = 'kyc-verification-modal';
        this.modal.innerHTML = `
          <div class="kyc-modal-content">
            <h2>Identity Verification</h2>
            <div class="kyc-steps"></div>
            <button class="kyc-close">×</button>
          </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Implement verification steps (ID upload, selfie, etc.)
        this.initVerificationFlow(options)
          .then(result => {
            this.closeModal();
            resolve(result);
          })
          .catch(err => {
            this.closeModal();
            reject(err);
          });
      });
    }
  
    // ... other methods for verification flow
  }
  
  // Make it available globally
  window.KYCService = KYCService;