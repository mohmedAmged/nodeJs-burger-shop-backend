import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import Voucher from "../models/voucher.model.js";

// HELPERS
const resolveProductByIdOrSlug = async (identifier) => {
    if (mongoose.Types.ObjectId.isValid(String(identifier))) {
        return await Product.findById(identifier).select('_id name price slug image available').lean();
    }
    return await Product.findOne({ slug: String(identifier).toLowerCase() }).select('_id name price slug image available').lean();
}
const recalcCartTotal = (items) =>
    items.reduce((sum, item) => sum + item.itemTotal, 0);

const applyVoucherLogic = async (cart, userId) => {
    cart.totalPrice = recalcCartTotal(cart.items);
    
    if (!cart.voucher) {
        cart.savings = 0;
        cart.totalPriceAfterCode = cart.totalPrice;
        return;
    }

    const voucher = await Voucher.findById(cart.voucher);
    if (!voucher) {
         cart.voucher = null;
         cart.savings = 0;
         cart.totalPriceAfterCode = cart.totalPrice;
         return;
    }

    // Re-validate voucher
    const now = new Date();
    let isValid = true;
    
    if (voucher.status !== 'ACTIVE') isValid = false;
    if (voucher.startDate && now < new Date(voucher.startDate)) isValid = false;
    if (voucher.endDate && now > new Date(voucher.endDate)) isValid = false;
    if (voucher.minOrderValue && cart.totalPrice < voucher.minOrderValue) isValid = false;

    if (voucher.maxTotalUsage !== null && voucher.maxTotalUsage !== undefined && voucher.usedCount >= voucher.maxTotalUsage) isValid = false;
    
    // User specific check
     if (!voucher.isGlobal) {
         if (!voucher.allowedUsers.includes(userId)) {
             isValid = false;
         }
    }

    if (!isValid) {
        cart.voucher = null;
        cart.savings = 0;
        cart.totalPriceAfterCode = cart.totalPrice;
        return;
    }

    // Calculate discount
    let discount = 0;
    if (voucher.type === 'PERCENTAGE') {
        discount = (voucher.value / 100) * cart.totalPrice;
        if (voucher.maxDiscount && discount > voucher.maxDiscount) {
            discount = voucher.maxDiscount;
        }
    } else {
        discount = voucher.value;
    }

    if (discount > cart.totalPrice) discount = cart.totalPrice;

    cart.savings = discount;
    cart.totalPriceAfterCode = cart.totalPrice - discount;
};

// GET CART

export const getAllCartItems = async(req,res,next)=>{
try {
    const userId = req.user && req.user._id;
        if (!userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 401;
            throw error;
        }

        let cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name price slug image category title description currency')
            .populate('voucher')
            .lean(); 
        
        const items = (cart && cart.items) ? cart.items : [];
        const responseData = {
            items,
            totalPrice: cart?.totalPrice || 0,
            voucher: cart?.voucher || null,
            savings: cart?.savings || 0,
            totalPriceAfterCode: cart?.totalPriceAfterCode || (cart?.totalPrice || 0)
        };
        res.status(200).json({ success: true, message: 'Cart items fetched', data: responseData });
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
    if (isNaN(qty) || qty < 1) {
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
    // const price = productDoc.price;
    const itemTotal = productDoc.price * qty;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({
            user: userId,
            items: [{
                product: productDoc._id,
                quantity: qty,
                itemTotal
                }],
                totalPrice: itemTotal,
                totalPriceAfterCode: itemTotal
        });
        // new cart, no voucher yet
    } else {
      const item = cart.items.find(
        (i) => String(i.product) === String(productDoc._id)
      );

      if (item) {
        item.quantity += qty;
        item.itemTotal = item.quantity * productDoc.price;
      } else {
        cart.items.push({
          product: productDoc._id,
          quantity: qty,
          itemTotal,
        });
      }
      // logic handles save
      await applyVoucherLogic(cart, userId);
      await cart.save();
    }
    

    await cart.populate('items.product', 'name price slug image');
    if (cart.voucher) await cart.populate('voucher');

    res.status(201).json({ 
        success: true, 
        message: 'Item added to cart', 
        data: {
            items: cart.items,
            totalPrice: cart.totalPrice,
            voucher: cart.voucher,
            savings: cart.savings,
            totalPriceAfterCode: cart.totalPriceAfterCode
        } 
    });
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
        cart.items[itemIndex].itemTotal = productDoc.price * qty;
    }
    
    await applyVoucherLogic(cart, userId);
    await cart.save();
    
    await cart.populate('items.product', 'name price slug image category title description currency');
    if (cart.voucher) await cart.populate('voucher');

    res.status(200).json({
         success: true, 
         message: 'Cart updated', 
         data: {
            items: cart.items,
            totalPrice: cart.totalPrice,
            voucher: cart.voucher,
            savings: cart.savings,
            totalPriceAfterCode: cart.totalPriceAfterCode
        }
        });
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
    
    await applyVoucherLogic(cart, userId);
    await cart.save();
    
    await cart.populate('items.product', 'name price slug image category title description currency');
    if (cart.voucher) await cart.populate('voucher');

    res.status(200).json({
        success: true, 
        message: 'Item removed from cart', 
        data: {
            items: cart.items,
            totalPrice: cart.totalPrice,
            voucher: cart.voucher,
            savings: cart.savings,
            totalPriceAfterCode: cart.totalPriceAfterCode
        } 
    });
} catch (error) {
    next(error);
}
}

export const applyVoucherToCart = async (req, res, next) => {
    try {
        const userId = req.user && req.user._id;
        const { code } = req.body;

        if (!code) {
             return res.status(400).json({ message: 'Voucher code is required'});
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
             return res.status(404).json({ message: 'Cart not found' });
        }

        const voucher = await Voucher.findOne({ code });
        if (!voucher) {
            return res.status(404).json({ message: 'Invalid voucher code' });
        }
        
        cart.voucher = voucher._id;
        
        await applyVoucherLogic(cart, userId);
        
        if (!cart.voucher) {
             return res.status(400).json({ message: 'Voucher valid but not applicable to this cart (e.g. min order value not met)' });
        }

        await cart.save();
        await cart.populate('voucher');
        await cart.populate('items.product');

        res.status(200).json({
            success: true,
            message: 'Voucher applied successfully',
            data: {
                items: cart.items,
                totalPrice: cart.totalPrice,
                voucher: cart.voucher,
                savings: cart.savings,
                totalPriceAfterCode: cart.totalPriceAfterCode
            }
        });

    } catch (error) {
        next(error);
    }
};

export const removeVoucherFromCart = async (req, res, next) => {
    try {
        const userId = req.user && req.user._id;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
             return res.status(404).json({ message: 'Cart not found' });
        }

        cart.voucher = null;
        await applyVoucherLogic(cart, userId);
        await cart.save();
        
        res.status(200).json({
            success: true,
            message: 'Voucher removed',
             data: {
                items: cart.items,
                totalPrice: cart.totalPrice,
                voucher: null,
                savings: 0,
                totalPriceAfterCode: cart.totalPrice
            }
        });
    } catch (error) {
        next(error);
    }
};