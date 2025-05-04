// Example widget.js (simplified)
document.addEventListener('DOMContentLoaded', () => {
    const startKycButton = document.getElementById('startKyc');
    const phoneVerificationDiv = document.getElementById('phoneVerification');
    const otpVerificationDiv = document.getElementById('otpVerification');
    const phoneInput = document.getElementById('phoneNumber');
    const sendOtpButton = document.getElementById('sendOtp');
    const otpInput = document.getElementById('otp');
    const verifyOtpButton = document.getElementById('verifyOtp');
    const kycRequestId = getQueryParam('kycRequestId'); // Function to extract query param
  
    if (startKycButton) {
      startKycButton.addEventListener('click', async () => {
        // This button might not be needed if the widget loads directly to phone input
        phoneVerificationDiv.style.display = 'block';
      });
    }
  
    if (sendOtpButton) {
        sendOtpButton.addEventListener('click', async () => {
            const phoneNumber = phoneInput.value;
            const response = await fetch('/api/kyc/verify-phone', {
            method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ kycRequestId, phoneNumber }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                phoneVerificationDiv.style.display = 'none';
                otpVerificationDiv.style.display = 'block';
            } else {
                alert(data.error);
            }
        });
    }
  
    if (verifyOtpButton) {
      verifyOtpButton.addEventListener('click', async () => {
        const otpValue = otpInput.value;
        const response = await fetch('/api/kyc/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ kycRequestId, otp: otpValue }),
        });
        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          // Proceed to the next step in your widget UI
        } else {
          alert(data.error);
        }
      });
    }
  
    function getQueryParam(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }
  
    // ... rest of your widget logic to handle subsequent KYC steps
  });