import { Router } from "express";
import { createVoucher, deleteVoucher, getAllVouchers, updateVoucher, validateVoucher } from "../controllers/voucher.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const voucherRouter = Router();

// admin routes
voucherRouter.get('/', authorize, getAllVouchers);

voucherRouter.post('/create', authorize, createVoucher);

voucherRouter.put('/update/:id', authorize, updateVoucher);

voucherRouter.delete('/delete/:id', authorize, deleteVoucher);

//user routes to validate voucher
voucherRouter.post('/validate', authorize, validateVoucher);

export default voucherRouter;
