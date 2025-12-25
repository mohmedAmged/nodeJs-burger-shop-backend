import { Router } from "express";

const workflowRouter = Router();
import { orderWorkflow } from "../controllers/workflow.controller.js";

workflowRouter.post("/order", orderWorkflow);

export default workflowRouter;