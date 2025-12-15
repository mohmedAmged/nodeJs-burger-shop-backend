import User from "../models/user.model.js";

export const getAllUsers = async (req, res, next)=>{
    try {
        // only admins can fetch all users
        if (!req.user || req.user.role !== 'ADMIN') {
            const error = new Error('Forbidden: Admins only');
            error.statusCode = 403;
            throw error;
        }

        const users = await User.find().select('-password');

        res.status(200).json({success: true, message:'all users fetched succesfully', data: users})
    } catch (error) {
        next(error);
    }
}

export const getUser = async (req, res, next)=>{
    try {
        const { slug } = req.params;
        const user = await User.findOne({ slug }).select('-password');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({success: true, message:'user data fetched succesfully', data: user})
    } catch (error) {
        next(error);
    }
}

export const updateUser = async (req, res, next)=>{
    try {
        const { slug } = req.params;
        const user = await User.findOneAndUpdate({slug}, req.body, {new: true, runValidators: true}).select('-password');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({success: true, message:'user updated succesfully', data: user})
    } catch (error) {
        next(error)
    }
}