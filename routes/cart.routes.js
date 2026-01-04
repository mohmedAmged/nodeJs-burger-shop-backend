import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { addItemToCart, getAllCartItems, removeItemFromCart, updateItemInCart, applyVoucherToCart, removeVoucherFromCart } from "../controllers/cart.controller.js";

const cartRouter = Router();

cartRouter.get('/', authorize, getAllCartItems);

cartRouter.post('/add', authorize, addItemToCart);

cartRouter.put('/update/:slug', authorize, updateItemInCart);

cartRouter.delete('/remove/:slug', authorize, removeItemFromCart);

cartRouter.post('/apply-voucher', authorize, applyVoucherToCart);
cartRouter.delete('/remove-voucher', authorize, removeVoucherFromCart);

export default cartRouter;