import jwt, { decode } from 'jsonwebtoken';
import connectToDatabase from '../mongoose.js';
import User from '../models/users.js';
import Token from '../models/token.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const decodeJWT = async (authorizationHeader, res, sendResponse = true) => {
    try {
        if (!authorizationHeader) throw new Error('Missing authorization header');
        const token = authorizationHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded && sendResponse) throw new Error('Invalid token');
        if ((decoded.exp < Date.now() / 1000) && sendResponse) throw new Error('Token expired');

        const used = await Token.findOne({ token });
        if (used && sendResponse) throw new Error('Token already used');

        return decoded;
    } catch (error) {
        if (sendResponse && res) res.status(401).json({ message: error.message });
        return null;
    }
}

const checkAuthorization = (tokenType, res, allowedType = ["Admin", "Officer", "Primer", "Boy"]) => {
    if (!tokenType) return res.status(400).json({ message: 'Missing token type' });
    if (!allowedType.includes(tokenType)) return res.status(403).json({ message: 'Invalid token type' });
}

export default async function handler(req, res) {
    try {
        const route = req.headers['x-route']
        const authorization = req.headers['authorization'];
        const method = req.method;
        if (!route) return res.status(401).json({ message: 'Missing route in headers' });
        const routeKey = `${method.toUpperCase()} ${route}`;
        await connectToDatabase();

        const origin = req.headers.origin;
        console.log(origin, req.headers)
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        switch (routeKey) {
            case 'POST /login':
                var username = req.body?.username;
                var password = req.body?.password;

                if (!username || !password) return res.status(401).json({ message: 'Missing username or password' });

                var users = await User.find({ name: username });
                if (users.length === 0) return res.status(401).json({ message: 'Invalid username or password' });
                var match = await bcrypt.compare(password, users[0].password);

                if (match) {
                    var token = jwt.sign({ id: users[0]._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
                    res.headers = headers
                    return res.status(200).json({ token });
                } else {
                    return res.status(401).json({ message: 'Invalid username or password' });
                }
            case 'GET /get_account':
                var id = url.searchParams.get('id');

                if (!id) return res.status(400).json({ message: 'Missing ID' });

                var user = await User.findById(id).select('-password');
                if (!user) return res.status(404).json({ message: 'User not found' });

                return res.status(200).json(user);
            case 'GET /get_own_account':
                var decoded = await decodeJWT(authorization, res);
                if (!decoded) return;

                var userId = decoded.id;
                var user = await User.findById(userId).select('-password');
                if (!user) return res.status(404).json({ message: 'User not found' });

                return res.status(200).json(user);
            case 'GET /get_multiple_accounts':
                var id = req.query?.id;
                var users = await User.find({ _id: { $in: idArray } }).select('-password');

                return res.status(200).json(users);
            case 'GET /check_session':
                return res.status(200).json({ valid: !!await decodeJWT(authorization, res, false) });
            case 'POST /logout':
                if (!authorization) return res.status(401).json({ message: 'Missing authorization header' });
                await Token.create({
                    token: authorization.split(' ')[1],
                    expiry: (jwt.decode(authorization.split(' ')[1]).exp) * 1000
                })

                return res.status(200).json({ message: 'Successfully logged out' });
            case 'DELETE /delete_old_tokens':
                await Token.deleteMany({ expiry: { $lt: Date.now() / 1000 } });

                return res.status(200).json({ message: 'Successfully deleted old tokens' });
            case 'GET /get_accounts_by_type':
                var tokenType = await decodeJWT(authorization, res, false);
                checkAuthorization(tokenType.account_type, res, ["Admin", "Officer", "Primer"]);

                var type = req.query?.type;
                if (!type) return res.status(400).json({ message: 'Missing type' });
                if (!["Admin", "Officer", "Primer", "Boy"].includes(type)) return res.status(400).json({ message: 'Invalid type' });

                var users = await User.find({ account_type: type }).select('-password');
                return res.status(200).json(users);
            case 'GET /get_graduated_accounts':
                var tokenType = await decodeJWT(authorization, res, false);
                checkAuthorization(tokenType.account_type, res, ["Admin", "Officer", "Primer"]);

                var users = await User.find({ graduated: true }).select('-password');
                return res.status(200).json(users);
            default:
                return res.status(401).json({ message: 'Route not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}
