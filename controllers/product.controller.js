import Product from "../models/product.model.js";
import slug from "slug";

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
        const products = await Product.find().populate('category').select('-__v');
        res.status(200).json({ success: true, message: 'products fetched successfully', data: products });
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
         const { name, description, price, image, category, title, available, currency } = req.body;
         if (!name || price === undefined || !category) {
            const error = new Error('Missing required fields: name, price and category are required');
            error.statusCode = 400;
            throw error;
        }
        const productSlug = await generateUniqueSlug(name);
        const product = await Product.create({
            name,
            description,
            price,
            currency,
            image,
            category,
            slug: productSlug,
            title,
            available: available !== undefined ? available : true
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
        res.status(200).json({ success: true, message: 'Product removed successfully', data: product });
    } catch (error) {
        next(error);
    }
}
