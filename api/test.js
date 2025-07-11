export default function handler(req, res) {
    const allowedOrigins = ["http://localhost:3000/", "http://127.0.0.1:3000/"];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.status(200).end(); // preflight success
    }

    // Your actual response
    res.status(200).json({ message: "Hello from /api/auth" });
}
