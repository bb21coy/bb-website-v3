import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import connectToDatabase from '../../mongoose';
import User from '../../models/users';
import Cors from 'cors';
import initMiddleware from '../middleware';

const cors = initMiddleware(
	Cors({
		origin: '*', // or your frontend domain
		methods: ['POST'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	})
);

export default async function handler(req, res) {
	await cors(req, res);
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	await connectToDatabase();
	const { username, password } = req.body || {};
	if (!username || !password) {
		return res.status(400).json({ message: 'Missing username or password' });
	}

	const user = await User.findOne({ name: username });
	if (!user) return res.status(401).json({ message: 'Invalid username or password' });

	const match = await bcrypt.compare(password, user.password);
	if (!match) return res.status(401).json({ message: 'Invalid username or password' });

	const token = jwt.sign({ id: user._id, account_type: user.account_type }, process.env.JWT_SECRET, { expiresIn: '3h' });
	return res.status(200).json({ token });
}
