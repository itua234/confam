(function(window) {
    class Allow {
        constructor(options = {}) {
            this.options = {
                //requestId: options.requestId || "",
                key: options.key || "",
                title: options.title || 'KYC Verification',
                onLoad: options.onLoad || function() {},
                onEvent: options.onEvent || function() {},
                onSuccess: options.onSuccess || function() {},
                onError: options.onError || function() {},
                onClose: options.onClose || function() {}
            };
            this.modal = null;
            // Setup the modal immediately
            this.setup();
            // Export only the allow function globally
            window.allow = () => this.open();
            //globalThis.allow = () => this.open();
        }

        setup() {
            // Create modal styles
            const styles = document.createElement('style');
            styles.textContent = `
                .allow-modal-overlay {
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
                .allow-modal-content {
                    background: white;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 600px;
                    height: 80vh;
                    position: relative;
                }
                .allow-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    border-radius: 8px;
                }
            `;
            document.head.appendChild(styles);

            if (typeof this.options.onLoad === 'function') {
                this.options.onLoad();
            }
        }

        open() {
            //alert("spark");
            // Create a new browser window
            const windowFeatures = 'width=600,height=600,resizable=yes,scrollbars=yes,status=yes';
            const verificationWindow = window.open(
                'http://127.0.0.1:5173',
                'KYC Verification',
                windowFeatures
            );
            // Create and show modal with iframe
            if (!this.modal) {
                this.modal = document.createElement('div');
                this.modal.className = 'allow-modal-overlay';
                this.modal.innerHTML = `
                    <div class="allow-modal-content" style="border:2px solid black">
                        <iframe 
                            class="allow-iframe"
                            src="http://127.0.0.1:5173"
                            allow="camera; microphone"
                           
                            frameborder="0"
                            scrolling="auto"
                        ></iframe>
                    </div>
                `;
                //src="https://your-verification-url.com/${this.options.key}"
                document.body.appendChild(this.modal);
            }
            this.modal.style.display = 'flex';
            if (typeof this.options.onEvent === 'function') {
                this.options.onEvent('MODAL_OPENED');
            }
            this.setupMessageListener();
        }

        getModalUrl() {
            return "https://www.w3schools.com/java/java_methods_overloading.asp";
            const baseUrl = this.options.environment === 'production' 
                ? 'https://paystack.com' 
                : 'https://www.w3schools.com/java/java_methods_overloading.asp';
                return baseUrl;
            //return `${baseUrl}/verify/${this.publicKey}`;
        }

        close() {
              // Hide or remove modal
            if (this.modal) {
                this.modal.style.display = 'none';
                if (typeof this.options.onClose === 'function') {
                    this.options.onClose();
                }
                this.modal = null;
            }
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
    // Expose the Allow class globally
    window.Allow = Allow;
})(window);