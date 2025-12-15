import { Router } from "express";

const orderRouter = Router();

orderRouter.post('/create', (req, res) => {
    res.send({ message: 'create a new order' });
});

orderRouter.get('/:id', (req, res) => {
    res.send({ message: `get order with id ${req.params.id}` });
});

export default orderRouter;