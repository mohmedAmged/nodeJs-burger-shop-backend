//admin
import Order from "../models/order.model.js";
import Voucher from "../models/voucher.model.js";

// Helper to check admin role
const isAdmin = (user) => user && user.role === 'ADMIN';

export const getAllVouchers = async (req, res, next) => {
    try {
        if (!isAdmin(req.user)) {
             return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        const vouchers = await Voucher.find();
        res.status(200).json({ success: true, data: vouchers });
    } catch (error) {
        next(error);
    }
};

export const createVoucher = async (req, res, next) => {
    try {
        if (!isAdmin(req.user)) {
             return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        const { code, type, value, maxDiscount, minOrderValue, isGlobal, allowedUsers, maxTotalUsage, oncePerUser, startDate, endDate, status } = req.body;

        const existingVoucher = await Voucher.findOne({ code });
        if (existingVoucher) {
            return res.status(400).json({ message: 'Voucher code already exists' });
        }

        const newVoucher = await Voucher.create({
            code,
            type,
            value,
            maxDiscount,
            minOrderValue,
            isGlobal,
            allowedUsers,
            maxTotalUsage,
            oncePerUser,
            startDate,
            endDate,
            status
        });

        res.status(201).json({ success: true, message: 'Voucher created successfully', data: newVoucher });
    } catch (error) {
        next(error);
    }
};

export const updateVoucher = async (req, res, next) => {
    try {
        if (!isAdmin(req.user)) {
             return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        const { id } = req.params;
        const updates = req.body;

        const updatedVoucher = await Voucher.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedVoucher) {
            return res.status(404).json({ message: 'Voucher not found' });
        }

        res.status(200).json({ success: true, message: 'Voucher updated successfully', data: updatedVoucher });
    } catch (error) {
        next(error);
    }
};

export const deleteVoucher = async (req, res, next) => {
    try {
        if (!isAdmin(req.user)) {
             return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        const { id } = req.params;
        const deletedVoucher = await Voucher.findByIdAndDelete(id);

        if (!deletedVoucher) {
            return res.status(404).json({ message: 'Voucher not found' });
        }

        res.status(200).json({ success: true, message: 'Voucher deleted successfully' });
    } catch (error) {
        next(error);
    }
};

//user usage
export const validateVoucher = async (req, res, next) => {
    try {
        const { code, cartTotal } = req.body;
        const userId = req.user._id;

        const voucher = await Voucher.findOne({ code });

        if (!voucher) {
            return res.status(404).json({ message: 'Invalid voucher code' });
        }

        if (voucher.status !== 'ACTIVE') {
            return res.status(400).json({ message: 'Voucher is not active' });
        }

        const now = new Date();
        if (voucher.startDate && now < new Date(voucher.startDate)) {
            return res.status(400).json({ message: 'Voucher is not yet valid' });
        }
        if (voucher.endDate && now > new Date(voucher.endDate)) {
            return res.status(400).json({ message: 'Voucher has expired' });
        }

        if (voucher.maxTotalUsage !== null && voucher.maxTotalUsage !== undefined && voucher.usedCount >= voucher.maxTotalUsage) {
            return res.status(400).json({ message: 'Voucher usage limit reached' });
        }

        if (voucher.minOrderValue && cartTotal < voucher.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value of ${voucher.minOrderValue} required` });
        }

        if (!voucher.isGlobal) {
             if (!voucher.allowedUsers.includes(userId)) {
                 return res.status(403).json({ message: 'This voucher is not applicable to you' });
             }
        }
        
        
        if (voucher.oncePerUser) {
            //check if user used it before
            const usedBefore = await Order.findOne({ user: userId, voucher: voucher._id });
            if (usedBefore) {
                return res.status(400).json({ message: 'You have already used this voucher' });
            }
        }

        // Calculate potential discount
        let discount = 0;
        if (voucher.type === 'PERCENTAGE') {
            discount = (voucher.value / 100) * cartTotal;
            if (voucher.maxDiscount && discount > voucher.maxDiscount) {
                discount = voucher.maxDiscount;
            }
        } else {
            discount = voucher.value;
        }

        // Return validated info
        res.status(200).json({ 
            success: true, 
            message: 'Voucher applied successfully',
            voucher: {
                _id: voucher._id,
                code: voucher.code,
                discountValue: discount,
                type: voucher.type
            }
        });

    } catch (error) {
        next(error);
    }
};
