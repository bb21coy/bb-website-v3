export default handler = (req, res) => {
    const { method } = req;
    const url = req.url;
    const routeKey = `${method} ${url}`;

    switch (routeKey) {
        case "GET /api/auth/login":
            return res.status(200).json({ name: 'John Doe' })
        default:
            return res.status(404).json({ message: 'Route not found' })
    }
}