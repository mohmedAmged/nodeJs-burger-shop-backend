import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";

if (!DB_URI) {
    throw new Error("please define MONGODB_URI environment variables in .env<development/production>.local");
}
const cached = global._mongodb || { conn: null, promise: null };
// connect to database using DB_URI
// const connectToDatabase = async () =>{
//     try {
//         await mongoose.connect(DB_URI)
//         console.log(`Connected database in ${NODE_ENV} mode`);
        
//     } catch (error) {
//        console.error("Database connection error:", error);
//        process.exit(1); 
//     }
// }

const connectToDatabase = async () => {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        if (!DB_URI) throw new Error('DB_URI is required to connect to MongoDB');
        cached.promise = mongoose.connect(DB_URI).then((mongooseInstance) => {
            return mongooseInstance;
        });
    }
    cached.conn = await cached.promise;
    global._mongodb = cached;
    console.log(`Connected database in ${NODE_ENV || 'development'} mode`);
    return cached.conn;
}

export default connectToDatabase;