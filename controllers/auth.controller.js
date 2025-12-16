import mongoose from "mongoose";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ADMIN_CREATION_SECRET, JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
import RevokedToken from "../models/revokedToken.model.js";
import slug from "slug";

export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // logic to create new user
        const { name, email, password, phone, role } = req.body

        // server-side protection for ADMIN role
        let requester = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                requester = await User.findById(decoded.userId).select('role').lean();
            // eslint-disable-next-line no-unused-vars
            } catch (err) {
                // invalid/expired token -> ignore; requester stays null
            }
        }
        let assignedRole = 'USER';
        if (role && String(role).toUpperCase() === 'ADMIN') {
            const providedKey = req.headers['x-admin-key'] || req.body.adminKey;
            const hasValidSecret = providedKey && providedKey === ADMIN_CREATION_SECRET;
            const requesterIsAdmin = requester && requester.role === 'ADMIN';
            if (!hasValidSecret && !requesterIsAdmin) {
                const error = new Error('Forbidden: cannot assign ADMIN role');
                error.statusCode = 403;
                throw error;
            }
            assignedRole = 'ADMIN';
        }

        // check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('User already exists with this email');
            error.statusCode = 409; // conflict
            throw error;
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userSlug = slug(name, { lower: true });

        const newUsers = await User.create([{ name, email, phone, password: hashedPassword, slug: userSlug, role: assignedRole }], { session })

        const token = jwt.sign({ userId: newUsers[0]._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                token,
                user: newUsers[0]
            }
        })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error)
    }
}

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('user not found');
            error.statusCode = 404;
            throw error;
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            const error = new Error('Invalid password');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            data: {
                token,
                user
            }
        })
    } catch (error) {
        next(error)
    }
}

export const signOut = async (req, res, next) => {
    try {
        const token = req.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
        if (!token) {
            const error = new Error('Token missing');
            error.statusCode = 401;
            throw error;
        }
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            const error = new Error('Invalid token');
            error.statusCode = 400;
            throw error;
        }
        const expiresAt = new Date(decoded.exp * 1000);
        await RevokedToken.create({ token, expiresAt });
        res.status(200).json({
            success: true,
            message: 'User signed out successfully',
            data: null
        })
    } catch (error) {
        next(error)
    }
}