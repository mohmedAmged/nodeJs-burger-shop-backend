import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Order from "../models/order.model.js";
import { workFlowClient } from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";
// user controller
export const getUserOrders = async (req,res,next)=>{
    try {
        const userId = req.user && req.user._id;
        const { days } = req.query;
        let filter = { user: userId };
        if (!userId) {
            const error = new Error("Unauthorized");
            error.statusCode = 401;
            throw error;
        }
        if (days) {
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - Number(days));
            filter.createdAt = { $gte: fromDate };
            }

        const orders = await Order.find(filter).populate("items.product", "name price slug image").sort({ createdAt: -1 });
        res.status(200).json({ success: true, message: "User orders fetched", data: orders });
    } catch (error) {
        next(error)
    }
}

export const createOrder = async (req,res,next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user && req.user._id;
        if (!userId) {
            const error = new Error("Unauthorized");
            error.statusCode = 401;
            throw error;
        }

        const { deliveryAddress, paymentMethod = "CASH" } = req.body;
        if (!deliveryAddress) {
            const error = new Error("Delivery Address is required");
            error.statusCode = 400;
            throw error;
        }

        const cart = await Cart.findOne({ user: userId }).populate("items.product").session(session);
        if (!cart || !cart.items.length) {
            const error = new Error("Cart is empty");
            error.statusCode = 400;
            throw error;
        }

        // Build order items and total price
        // let totalPrice = 0;
        const orderItems = cart.items.map((item) => {
            const prod = item.product;
            const qty = item.quantity || 0;
            const price = item.itemTotal / item.quantity;
            return {
                product: prod,
                quantity: qty,
                price,
            };
        });

        const [created] = await Order.create(
            [
                {
                    user: userId,
                    items: orderItems,
                    totalPrice: cart.totalPrice,
                    deliveryAddress,
                    paymentMethod,
                },
            ],
            { session }
        );

        // clear cart
        await Cart.findOneAndUpdate({ user: userId }, { items: [], totalPrice: 0 }, { session });

        await session.commitTransaction();
        session.endSession();

        
        // Trigger the order workflow
        const serverUrl = SERVER_URL || "http://localhost:3000";
        await workFlowClient.trigger({
            url: `${serverUrl}/api/v1/workflows/order`,
            body: { orderId: created._id }
        });

        res.status(201).json({ success: true, message: "Order created successfully", data: created });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error)
    }
}

export const getOrderDetails = async (req,res,next)=>{
    try {
        const userId = req.user && req.user._id;
        if (!userId) {
            const error = new Error("Unauthorized");
            error.statusCode = 401;
            throw error;
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error("Invalid order id");
            error.statusCode = 400;
            throw error;
        }

        const order = await Order.findById(id).populate("items.product", "name price slug image").populate("user", "name email");
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }

        // allow access if owner or admin
        if (String(order.user._id) !== String(userId) && req.user.role !== "ADMIN") {
            const error = new Error("Forbidden");
            error.statusCode = 403;
            throw error;
        }

        res.status(200).json({ success: true, message: "Order details fetched", data: order });
    } catch (error) {
        next(error)
    }
}

//admin controller
export const getAllOrders = async (req,res,next)=>{
    try {
        if (!req.user || req.user.role !== "ADMIN") {
            const error = new Error("Forbidden: Admins only");
            error.statusCode = 403;
            throw error;
        }

        const { page = 1, limit = 50 } = req.query;
        const p = Math.max(1, parseInt(page, 10) || 1);
        const l = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));

        const orders = await Order.find()
            .populate("user", "name email")
            .populate("items.product", "name price slug image")
            .sort({ createdAt: -1 })
            .skip((p - 1) * l)
            .limit(l);

        res.status(200).json({ success: true, message: "All orders fetched", data: orders });
    } catch (error) {
        next(error)
    }
}

export const updateOrderStatus = async (req,res,next)=>{
    try {
        if (!req.user || req.user.role !== "ADMIN") {
            const error = new Error("Forbidden: Admins only");
            error.statusCode = 403;
            throw error;
        }

        const { id } = req.params;
        const { status } = req.body;
        const allowed = ["PENDING", "PREPARING", "SHIPPED", "DELIVERED"];
        if (!status || !allowed.includes(status)) {
            const error = new Error("Invalid status");
            error.statusCode = 400;
            throw error;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error("Invalid order id");
            error.statusCode = 400;
            throw error;
        }

        const order = await Order.findByIdAndUpdate(id, { status }, { new: true }).populate("items.product", "name price slug image").populate("user", "name email");
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }

        
        // Notify the workflow about the status change
        await workFlowClient.notify({
            eventId: `order-updated-${id}`,
            eventData: { status }
        });

        res.status(200).json({ success: true, message: "Order status updated", data: order });
    } catch (error) {
        next(error);
    }
}