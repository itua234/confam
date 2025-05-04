(function(window) {
    class KYCModal {
        constructor(publicKey, options = {}) {
            this.publicKey = publicKey;
            this.options = {
                environment: options.environment || 'production',
                onSuccess: options.onSuccess || function() {},
                onError: options.onError || function() {},
                onClose: options.onClose || function() {}
            };
            this.modalContainer = null;
        }

        initialize() {
            // Create modal styles
            const styles = document.createElement('style');
            styles.textContent = `
                .kyc-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 999999;
                }
                .kyc-modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    height: 600px;
                }
            `;
            document.head.appendChild(styles);
        }

        open() {
            this.createModal();
            this.modalContainer.style.display = 'flex';
        }

        close() {
            if (this.modalContainer) {
                this.modalContainer.style.display = 'none';
                this.options.onClose();
            }
        }

        createModal() {
            if (!this.modalContainer) {
                this.modalContainer = document.createElement('div');
                this.modalContainer.className = 'kyc-modal-overlay';
                this.modalContainer.innerHTML = `
                    <div class="kyc-modal-content">
                        <iframe 
                            src="${this.getModalUrl()}"
                            style="width: 100%; height: 100%; border: none;"
                        ></iframe>
                    </div>
                `;
                document.body.appendChild(this.modalContainer);
                this.setupMessageListener();
            }
        }

        getModalUrl() {
            const baseUrl = this.options.environment === 'production' 
                ? 'https://kyc.yourservice.com' 
                : 'https://kyc-test.yourservice.com';
            return `${baseUrl}/verify/${this.publicKey}`;
        }

        setupMessageListener() {
            window.addEventListener('message', (event) => {
                // Verify origin
                if (event.origin !== this.getModalUrl()) return;

                const { type, data } = event.data;
                switch(type) {
                    case 'KYC_SUCCESS':
                        this.options.onSuccess(data);
                        this.close();
                        break;
                    case 'KYC_ERROR':
                        this.options.onError(data);
                        break;
                    case 'KYC_CLOSE':
                        this.close();
                        break;
                }
            });
        }
    }

    // Expose to window
    window.KYCModal = KYCModal;
})(window);



(function(window) {
    class KYCModal {
        constructor(publicKey, options = {}) {
            this.publicKey = publicKey;
            this.options = options;
            this.modal = null;
        }

        initialize() {
            // Create modal styles and container
            // ... existing code ...
        }

        open() {
            // Create and show modal with iframe
            // ... existing code ...
        }

        close() {
            // Hide or remove modal
            // ... existing code ...
        }

        // ... existing code ...
    }

    window.KYCModal = KYCModal;
})(window);

window.parent.postMessage({ type: 'KYC_SUCCESS', data: { ... } }, 'https://client-website.com');
window.addEventListener('message', function(event) {
    // Validate event.origin for security!
    if (event.origin !== 'https://kyc-provider.com') return;
    // Handle the message
    if (event.data.type === 'KYC_SUCCESS') {
        // Do something with event.data.data
    }
});
const referrer = document.referrer;
const url = new URL(referrer);
const origin = url.origin;
window.parent.postMessage({ type: 'KYC_SUCCESS', data: { ... } }, origin);

## Trae AI
Used 1 context

You can modify the open() method to use window.open() instead of an iframe. Here's how to change your code:

```javascript
open() {
    // Create a new browser window
    const windowFeatures = 'width=600,height=700,resizable=yes,scrollbars=yes,status=yes';
    const verificationWindow = window.open(
        'http://127.0.0.1:8080/test-modal',
        'KYC Verification',
        windowFeatures
    );

    if (typeof this.options.onEvent === 'function') {
        this.options.onEvent('MODAL_OPENED');
    }

    // Setup message listener for the new window
    this.setupMessageListener();
}

// You can also remove the modal-related CSS in setup() since we're not using it anymore
setup() {
    if (typeof this.options.onLoad === 'function') {
        this.options.onLoad();
    }
}
 ```
```



this.publicKey = publicKey;
this.options = {
    environment: options.environment || 'production',
    onSuccess: options.onSuccess || function() {},
    onError: options.onError || function() {},
    onClose: options.onClose || function() {}
};
this.modalContainer = null;



if (typeof this.options.onSuccess === 'function') {
    this.options.onSuccess(data);
}

// ... inside some method after an error ...
if (typeof this.options.onError === 'function') {
    this.options.onError(error);
}

// ... inside the close() method ...
if (typeof this.options.onClose === 'function') {
    this.options.onClose();
}