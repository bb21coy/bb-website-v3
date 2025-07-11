import jwt from 'jsonwebtoken';
import connectToDatabase from '../mongoose.js';
import User from '../models/users.js';
import Token from '../models/token.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const decodeJWT = async (authorizationHeader) => {
    try {
        if (!authorizationHeader) throw new Error('Missing authorization header');
        const token = authorizationHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.exp < Date.now() / 1000) throw new Error('Token expired');
        const used = await Token.findOne({ token });
        if (used) throw new Error('Token already used');

        return decoded;
    } catch (error) {
        return { error: error.message };
    }
};

const checkAuthorization = (tokenType, allowed = ["Admin", "Officer", "Primer", "Boy"]) => {
    if (!tokenType) return 'Missing token type';
    if (!allowed.includes(tokenType)) return 'Invalid token type';
    return null;
};

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': event.headers.origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const route = event.headers['x-route'];
        const authorization = event.headers['authorization'];
        const method = event.httpMethod;

        if (!route) {
            return { statusCode: 401, headers, body: JSON.stringify({ message: 'Missing route in headers' }) };
        }

        const routeKey = `${method.toUpperCase()} ${route}`;
        await connectToDatabase();

        switch (routeKey) {
            case 'POST /login': {
                const { username, password } = JSON.parse(event.body || '{}');
                if (!username || !password) {
                    return { statusCode: 401, headers, body: JSON.stringify({ message: 'Missing username or password' }) };
                }

                const users = await User.find({ name: username });
                if (users.length === 0) {
                    return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid username or password' }) };
                }

                const match = await bcrypt.compare(password, users[0].password);
                if (!match) {
                    return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid username or password' }) };
                }

                const token = jwt.sign({ id: users[0]._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
                return { statusCode: 200, headers, body: JSON.stringify({ token }) };
            }

            case 'GET /get_account': {
                const id = event.queryStringParameters?.id;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing ID' }) };

                const user = await User.findById(id).select('-password');
                if (!user) return { statusCode: 404, headers, body: JSON.stringify({ message: 'User not found' }) };

                return { statusCode: 200, headers, body: JSON.stringify(user) };
            }

            case 'GET /get_own_account': {
                const decoded = await decodeJWT(authorization);
                if (decoded.error) return { statusCode: 401, headers, body: JSON.stringify({ message: decoded.error }) };

                const user = await User.findById(decoded.id).select('-password');
                if (!user) return { statusCode: 404, headers, body: JSON.stringify({ message: 'User not found' }) };

                return { statusCode: 200, headers, body: JSON.stringify(user) };
            }

            case 'GET /get_multiple_accounts': {
                const ids = event.queryStringParameters?.id || [];
                const idArray = Array.isArray(ids) ? ids : [ids];
                const users = await User.find({ _id: { $in: idArray } }).select('-password');
                return { statusCode: 200, headers, body: JSON.stringify(users) };
            }

            case 'GET /check_session': {
                const decoded = await decodeJWT(authorization);
                return { statusCode: 200, headers, body: JSON.stringify({ valid: !decoded.error }) };
            }

            case 'POST /logout': {
                if (!authorization) return { statusCode: 401, headers, body: JSON.stringify({ message: 'Missing authorization header' }) };

                const token = authorization.split(' ')[1];
                await Token.create({
                    token,
                    expiry: jwt.decode(token).exp * 1000
                });

                return { statusCode: 200, headers, body: JSON.stringify({ message: 'Successfully logged out' }) };
            }

            case 'DELETE /delete_old_tokens': {
                await Token.deleteMany({ expiry: { $lt: Date.now() / 1000 } });
                return { statusCode: 200, headers, body: JSON.stringify({ message: 'Successfully deleted old tokens' }) };
            }

            case 'GET /get_accounts_by_type': {
                const decoded = await decodeJWT(authorization);
                if (decoded.error) return { statusCode: 401, headers, body: JSON.stringify({ message: decoded.error }) };

                const error = checkAuthorization(decoded.account_type, ["Admin", "Officer", "Primer"]);
                if (error) return { statusCode: 403, headers, body: JSON.stringify({ message: error }) };

                const type = event.queryStringParameters?.type;
                if (!type) return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing type' }) };

                const users = await User.find({ account_type: type }).select('-password');
                return { statusCode: 200, headers, body: JSON.stringify(users) };
            }

            case 'GET /get_graduated_accounts': {
                const decoded = await decodeJWT(authorization);
                if (decoded.error) return { statusCode: 401, headers, body: JSON.stringify({ message: decoded.error }) };

                const error = checkAuthorization(decoded.account_type, ["Admin", "Officer", "Primer"]);
                if (error) return { statusCode: 403, headers, body: JSON.stringify({ message: error }) };

                const users = await User.find({ graduated: true }).select('-password');
                return { statusCode: 200, headers, body: JSON.stringify(users) };
            }

            default:
                return { statusCode: 404, headers, body: JSON.stringify({ message: 'Route not found' }) };
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Internal server error', error: err.message })
        };
    }
};
