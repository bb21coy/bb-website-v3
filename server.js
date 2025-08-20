const express = require('express');
const multer = require('multer');
const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const handleDynamicRoute = (req, res, routeFunction) => {

	const contentType = req.headers['content-type'] || 'application/json';
	if (contentType.startsWith('application/json')) {
		routeFunction(req, res);
	} else if (contentType.startsWith('multipart/form-data')) {
		upload.any()(req, res, function (err) {
			if (err) {
				console.error('Error handling multipart/form-data:', err);
				return res.status(500).send('Error handling form data');
			}
			routeFunction(req, res);
		});
	} else {
		console.error('Unsupported content type', contentType);
		res.status(400).send('Unsupported content type');
	}
};

const accountFunction = require('./api/account.js');
const authFunction = require('./api/auth.js');
const appointmentFunction = require('./api/appointment.js');
const adminFunction = require('./api/admin.js');
const awardFunction = require('./api/awards.js');
const uniformFunction = require('./api/uniform_inspection.js');

// Dynamically handle routes
app.all('/api/account', (req, res) => {
	handleDynamicRoute(req, res, accountFunction);
});

app.all('/api/auth', (req, res) => {
	handleDynamicRoute(req, res, authFunction);
});

app.all('/api/appointment', (req, res) => {
	handleDynamicRoute(req, res, appointmentFunction);
});

app.all('/api/admin', (req, res) => {
	handleDynamicRoute(req, res, adminFunction);
});

app.all('/api/awards', (req, res) => {
	handleDynamicRoute(req, res, awardFunction);
});

app.all('/api/uniform_inspection', (req, res) => {
	handleDynamicRoute(req, res, uniformFunction);
});

// Start the server
app.listen(3000, () => {
	console.log('Express server running on http://localhost:3000');
});
