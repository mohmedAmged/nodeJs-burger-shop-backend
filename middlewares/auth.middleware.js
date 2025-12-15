import { JWT_SECRET } from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import RevokedToken from "../models/revokedToken.model.js";

const authorize = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return res.status(401).json({message: 'Unauthorized: No token provided'});

        // reject if token already revoked
        const revoked = await RevokedToken.findOne({ token });
        if (revoked) return res.status(401).json({ message: 'Unauthorized: Token revoked' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({message: 'Unauthorized: User not found'});
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({message: 'Unauthorized', error: error.message});
    }
}

export default authorize;