const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const axios = require('axios');
const User = require('../models/users.js');
const Token = require('../models/token.js');
const { connectToDatabase, getAllCollections } = require('../mongoose.js');
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

const checkAuthorization = (tokenType, res, allowed = ["Admin", "Officer", "Primer", "Boy"]) => {
    if (!tokenType) return res.status(400).json({ message: 'Missing token type' });
    if (!allowed.includes(tokenType)) return res.status(403).json({ message: 'Invalid token type' });
    return null;
};

module.exports = async (req, res) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-route');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const route = req.headers['x-route'];
        const cookies = cookie.parse(req.headers.cookie || '');
        const authorization = cookies.token;
        const method = req.method;

        if (!route) return res.status(401).json({ message: 'Missing route in headers' });

        const routeKey = `${method.toUpperCase()} ${route}`;
        await connectToDatabase();

        switch (routeKey) {
            case 'GET /get_table_names': {
                const decoded = await decodeJWT(authorization, res);
                if (!decoded || decoded.error) return;

                const user = await User.findById(decoded.id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                const authError = checkAuthorization(user.account_type, res, ["Admin"]);
                if (authError) return;

                const tableNames = await getAllCollections();
                return res.status(200).json(tableNames);
            }

            case 'GET /vercel_usage': {
                const decoded = await decodeJWT(authorization, res);
                if (!decoded || decoded.error) return;

                const user = await User.findById(decoded.id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                const authError = checkAuthorization(user.account_type, res, ["Admin"]);
                if (authError) return;

                const resp = await axios.get(`https://vercel.com/api/usage-summary?teamId=dylans-projects-b00aa3d7`, {
                    headers: {
                        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`
                    }
                });

                return res.json(resp.data.data.usage);
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}