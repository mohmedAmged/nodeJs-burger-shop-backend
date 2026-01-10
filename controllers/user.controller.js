import User from "../models/user.model.js";
import Cart from "../models/cart.model.js";
import Order from "../models/order.model.js";

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

        // Fetch Cart Summary
        const cart = await Cart.findOne({ user: user._id }).populate('items.product');
        const cartSummary = {
            totalItems: cart ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0,
            recentItems: cart ? cart.items.slice(-3).map(item => ({
                product: {
                    name: item.product?.name,
                    price: item.product?.price,
                    image: item.product?.image,
                    slug: item.product?.slug
                },
                quantity: item.quantity
            })).reverse() : []
        };

        // Fetch Order Summary
        const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
        const orderSummary = {
            totalOrders: orders.length,
            recentOrders: orders.slice(0, 3).map(order => ({
                _id: order._id,
                totalPrice: order.totalPrice,
                totalPriceAfterCode: order.totalPriceAfterCode,
                status: order.status,
                createdAt: order.createdAt,
                itemsCount: order.items.length
            }))
        };

        res.status(200).json({
            success: true, 
            message:'user data fetched succesfully', 
            data: {
                user,
                cartSummary,
                orderSummary
            }
        })
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