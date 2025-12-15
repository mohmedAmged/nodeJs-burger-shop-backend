import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: [true, 'Name must be unique'],
            required: [true, 'Name is required'],
            trim: true,
            minLength: [2, 'Name must be at least 2 characters long'],
            maxLength: [50, 'Name must be at most 50 characters long'],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/\S+@\S+\.\S+/, 'Please fill a valid email address']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        phone: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER",
        },
    },
    { timestamps: true }
);
const User = mongoose.model('User', userSchema);
export default User;