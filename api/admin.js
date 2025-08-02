const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const axios = require('axios');
const mongoose = require('mongoose');
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

const checkAuthenication = async (authorization, res, allowed = ["Admin", "Officer", "Primer", "Boy"]) => {
    if (!Array.isArray(allowed)) {
        console.error("Expected 'allowed' to be an array but got:", typeof allowed);
        return false;
    }
    
    const decoded = await decodeJWT(authorization, res);
    if (!decoded || decoded.error) return false;

    const user = await User.findById(decoded.id);
    if (!user) return false;

    const tokenType = user.account_type;
    if (!tokenType || !allowed.includes(tokenType)) return false;
    
    return true;
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
                if (!checkAuthenication(authorization, res, ["Admin"])) return res.status(401).json({ message: 'Unauthorized' });

                const tableNames = await getAllCollections();
                return res.status(200).json(tableNames);
            }

            case 'GET /get_table': {
                if (!checkAuthenication(authorization, res, ["Admin"])) return res.status(401).json({ message: 'Unauthorized' });

                let { table_name } = req.query;
                if (!table_name) return res.status(400).json({ message: 'Missing table name' });

                switch (table_name.toLowerCase()) {
                    case 'users': {
                        table_name = 'User';
                        break;
                    }
                    case 'token_blacklist': {
                        table_name = 'Token';
                        break;
                    }
                    case 'appointments': {
                        table_name = 'Appointment';
                        break;
                    }
                }

                const Model = mongoose.model(table_name);
                const collection = await Model.find();
                return res.status(200).json(collection);
            }

            case 'GET /vercel_usage': {
                if (!checkAuthenication(authorization, res, ["Admin"])) return res.status(401).json({ message: 'Unauthorized' });

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