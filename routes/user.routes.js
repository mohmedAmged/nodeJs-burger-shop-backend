import { Router } from "express";
import { getAllUsers, getUser, updateUser } from "../controllers/user.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const userRouter = Router();
userRouter.get('/', authorize, getAllUsers);
userRouter.get('/:slug', authorize, getUser);
userRouter.put('/update/:slug', authorize, updateUser);
export default userRouter;