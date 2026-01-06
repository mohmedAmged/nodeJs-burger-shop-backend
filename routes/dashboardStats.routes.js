import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardStats.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const dashboardStatsRouter = Router()

dashboardStatsRouter.get('/', authorize, getDashboardStats);

export default dashboardStatsRouter;