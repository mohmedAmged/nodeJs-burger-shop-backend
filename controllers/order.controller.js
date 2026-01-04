import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Order from "../models/order.model.js";
import Voucher from "../models/voucher.model.js";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";

// user controller
export const getUserOrders = async (req, res, next) => {
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

export const createOrder = async (req, res, next) => {
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

        const cart = await Cart.findOne({ user: userId }).populate("items.product").populate("voucher").session(session);
        if (!cart || !cart.items.length) {
            const error = new Error("Cart is empty");
            error.statusCode = 400;
            throw error;
        }

        // Voucher logic
        let finalPrice = cart.totalPrice;
        let savings = 0;
        let appliedVoucherId = null;

        if (cart.voucher) {
            const voucher = cart.voucher;
            const now = new Date();
            let isValid = true;
            let failureReason = '';

            if (voucher.status !== 'ACTIVE') { isValid = false; failureReason = 'Voucher inactive'; }
            if (voucher.startDate && now < new Date(voucher.startDate)) { isValid = false; failureReason = 'Voucher not started'; }
            if (voucher.endDate && now > new Date(voucher.endDate)) { isValid = false; failureReason = 'Voucher expired'; }
            if (voucher.minOrderValue && cart.totalPrice < voucher.minOrderValue) { isValid = false; failureReason = 'Min order value not met'; }

            if (voucher.maxTotalUsage !== null && voucher.maxTotalUsage !== undefined && voucher.usedCount >= voucher.maxTotalUsage) {
                isValid = false;
                failureReason = 'Voucher usage limit reached';
            }

            if (!voucher.isGlobal && !voucher.allowedUsers.includes(userId)) {
                isValid = false;
                failureReason = 'Voucher not allowed for user';
            }

            if (!isValid) {
                const error = new Error(`Voucher error: ${failureReason}`);
                error.statusCode = 400;
                throw error;
            }

            let incrementFilter = { _id: voucher._id };
            if (voucher.maxTotalUsage !== null && voucher.maxTotalUsage !== undefined) {
                incrementFilter.usedCount = { $lt: voucher.maxTotalUsage };
            }

            const updatedVoucher = await Voucher.findOneAndUpdate(
                incrementFilter,
                { $inc: { usedCount: 1 } },
                { new: true, session }
            );

            if (!updatedVoucher) {
                const error = new Error('Voucher usage limit exceeded just now');
                error.statusCode = 400;
                throw error;
            }

            let discount = 0;
            if (voucher.type === 'PERCENTAGE') {
                discount = (voucher.value / 100) * cart.totalPrice;
                if (voucher.maxDiscount && discount > voucher.maxDiscount) discount = voucher.maxDiscount;
            } else {
                discount = voucher.value;
            }
            if (discount > cart.totalPrice) discount = cart.totalPrice;

            savings = discount;
            finalPrice = cart.totalPrice - discount;
            appliedVoucherId = voucher._id;
        }

        // Build order items
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
                    totalPrice: cart.totalPrice, // Original total
                    deliveryAddress,
                    paymentMethod,
                    voucher: appliedVoucherId,
                    savings: savings,
                    totalPriceAfterCode: finalPrice
                },
            ],
            { session }
        );

        // clear cart logic
        await Cart.findOneAndUpdate(
            { user: userId },
            {
                items: [],
                totalPrice: 0,
                voucher: null,
                savings: 0,
                totalPriceAfterCode: 0
            },
            { session }
        );

        await session.commitTransaction();
        session.endSession();


        // Trigger the order workflow
        let origin = SERVER_URL;
        if (!origin || !/^https?:\/\//i.test(origin)) {
            const forwardedProto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0];
            origin = `${forwardedProto}://${req.get('host')}`;
        }
        const destination = `${origin.replace(/\/$/, '')}/api/v1/workflows/order`;

        try {
            await workflowClient.trigger({
                url: destination,
                body: { orderId: created._id },
                retries: 0
            });
        } catch (wfError) {
            console.error('Failed to trigger workflow (non-fatal):', wfError?.message || wfError);
        }

        res.status(201).json({ success: true, message: "Order created successfully", data: created });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error)
    }
}

export const getOrderDetails = async (req, res, next) => {
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
        };

        res.status(200).json({ success: true, message: "Order details fetched", data: order });
    } catch (error) {
        next(error)
    }
}

//admin controller
export const getAllOrders = async (req, res, next) => {
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

export const updateOrderStatus = async (req, res, next) => {
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
        let origin = SERVER_URL;
        if (!origin || !/^https?:\/\//i.test(origin)) {
            const forwardedProto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0];
            origin = `${forwardedProto}://${req.get('host')}`;
        }
        const destination = `${origin.replace(/\/$/, '')}/api/v1/workflows/order`;

        try {
            console.log(`Triggering updated workflow for: order-updated-${id} with status ${status}`);
            await workflowClient.trigger({
                url: destination,
                body: { orderId: id },
                retries: 0
            });
        } catch (wfError) {
            console.error('Failed to trigger workflow update (non-fatal):', wfError?.message || wfError);
        }

        res.status(200).json({ success: true, message: "Order status updated", data: order });
    } catch (error) {
        next(error);
    }
}