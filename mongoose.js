import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

mongoose.set("strictQuery", true);

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URI);
        console.log("Connected to DB!");
    } catch (err) {
        console.error("Error connecting to DB:", err);
        throw err;
    }
};

export { connectToDatabase };