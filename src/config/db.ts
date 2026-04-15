import mongoose from "mongoose";

export const connectDB = async () => {
	const mongoUri = process.env.MONGO_URI;

	if (!mongoUri) {
		console.error("Database connection failed: MONGO_URI is not set");
		process.exit(1);
	}

	try {
		const conn = await mongoose.connect(mongoUri);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error("Database connection failed:", error);
		process.exit(1);
	}
};