import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

const resolveProductByIdOrSlug = async (identifier) => {
    if (mongoose.Types.ObjectId.isValid(String(identifier))) {
        return await Product.findById(identifier).select('_id name price slug image available').lean();
    }
    return await Product.findOne({ slug: String(identifier).toLowerCase() }).select('_id name price slug image available').lean();
}

export const getAllCartItems = async(req,res,next)=>{
try {
    const userId = req.user && req.user._id;
        if (!userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 401;
            throw error;
        }

        const cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name price slug image category title description currency')
            .lean();

        const items = (cart && cart.items) ? cart.items : [];
        res.status(200).json({ success: true, message: 'Cart items fetched', data: {items, totalPrice: cart?.totalPrice || 0} });
} catch (error) {
    next(error);
}
}

export const addItemToCart = async(req,res,next)=>{
try {
    const userId = req.user && req.user._id;
        if (!userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 401;
            throw error;
        }
    
    const { product, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10) || 1;
    if (qty < 1) {
        const error = new Error('Quantity must be at least 1');
        error.statusCode = 400;
        throw error;
    }
    if (!product) {
        const error = new Error('Product is required');
        error.statusCode = 400;
        throw error;
    }

    const productDoc = await resolveProductByIdOrSlug(product);
    if (!productDoc) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }
    // prevent adding unavailable products to cart
    if (productDoc.available === false) {
        const error = new Error('Sorry, this product is currently unavailable');
        error.statusCode = 400;
        throw error;
    }

    // atomically decrement stock only if enough stock exists and product is available
    const updatedProduct = await Product.findOneAndUpdate(
        { _id: productDoc._id, stock: { $gte: qty }, available: true },
        { $inc: { stock: -qty } },
        { new: true }
    );
    if (!updatedProduct) {
        const error = new Error('Insufficient stock for this product');
        error.statusCode = 400;
        throw error;
    }
    const price = productDoc.price;
    const itemTotal = price * qty;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({
            user: userId,
            items: [{
                product: productDoc._id,
                quantity: qty,
                price,
                itemTotal
                }],
                totalPrice: itemTotal,
        });
    } else {
        const itemIndex = cart.items.findIndex(item => String(item.product) === String(productDoc._id));
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += qty;
            cart.items[itemIndex].itemTotal =
                cart.items[itemIndex].quantity * price;
        } else {
            cart.items.push({
                product: productDoc._id,
                quantity: qty,
                price,
                itemTotal,
                });
        }
        cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.itemTotal,
        0
        );
        await cart.save();
    }
    

    await cart.populate('items.product', 'name price slug image');
    res.status(201).json({ success: true, message: 'Item added to cart', data: cart.items });
} catch (error) {
    next(error);
}
}

export const updateItemInCart = async(req,res,next)=>{
try {
    const userId = req.user && req.user._id;
    if (!userId) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
    }

    const { slug } = req.params; // product slug
    const { quantity } = req.body;
    if (quantity === undefined) {
        const error = new Error('Quantity is required');
        error.statusCode = 400;
        throw error;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
        const error = new Error('Quantity must be a non-negative integer');
        error.statusCode = 400;
        throw error;
    }

    const productDoc = await resolveProductByIdOrSlug(slug);
    if (!productDoc) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    // prevent updating cart to include unavailable product
    if (productDoc.available === false && qty > 0) {
        const error = new Error('Cannot add/update: product is currently unavailable');
        error.statusCode = 400;
        throw error;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        const error = new Error('Cart not found');
        error.statusCode = 404;
        throw error;
    }

    const itemIndex = cart.items.findIndex(item => String(item.product) === String(productDoc._id));
    if (itemIndex === -1) {
        const error = new Error('Item not in cart');
        error.statusCode = 404;
        throw error;
    }
    const currentQty = cart.items[itemIndex].quantity;
    const delta = qty - currentQty;
    if (delta > 0) {
        // need to reserve more stock
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productDoc._id, stock: { $gte: delta }, available: true },
            { $inc: { stock: -delta } },
            { new: true }
        );
        if (!updatedProduct) {
            const error = new Error('Insufficient stock to increase quantity');
            error.statusCode = 400;
            throw error;
        }
    } else if (delta < 0) {
        // return stock for decreased quantity
        await Product.findByIdAndUpdate(productDoc._id, { $inc: { stock: -delta } });
    }
    if (qty === 0) {
        // remove item
        cart.items.splice(itemIndex, 1);
    } else {
        cart.items[itemIndex].quantity = qty;
        cart.items[itemIndex].itemTotal =
            cart.items[itemIndex].price * qty;
            cart.totalPrice = cart.items.reduce(
            (sum, item) => sum + item.itemTotal,
            0);
    }

    await cart.save();
    await cart.populate('items.product', 'name price slug image');
    res.status(200).json({ success: true, message: 'Cart updated', data: cart.items });
} catch (error) {
    next(error);
}
}

export const removeItemFromCart = async(req,res,next)=>{
try {
    const userId = req.user && req.user._id;
    if (!userId) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
    }

    const { slug } = req.params;
    const productDoc = await resolveProductByIdOrSlug(slug);
    if (!productDoc) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        const error = new Error('Cart not found');
        error.statusCode = 404;
        throw error;
    }

    const beforeLen = cart.items.length;
    const removedItems = cart.items.filter(item => String(item.product) === String(productDoc._id));
    cart.items = cart.items.filter(item => String(item.product) !== String(productDoc._id));
    if (cart.items.length === beforeLen) {
        const error = new Error('Item not in cart');
        error.statusCode = 404;
        throw error;
    }

    // restore stock for removed items
    const restoreQty = removedItems.reduce((s, it) => s + (it.quantity || 0), 0);
    if (restoreQty > 0) {
        await Product.findByIdAndUpdate(productDoc._id, { $inc: { stock: restoreQty } });
    }
    cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.itemTotal,
    0
    );
    await cart.save();
    await cart.populate('items.product', 'name price slug image');
    res.status(200).json({ success: true, message: 'Item removed from cart', data: cart.items });
} catch (error) {
    next(error);
}
}