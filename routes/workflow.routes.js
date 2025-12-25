import { Router } from "express";
import { orderWorkflow } from "../controllers/workflow.controller.js";

const workflowRouter = Router();

workflowRouter.post("/order", orderWorkflow);

export default workflowRouter;