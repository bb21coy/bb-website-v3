const jwt = require('jsonwebtoken');
const User = require('./models/users.js');
const Token = require('./models/token.js');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

const decodeJWT = async (token, res, sendResponse = true) => {
    try {
        if (!token) throw new Error('Missing authorization token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) throw new Error('Invalid token');

        if (decoded.exp < Date.now() / 1000) throw new Error('Token expired');
        const used = await Token.findOne({ token });
        if (used) throw new Error('Token already used');

        return decoded;
    } catch (error) {
        if (sendResponse && res) return res.status(401).json({ message: error.message });
        return null;
    }
};

const checkAuthentication = async (authorization, res, allowed = ["Admin", "Officer", "Primer", "Boy"], includeAppt = false) => {
    if (!Array.isArray(allowed)) {
        console.error("Expected 'allowed' to be an array but got:", typeof allowed);
        return false;
    }
    
    const decoded = await decodeJWT(authorization, res);
    if (!decoded || decoded.error) return false

    const user = await User.findById(decoded.id);
    if (!user) return false;

    const tokenType = user.account_type;
    if ((!allowed.includes(tokenType) && includeAppt && user.appointment) || !tokenType) return false;
    
    return true;
};

module.exports = { decodeJWT, checkAuthentication };