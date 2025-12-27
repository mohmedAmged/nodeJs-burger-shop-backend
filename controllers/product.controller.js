/* eslint-disable no-unused-vars */
import Product from "../models/product.model.js";
import slug from "slug";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_SECRET } from "../config/env.js";

const generateUniqueSlug = async (name, excludeId = null) => {
    const base = slug(name || 'product', { lower: true });
    let unique = base;
    let counter = 0;
    // loop until a unique slug is found
    while (true) {
        const query = { slug: unique };
        if (excludeId) query._id = { $ne: excludeId };
        const exists = await Product.findOne(query).select('_id').lean();
        if (!exists) return unique;
        counter++;
        unique = `${base}-${counter}`;
    }
};

export const getAllProducts = async(req,res,next)=>{
    try {
        let isAdmin = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const requester = await User.findById(decoded.userId).select('role').lean();
                if (requester && requester.role === 'ADMIN') isAdmin = true;
            } catch (err) {
                // ignore invalid token - treat as public
            }
        }

        // const selectFields = isAdmin ? '-__v' : '-__v -stock';
        const products = await Product.find().select('-__v').populate('category').lean();
        const mappedProducts = products.map(prod => {
            // ensure availability reflects stock
            if (typeof prod.stock === 'number' && prod.stock <= 0) {
                prod.available = false;
            }
            // hide stock for non-admins
            if (!isAdmin) {
                delete prod.stock;
            }
            return prod;
        });
        res.status(200).json({ success: true, message: 'products fetched successfully', data: mappedProducts });
    } catch (error) {
        next(error);
    }
}

export const createProduct = async(req,res,next)=>{
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            const error = new Error('Forbidden: Admins only');
            error.statusCode = 403;
            throw error;
        }
         const { name, description, price, image, category, title, available, currency, stock } = req.body;
         if (!name || price === undefined || !category) {
            const error = new Error('Missing required fields: name, price and category are required');
            error.statusCode = 400;
            throw error;
        }

        // stock validation (admin must provide)
        if (stock === undefined) {
            const error = new Error('Stock is required for product creation');
            error.statusCode = 400;
            throw error;
        }
        const stockNum = Number(stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
            const error = new Error('Stock must be a non-negative integer');
            error.statusCode = 400;
            throw error;
        }
        const productSlug = await generateUniqueSlug(name);

        // derive availability from stock if not explicitly provided
        const finalAvailable = typeof available === 'boolean' ? available : (stockNum > 0);
        const product = await Product.create({
            name,
            description,
            price,
            currency,
            image,
            category,
            slug: productSlug,
            title,
            available: finalAvailable,
            stock: stockNum
        });
        res.status(201).json({ success: true, message: 'Product created successfully', data: product });
    } catch (error) {
        next(error);
    }
}

export const updateProduct = async(req,res,next)=>{
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            const error = new Error('Forbidden: Admins only');
            error.statusCode = 403;
            throw error;
        }
        const { slug: productSlug } = req.params;
        const updateData = { ...req.body };

        // validate and normalize stock if provided
        if (updateData.stock !== undefined) {
            const stockNum = Number(updateData.stock);
            if (!Number.isInteger(stockNum) || stockNum < 0) {
                const error = new Error('Stock must be a non-negative integer');
                error.statusCode = 400;
                throw error;
            }
            updateData.stock = stockNum;
            // if admin didn't explicitly set `available`, derive it from stock
            if (updateData.available === undefined) {
                updateData.available = stockNum > 0;
            }
        }
        if (updateData.name) {
            const existingProduct = await Product.findOne({ slug: productSlug }).select('_id').lean();
            const excludeId = existingProduct ? existingProduct._id : null;
            updateData.slug = await generateUniqueSlug(updateData.name, excludeId);
        }
        const product = await Product.findOneAndUpdate({ slug: productSlug }, updateData, { new: true, runValidators: true }).populate('category').select('-__v');
        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
    } catch (error) {
        next(error);
    }
}

export const removeProduct = async(req,res,next)=>{
    const products = await Product.find().select('-__v').populate('category').lean();
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            const error = new Error('Forbidden: Admins only');
            error.statusCode = 403;
            throw error;
        }
        const { slug: productSlug } = req.params;
        const product = await Product.findOneAndDelete({ slug: productSlug }).select('-__v');
        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ success: true, message: 'Product removed successfully', data: products });
    } catch (error) {
        next(error);
    }
}
