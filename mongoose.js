const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const MONGOOSE_URI = process.env.MONGOOSE_URI;
if (!MONGOOSE_URI) throw new Error('MONGOOSE_URI not defined in environment');

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        mongoose.set("strictQuery", true);
        cached.promise = mongoose.connect(MONGOOSE_URI);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

async function getAllCollections() {
    const db = await connectToDatabase();
    return db.connection.db.listCollections().toArray();
}

module.exports = { connectToDatabase, getAllCollections };
