import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";

if (!DB_URI) {
    throw new Error("please define MONGODB_URI environment variables in .env<development/production>.local");
}

// connect to database using DB_URI
const connectToDatabase = async () =>{
    try {
        await mongoose.connect(DB_URI)
        console.log(`Connected database in ${NODE_ENV} mode`);
        
    } catch (error) {
       console.error("Database connection error:", error);
       process.exit(1); 
    }
}

export default connectToDatabase;