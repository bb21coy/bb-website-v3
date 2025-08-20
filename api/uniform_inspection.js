const cookie = require('cookie');
const { checkAuthentication } = require('../functions.js');
const { connectToDatabase } = require('../mongoose.js');
const User = require('../models/users.js');
const UniformInspections = require('../models/uniform_inspections.js');

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
        if (!authorization) return res.status(401).json({ message: 'Missing authorization token' });

        const routeKey = `${method.toUpperCase()} ${route}`;
        await connectToDatabase();

        switch (routeKey) {
            case 'GET /get_inspection_summary': {
                const auth = await checkAuthentication(authorization, res, ["Admin", "Officer", "Primer"]);
                if (!auth) {
                    console.debug(auth);
                    return res.status(401).json({ message: 'Unauthorized' })
                };
                
                const summary = await UniformInspections.find({}).populate("assessor").populate("boy");
                const boys = await User.find({ account_type: 'Boy' }).select('_id account_name level');
                return res.status(200).json({ summary, boys });
            }

            default:
                return res.status(404).json({ message: 'Route not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};