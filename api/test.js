import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import connectToDatabase from '../mongoose.js';
import User from '../models/users.js';

module.exports = (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	res.status(200).json({ message: 'Hello, World!' });
};


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
