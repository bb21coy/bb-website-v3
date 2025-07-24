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
            case 'GET /get_account': {
                const id = req.query?.id;
                if (!id) return res.status(400).json({ message: 'Missing ID' });

                const user = await User.findById(id).select('-password');
                if (!user) return res.status(404).json({ message: 'User not found' });

                return res.status(200).json(user);
            }

            case 'GET /get_own_account': {
                const decoded = await decodeJWT(authorization, res);

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

            case 'GET /get_accounts_by_type': {
                const decoded = await decodeJWT(authorization, res, false);
                if (!decoded || decoded.error) return;

                const user = await User.findById(decoded.id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                const authError = checkAuthorization(user.account_type, res, ["Admin", "Officer", "Primer"]);
                if (authError) return;

                const type = req.query?.type;
                if (!type) return res.status(400).json({ message: 'Missing type' });
                if (!["Admin", "Officer", "Primer", "Boy"].includes(type)) return res.status(400).json({ message: 'Invalid type' });

                const users = await User.find({ account_type: type }).select('-password');
                return res.status(200).json(users);
            }

            case 'GET /get_graduated_accounts': {
                const decoded = await decodeJWT(authorization, res, false);
                if (!decoded || decoded.error) return;

                const user = await User.findById(decoded.id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                const authError = checkAuthorization(user.account_type, res, ["Admin", "Officer", "Primer"]);
                if (authError) return;

                const users = await User.find({ graduated: true }).select('-password');
                return res.status(200).json(users);
            }

            case 'PUT /update_username_password': {
                const { username, password } = req.body || {};
                if (!username || !password) return res.status(400).json({ message: 'Missing username or password' });

                const decoded = await decodeJWT(authorization, res, false);
                const hashedPassword = await bcrypt.hash(password, 10);

                await User.findByIdAndUpdate(decoded.id, {
                    user_name: username,
                    password: hashedPassword
                })

                return res.status(200).json({ message: 'Account updated successfully' });
            }

            case 'PUT /update_account': {
                const decoded = await decodeJWT(authorization, res, false);
                if (!decoded || decoded.error) return;

                const user = await User.findById(decoded.id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                const authError = checkAuthorization(user.account_type, res, ["Admin", "Officer", "Primer"]);
                if (authError) return;

                if (!req.body.id) return res.status(400).json({ message: 'Missing user ID' });

                const updateUser = await User.findById(req.body.id);
                if (!updateUser) return res.status(404).json({ message: 'User not found' });

                if (req.body.password && req.body.password !== '') {
                    const hashedPassword = await bcrypt.hash(req.body.password, 10);
                    req.body.password = hashedPassword;
                } else {
                    delete req.body.password;
                }

                if (req.body.rank === "NIL") req.body.rank = null;
                req.body.roll_call = req.body.roll_call?.trim().toLowerCase() === "yes";
                req.body.graduated = req.body.graduated?.trim().toLowerCase() === "yes";

                await User.findOneAndUpdate({ _id: req.body.id }, req.body);
                return res.status(200).json({ message: 'Account updated successfully' });
            }

            case 'POST /create_account': {
                const decoded = await decodeJWT(authorization, res, false);
                if (!decoded || decoded.error) return;

                const user = await User.findById(decoded.id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                const authError = checkAuthorization(user.account_type, res, ["Admin", "Officer"]);
                if (authError) return;

                let { account_name, user_name, abbreviated_name, password, account_type, rank, level, class1, credentials, honorifics, roll_call } = req.body || {};
                
                let missing = [];
                for (const field of ["account_name", "user_name", "abbreviated_name", "password", "account_type"]) {
                    if (!req.body[field]) missing.push(field);
                }

                if (missing.length > 0) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });

                for (const field of ["rank", "level", "class1", "credentials", "honorifics"]) {
                    if (eval(field) === "") eval(`${field} = null`);
                };

                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = new User({ account_name, user_name, abbreviated_name, password: hashedPassword, account_type, rank, level, class1, credentials, honorifics, roll_call });

                await newUser.save();
                return res.status(201).send();
            }

            case 'DELETE /delete_account': {
                const decoded = await decodeJWT(authorization, res, false);
                if (!decoded || decoded.error) return;

                const user = await User.findById(decoded.id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                if (!req.query.id) return res.status(400).json({ message: 'Missing user ID' });
                const deletingUser = await User.findById(req.query.id);
                if (!deletingUser) return res.status(404).json({ message: 'User not found' });

                const hierarchy = { "admin": 4, "officer": 3, "primer": 2, "boy": 1 };
                const requestedUserType = hierarchy[user.account_type.toLowerCase()];
                const deletingUserType = hierarchy[deletingUser.account_type.toLowerCase()];
                if ((requestedUserType < deletingUserType) || (user.account_type.toLowerCase() === "boy" && !user.appointment)) return res.status(403).json({ message: 'You do not have permission to delete this account' });

                await User.findByIdAndDelete(req.query.id);
                return res.status(200).send();
            }

            default:
                return res.status(404).json({ message: 'Route not found' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
