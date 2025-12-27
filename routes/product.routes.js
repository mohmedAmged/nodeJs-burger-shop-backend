import { Router } from "express";
import { createProduct, getAllProducts, removeProduct, updateProduct } from "../controllers/product.controller.js";
import authorize from "../middlewares/auth.middleware.js";

import upload from "../middlewares/upload.middleware.js";

const productRouter = Router();
// public route
productRouter.get('/', getAllProducts);
// protected routes - only for admins
productRouter.post('/create', authorize, upload.single('image'), createProduct);
productRouter.put('/update/:slug', authorize, upload.single('image'), updateProduct);
productRouter.delete('/remove/:slug', authorize, removeProduct);

export default productRouter;