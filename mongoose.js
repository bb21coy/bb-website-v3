import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.set("strictQuery", true);

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to DB!");
    } catch (err) {
        console.error("Error connecting to DB:", err);
        throw err;  // Throw the error to be handled elsewhere
    }
};

export { connectToDatabase };