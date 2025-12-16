import { Router } from "express";

const orderRouter = Router();

orderRouter.post('/create', (req, res) => {
    res.send({ message: 'create a new order' });
});

orderRouter.get('/:id', (req, res) => {
    res.send({ message: `get order with id ${req.params.id}` });
});

orderRouter.get('/view', (req, res) => {
    res.send({ message: `view all orders from users by admin`});
})

orderRouter.put('/update-order-status', (req, res) => {
    res.send({ message: `update order status by admin`});
})
export default orderRouter;