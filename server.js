// /server.js
import express from 'express';
import handler from './api/test.js';  // Ensure the path is correct to the auth.js file

const app = express();
const port = 5000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Route for testing the handler
app.all('/api/test', handler);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
