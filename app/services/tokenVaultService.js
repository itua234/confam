const client = require('@util/client'); // Adjust path

class TokenVaultService {
    async storeToken(tokenId, mappingData) {
        try {
            const key = `token:${tokenId}`;
            const value = JSON.stringify(mappingData);
            // Consider encrypting the 'value' before storing in Redis for extra security
            await client.set(key, value);
            console.log(`Token ${tokenId} stored in Redis.`);
        } catch (error) {
            console.error('Error storing token in Redis:', error);
            throw error;
        }
    }

    async retrieveIdentity(tokenId) {
        try {
            const key = `token:${tokenId}`;
            const value = await client.get(key);
            if (value) {
                const mapping = JSON.parse(value);
                //return mapping.identityNumber;
                return mapping; 
            }
            return null;
        } catch (error) {
            console.error('Error retrieving identity from Redis:', error);
            throw error;
        }
    }

    async deleteToken(tokenId) {
        try {
            const key = `token:${tokenId}`;
            const deletedCount = await client.del(key);
            return deletedCount > 0;
        } catch (error) {
            console.error('Error deleting token from Redis:', error);
            throw error;
        }
    }

    async storeOTP(kyc_token, otpData){
        const key = `otp:${kyc_token}`;
        await client.set(key, JSON.stringify(otpData), {
            EX: 600 // 10 minutes expiry
        });
    }

    async retrieveOTP(kyc_token) {
        const key = `otp:${kyc_token}`;
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async clearOTP(kyc_token) {
        const key = `otp:${kyc_token}`;
        const deletedCount = await client.del(key);
        return deletedCount > 0;
    }

    async storeSessionToken(sessionToken, kyc_token, options) {
        await client.set(
            `session:${sessionToken}`,
            kyc_token,
            'EX',
            parseDuration(options.expiresIn)
        );
        // await client.set(
        //     `session:${sessionToken}`,
        //     JSON.stringify({
        //         kyc_token,
        //         created_at: new Date(),
        //         ip_address: req.ip,
        //         user_agent: req.headers['user-agent']
        //     }),
        //     'EX',
        //     parseDuration(options.expiresIn)
        // );
    }

    async validateSession(sessionToken) {
        const kyc_token = await client.get(`session:${sessionToken}`);
        if (!kyc_token) return null;
        
        // One-time use
        await client.del(`session:${sessionToken}`);
        return kyc_token;
    }
}

module.exports = new TokenVaultService();

// export const storeSessionToken = async (sessionToken: string, kyc_token: string, options: { expiresIn: string }) => {
//     await client.set(
//         `session:${sessionToken}`,
//         JSON.stringify({
//             kyc_token,
//             progress: {
//                 currentStep: 'phone',
//                 completedSteps: [],
//                 lastUpdated: new Date()
//             }
//         }),
//         'EX',
//         parseDuration(options.expiresIn)
//     );
// };

// export const updateSessionProgress = async (sessionToken: string, step: string) => {
//     const session = await client.get(`session:${sessionToken}`);
//     if (!session) return null;

//     const sessionData = JSON.parse(session);
//     sessionData.progress.completedSteps.push(step);
//     sessionData.progress.currentStep = getNextStep(step);
    
//     // Store updated progress
//     await client.set(
//         `session:${sessionToken}`,
//         JSON.stringify(sessionData),
//         'EX',
//         parseDuration('15m')
//     );

//     return sessionData;
// };