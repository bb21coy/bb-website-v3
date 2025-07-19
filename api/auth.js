const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const connectToDatabase = require('../mongoose.js');
const User = require('../models/users.js');
const Token = require('../models/token.js');
const bcrypt = require('bcrypt');
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

module.exports = async (req, res) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-route');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

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
            case 'POST /login': {
                const { username, password } = req.body || {};
                if (!username || !password) return res.status(400).json({ message: 'Missing username or password' });

                const users = await User.find({ name: username });
                if (users.length === 0) return res.status(401).json({ message: 'Invalid username or password' });

                const match = await bcrypt.compare(password, users[0].password);
                if (!match) return res.status(401).json({ message: 'Invalid username or password' });

                const token = jwt.sign({ id: users[0]._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
                res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; Path=/; SameSite=None; Max-Age=${3 * 60 * 60}`);
                return res.status(200).json({ message: 'Logged in successfully' });
            }

            case 'GET /check_session': {
                const decoded = await decodeJWT(authorization, res, false);
                return res.status(200).json({ valid: !!decoded && !decoded.error });
            }

            case 'POST /logout': {
                const decoded = await decodeJWT(authorization, res, false);

                await Token.create({
                    token: authorization,
                    expiry: decoded.exp * 1000
                });

                res.setHeader('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=None; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
                return res.status(200).json({ message: 'Successfully logged out' });
            }

            case 'DELETE /delete_old_tokens': {
                await Token.deleteMany({ expiry: { $lt: Date.now() / 1000 } });
                return res.status(200).json({ message: 'Successfully deleted old tokens' });
            }

            default:
                return res.status(404).json({ message: 'Route not found' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
