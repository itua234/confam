const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is 16 bytes
const TAG_LENGTH = 16; // GCM authentication tag length

function encrypt(text) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Ensure key is a buffer
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

function decrypt(encryptedText) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };

// models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     username: { type: String, unique: true, required: true },
//     password: { type: String, required: true },
//     kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
//     kycToken: { type: String, unique: true, sparse: true } // Token linking to KYCData
// });

// module.exports = mongoose.model('User', userSchema);

// // models/KYCData.js
// const mongoose = require('mongoose');

// const kycDataSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
//     token: { type: String, unique: true, required: true }, // The token representing this KYC record
//     encryptedPii: { type: String, required: true }, // Encrypted PII
//     verificationDetails: { // Store details from external KYC provider
//         provider: String,
//         status: String,
//         externalId: String,
//         // ... other relevant metadata
//     },
//     createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('KYCData', kycDataSchema);

// app.js (main entry point)
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { nanoid } = require('nanoid');
// const { encrypt, decrypt } = require('./utils/encryption');
// const User = require('./models/User');
// const KYCData = require('./models/KYCData');

// const app = express();
// app.use(express.json());

// // Database connection
// mongoose.connect(process.env.MONGODB_URI)
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.error('MongoDB connection error:', err));

// // --- User Registration (simplified) ---
// app.post('/register', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const user = new User({ username, password: hashedPassword });
//         await user.save();
//         res.status(201).send('User registered');
//     } catch (error) {
//         res.status(400).send(error.message);
//     }
// });

// // --- User Login (simplified) ---
// app.post('/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = await User.findOne({ username });
//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).send('Invalid credentials');
//         }
//         const token = jwt.sign({ userId: user._id, kycStatus: user.kycStatus }, process.env.JWT_SECRET, { expiresIn: '1h' });
//         res.json({ token });
//     } catch (error) {
//         res.status(500).send('Login failed');
//     }
// });

// // Middleware to protect routes
// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (!token) return res.sendStatus(401);

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) return res.sendStatus(403);
//         req.user = user;
//         next();
//     });
// };

// // --- KYC Submission (initial verification) ---
// app.post('/kyc/submit', authenticateToken, async (req, res) => {
//     try {
//         const { fullName, dob, address, idNumber, idType /* ... other PII */ } = req.body;

//         // In a real scenario, you'd send this data to a 3rd party KYC provider
//         // Example: const verificationResult = await kycProvider.verifyIdentity({ fullName, dob, ... });
//         // For this example, we'll simulate success.
//         const simulatedVerificationSuccess = true;

//         if (!simulatedVerificationSuccess) {
//             return res.status(400).send('KYC verification failed with external provider.');
//         }

//         // Combine PII into a JSON string for encryption
//         const piiData = JSON.stringify({ fullName, dob, address, idNumber, idType });
//         const encryptedPii = encrypt(piiData);

//         // Generate a unique, non-guessable token for this KYC record
//         const kycToken = nanoid(32); // 32 characters long unique ID

//         // Save encrypted PII and the token
//         const kycData = new KYCData({
//             userId: req.user.userId,
//             token: kycToken,
//             encryptedPii: encryptedPii,
//             verificationDetails: {
//                 provider: 'SimulatedKYCProvider',
//                 status: 'verified',
//                 externalId: `simulated-id-${Date.now()}`
//             }
//         });
//         await kycData.save();

//         // Update user's KYC status and store the token
//         await User.findByIdAndUpdate(req.user.userId, { kycStatus: 'verified', kycToken: kycToken });

//         res.status(200).json({ message: 'KYC submitted and tokenized successfully.', kycToken });

//     } catch (error) {
//         console.error('KYC submission error:', error);
//         res.status(500).send('Error submitting KYC: ' + error.message);
//     }
// });

// // --- KYC Verification (using the token) ---
// app.get('/kyc/verify/:token', authenticateToken, async (req, res) => {
//     try {
//         const { token } = req.params;
//         const kycData = await KYCData.findOne({ token });

//         if (!kycData) {
//             return res.status(404).send('KYC token not found or invalid.');
//         }

//         // For a true tokenized KYC, you might only return the status:
//         // res.json({ kycStatus: kycData.verificationDetails.status });

//         // If you need to expose (with consent) some PII, decrypt it here:
//         // IMPORTANT: Implement strong authorization for accessing PII
//         const decryptedPii = decrypt(kycData.encryptedPii);
//         const piiObject = JSON.parse(decryptedPii);

//         res.json({
//             kycStatus: kycData.verificationDetails.status,
//             kycToken: kycData.token,
//             // Only expose PII if explicitly allowed and authorized
//             // e.g., if this endpoint is only for the *owner* of the data:
//             verifiedData: {
//                 fullName: piiObject.fullName,
//                 idType: piiObject.idType,
//                 // ... only necessary fields
//             }
//         });

//     } catch (error) {
//         console.error('KYC verification error:', error);
//         res.status(500).send('Error verifying KYC token: ' + error.message);
//     }
// });

// // --- Endpoint to retrieve user's own token (if they lose it) ---
// app.get('/kyc/my-token', authenticateToken, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.userId);
//         if (!user || !user.kycToken) {
//             return res.status(404).send('No KYC token found for this user.');
//         }
//         res.json({ kycToken: user.kycToken });
//     } catch (error) {
//         res.status(500).send('Error retrieving KYC token.');
//     }
// });


// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));