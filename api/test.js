export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === 'OPTIONS') {
        // Preflight request
        return res.status(200).end();
    }

    // Your actual handler code below
    res.status(200).json({ message: "CORS fixed!" });
}
