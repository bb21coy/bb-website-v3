const corsMiddleware = initMiddleware(
  cors({ origin: '*', methods: ['GET', 'POST'] })
);

export default async function handler(req, res) {
  await corsMiddleware(req, res);
  res.status(200).json({ message: 'Hello with CORS' });
}