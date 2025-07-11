import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../mongoose.js'; 
import { User } from './users.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
    const route = req.headers['x-route']
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
        default:
            return res.status(401).json({ message: 'Invalid route' });
    }
}
