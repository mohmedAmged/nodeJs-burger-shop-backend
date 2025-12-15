import { Router } from "express";

const cartRouter = Router();

cartRouter.get('/', (req, res)=>res.send({message: 'get all cart items'}));
cartRouter.post('/add', (req, res)=>res.send({message: 'add item to cart'}));
cartRouter.put('/update/:id', (req, res)=>res.send({message: `update item with id ${req.params.id} in cart`}));
cartRouter.delete('/remove/:id', (req, res)=>res.send({message: `remove item with id ${req.params.id} from cart`}));

export default cartRouter;