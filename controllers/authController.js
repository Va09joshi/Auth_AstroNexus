const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID; // Optional if using Verify API directly, otherwise we manage OTP manually or use default messaging.
// For this task usually Twilio Verify API is best, OR we can send a random OTP via SMS.
// The user prompt said "Using twillio as messenger", implies sending SMS.
// I will implement sending a random OTP via SMS for simplicity unless user provided Verify SID.
// Let's use simple SMS with a generated OTP for now, stored in memory (or DB ideally, but memory for simple task).
// Actually, using Twilio Verify Service is much cleaner if they have it.
// I'll stick to SMS with generated OTP stored in a simple Map for this "integrate it" request to be self-contained.

const client = new twilio(accountSid, authToken);
const otpStore = new Map(); // Store OTPs in memory: phoneNumber -> otp

exports.sendOtp = async (req, res) => {
        console.log('sendOtp called', req.body); // <-- add this

    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await client.messages.create({
            body: `Your AstroNexus verification code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        otpStore.set(phoneNumber, otp);
        // Clear OTP after 5 minutes
        setTimeout(() => otpStore.delete(phoneNumber), 5 * 60 * 1000);

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

exports.verifyOtp = (req, res) => {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const storedOtp = otpStore.get(phoneNumber);

    if (storedOtp === otp) {
        otpStore.delete(phoneNumber); // OTP used
        res.status(200).json({ message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ error: 'Invalid OTP' });
    }
};
