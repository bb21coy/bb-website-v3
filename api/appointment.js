const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const connectToDatabase = require('../mongoose.js');
const User = require('../models/users.js');
const Token = require('../models/token.js');
const Appointment = require('../models/appointment.js');
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
            case 'GET /get_appointments':
                await decodeJWT(authorization, res);
                const appointments = await Appointment.find();

                let appointmentToAccounts = [];
                for (let appointment of appointments) {
                    const user = await User.findById(appointment.account_id, '_id account_name');
                    if (user) appointmentToAccounts.push(user);
                }

                return res.status(200).json({ appointments, appointment_to_accounts: appointmentToAccounts });
            
            case 'POST /create_appointment': {
                const decoded = await decodeJWT(authorization, res);
                const authError = checkAuthorization(decoded.account_type, res, ["Officer", "Admin"]);
                if (authError) return;

                var { appointment_name, account_type, account_id } = req.body || {};
                if (!appointment_name || !account_type || !account_id) return res.status(400).json({ message: 'Missing appointment details' });
                
                const newAppointment = new Appointment({ appointment_name, account_type, account_id });
                await newAppointment.save();
                return res.status(201).json({ message: 'Appointment created successfully' });
            }

            case 'PUT /update_appointment': {
                const decoded = await decodeJWT(authorization, res);
                const authError = checkAuthorization(decoded.account_type, res, ["Officer", "Admin"]);
                if (authError) return;

                const { account_id, appointment_id } = req.body || {};
                if (!account_id || !appointment_id) return res.status(400).json({ message: 'Missing appointment ID or account ID' });

                const appointment = await Appointment.findById(appointment_id);
                if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

                await Appointment.updateOne({ _id: appointment_id }, { account_id });
                return res.status(200).json({ message: 'Appointment updated successfully' });
            }

            case 'DELETE /delete_appointment': {
                const decoded = await decodeJWT(authorization, res);
                const authError = checkAuthorization(decoded.account_type, res, ["Officer", "Admin"]);
                if (authError) return;

                const { appointment_id } = req.body || {};
                if (!appointment_id) return res.status(400).json({ message: 'Missing appointment ID' });

                const deletedAppointment = await Appointment.findByIdAndDelete(appointment_id);
                if (!deletedAppointment) return res.status(404).json({ message: 'Appointment not found' });
                return res.status(200).json({ message: 'Appointment deleted successfully' });
            }

            default:
                return res.status(404).json({ message: 'Route not found' });
        }
    } catch (err) {
        console.error(err);
        handleServerError(err.response.status);
    }
};