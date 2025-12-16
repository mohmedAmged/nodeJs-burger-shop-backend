import { Router } from "express";
import { createProduct, getAllProducts, removeProduct, updateProduct } from "../controllers/product.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const productRouter = Router();
// public route
productRouter.get('/', getAllProducts);
// protected routes - only for admins
productRouter.post('/create', authorize, createProduct);
productRouter.put('/update/:slug', authorize, updateProduct);
productRouter.delete('/remove/:slug', authorize, removeProduct);

export default productRouter;