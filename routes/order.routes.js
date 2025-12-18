import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { createOrder, getAllOrders, getOrderDetails, getUserOrders, updateOrderStatus } from "../controllers/order.controller.js";

const orderRouter = Router();

// user apis
orderRouter.post('/create', authorize, createOrder);
orderRouter.get('/my-orders', authorize, getUserOrders);
orderRouter.get('/my-orders/:id', authorize, getOrderDetails);

// admin apis
orderRouter.get('/all-orders', authorize, getAllOrders)
orderRouter.get('/all-orders/:id', authorize, getOrderDetails)
orderRouter.put('/:id/status', authorize, updateOrderStatus)
export default orderRouter;