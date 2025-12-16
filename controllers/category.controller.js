import Category from "../models/category.model.js";
import slug from "slug";

const generateUniqueSlug = async (name, excludeId = null) => {
    const base = slug(name || 'category', { lower: true });
    let unique = base;
    let counter = 0;
    while (true) {
        const query = { slug: unique };
        if (excludeId) query._id = { $ne: excludeId };
        const exists = await Category.findOne(query).select('_id').lean();
        if (!exists) return unique;
        counter++;
        unique = `${base}-${counter}`;
    }
};

export const getAllCategory = async (req, res, next) => {
    try {
        const categories = await Category.find().select('-__v');

        res.status(200).json({ success: true, message: 'categories fetched successfully', data: categories });
    } catch (error) {
        next(error);
    }
}

export const createCategory = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            const error = new Error('Forbidden: Admins only');
            error.statusCode = 403;
            throw error;
        }

        const { name, image } = req.body;
        if (!name) {
            const error = new Error('Name is required');
            error.statusCode = 400;
            throw error;
        }

        const categorySlug = await generateUniqueSlug(name);
        const category = await Category.create({
            name,
            image,
            slug: categorySlug
        });

        res.status(201).json({ success: true, message: 'Category created successfully', data: category });
    } catch (error) {
        next(error);
    }
}

export const updateCategory = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            const error = new Error('Forbidden: Admins only');
            error.statusCode = 403;
            throw error;
        }

        const { slug: categorySlug } = req.params;
        const updateData = { ...req.body };

        if (updateData.name) {
            const existing = await Category.findOne({ slug: categorySlug }).select('_id').lean();
            const excludeId = existing ? existing._id : null;
            updateData.slug = await generateUniqueSlug(updateData.name, excludeId);
        }

        const category = await Category.findOneAndUpdate({ slug: categorySlug }, updateData, { new: true, runValidators: true }).select('-__v');
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
    } catch (error) {
        next(error);
    }
}

export const removeCategory = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            const error = new Error('Forbidden: Admins only');
            error.statusCode = 403;
            throw error;
        }

        const { slug: categorySlug } = req.params;
        const category = await Category.findOneAndDelete({ slug: categorySlug }).select('-__v');

        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, message: 'Category removed successfully', data: category });
    } catch (error) {
        next(error);
    }
}