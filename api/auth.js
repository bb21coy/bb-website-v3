import jwt, { decode } from 'jsonwebtoken';
import { connectToDatabase } from '../mongoose.js'; 
import { User } from './users.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const decodeJWT = (authorizationHeader) => {
    try {
        if (!authorizationHeader) return res.status(401).json({ message: 'Missing authorization header' });
        const token = authorizationHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) return res.status(401).json({ message: 'Invalid token' });
        if (decoded.exp < Date.now() / 1000) return res.status(401).json({ message: 'Token expired' });

        return decoded;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export default async function handler(req, res) {
    try {
        const route = req.headers['x-route']
        const authorization = req.headers['authorization'];
        const method = req.method;
        if (!route) return res.status(401).json({ message: 'Missing route in headers' });
        const routeKey = `${method.toUpperCase()} ${route}`;
        await connectToDatabase();
        
        switch (routeKey) {
            case 'POST /login':
                const username = req.body?.username;
                const password = req.body?.password;

                if (!username || !password) {
                    return res.status(401).json({ message: 'Missing username or password' });
                }

                const users = await User.find({ name: username });
                const match = await bcrypt.compare(password, users[0].password);
                    
                if (match) {
                    const token = jwt.sign({ id: users[0]._id }, process.env.JWT_SECRET);
                    return res.status(200).json({ token });
                } else {
                    return res.status(401).json({ message: 'Invalid username or password' });
                }
            case 'GET /get_account':
                var id = req.query?.id;
                if (!id) return res.status(400).json({ message: 'Missing ID' });

                var user = await User.findById(id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                delete user.password;

                return res.status(200).json(user);
            case 'GET /get_own_account':
                const decoded = decodeJWT(authorization);
                const userId = decoded.id;

                var user = await User.findById(userId);
                if (!user) return res.status(404).json({ message: 'User not found' });

                delete user.password;
                return res.status(200).json(user);
            case 'GET /get_multiple_accounts':
                var id = req.query?.id;
                var users = await User.find({ _id: { $in: idArray } });

                users.map((user) => delete user.password);

                return res.status(200).json(users);
            default:
                return res.status(401).json({ message: 'Invalid route' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}
