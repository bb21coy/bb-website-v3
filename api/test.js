const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connectToDatabase = require('../mongoose.js');
const User = require('../models/users.js');

module.exports = async (req, res) => {
	// Set CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	// Handle preflight request
	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	// Allow only POST
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		// Connect to MongoDB
		await connectToDatabase();

		// Parse request body
		const { username, password } = req.body || {};
		if (!username || !password) {
			return res.status(400).json({ message: 'Missing username or password' });
		}

		// Check if user exists
		const user = await User.findOne({ name: username });
		if (!user) {
			return res.status(401).json({ message: 'Invalid username or password' });
		}

		// Compare password
		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return res.status(401).json({ message: 'Invalid username or password' });
		}

		// Generate JWT
		const token = jwt.sign(
			{ id: user._id, account_type: user.account_type },
			process.env.JWT_SECRET,
			{ expiresIn: '3h' }
		);

		return res.status(200).json({ token });
	} catch (err) {
		console.error('Login error:', err);
		return res.status(500).json({ message: 'Internal server error' });
	}
};
