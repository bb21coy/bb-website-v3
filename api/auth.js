const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const connectToDatabase = require('../mongoose.js');
const User = require('../models/users.js');
const Token = require('../models/token.js');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

const decodeJWT = async (authorizationHeader, res, sendResponse = true) => {
    try {
        if (!authorizationHeader) throw new Error('Missing authorization token');
        const token = authorizationHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
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
};

module.exports = async (req, res) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-route');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const route = req.headers['x-route'];
        const cookies = cookie.parse(req.headers.cookie || '');
        const authorization = cookies.token;
        console.log(`Authorization: ${authorization}`, req.headers);
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

            case 'GET /get_account': {
                const id = req.query?.id;
                if (!id) return res.status(400).json({ message: 'Missing ID' });

                const user = await User.findById(id).select('-password');
                if (!user) return res.status(404).json({ message: 'User not found' });

                return res.status(200).json(user);
            }

            case 'GET /get_own_account': {
                const decoded = await decodeJWT(authorization, res);
                if (!decoded || decoded.error) return;

                const user = await User.findById(decoded.id).select('-password');
                if (!user) return res.status(404).json({ message: 'User not found' });

                return res.status(200).json(user);
            }

            case 'GET /get_multiple_accounts': {
                const ids = req.query?.id || [];
                const idArray = Array.isArray(ids) ? ids : [ids];
                const users = await User.find({ _id: { $in: idArray } }).select('-password');
                return res.status(200).json(users);
            }

            case 'GET /check_session': {
                const decoded = await decodeJWT(authorization, res, false);
                return res.status(200).json({ valid: !!decoded && !decoded.error });
            }

            case 'POST /logout': {
                if (!authorization) return res.status(401).json({ message: 'Missing authorization header' });

                const token = authorization.split(' ')[1];
                await Token.create({
                    token,
                    expiry: jwt.decode(token).exp * 1000
                });

                return res.status(200).json({ message: 'Successfully logged out' });
            }

            case 'DELETE /delete_old_tokens': {
                await Token.deleteMany({ expiry: { $lt: Date.now() / 1000 } });
                return res.status(200).json({ message: 'Successfully deleted old tokens' });
            }

            case 'GET /get_accounts_by_type': {
                const decoded = await decodeJWT(authorization, res, false);
                if (!decoded || decoded.error) return;

                const authError = checkAuthorization(decoded.account_type, res, ["Admin", "Officer", "Primer"]);
                if (authError) return;

                const type = req.query?.type;
                if (!type) return res.status(400).json({ message: 'Missing type' });

                const users = await User.find({ account_type: type }).select('-password');
                return res.status(200).json(users);
            }

            case 'GET /get_graduated_accounts': {
                const decoded = await decodeJWT(authorization, res, false);
                if (!decoded || decoded.error) return;

                const authError = checkAuthorization(decoded.account_type, res, ["Admin", "Officer", "Primer"]);
                if (authError) return;

                const users = await User.find({ graduated: true }).select('-password');
                return res.status(200).json(users);
            }

            default:
                return res.status(404).json({ message: 'Route not found' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
