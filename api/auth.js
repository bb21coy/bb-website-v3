export default function handler(req, res) {
    try {
        const { method } = req;
        const url = req.url;
        const routeKey = `${method} ${url}`;

        switch (routeKey) {
            case "GET /api/auth/login":
                return res.status(200).json({ name: 'John Doe' })
            default:
                return res.status(404).json({ message: 'Route not found' })
        }
    } catch (error) {
        return res.status(500).json({ message: error.message || error })
    }
}