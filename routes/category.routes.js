import { Router } from "express";

const categoryRouter = Router()

categoryRouter.get('/', (req, res) => {
    res.send('Get all categories')
});

categoryRouter.post('/create', (req, res) => {
    res.send('create new category')
});

categoryRouter.put('/update/:slug', (req, res) => {
    res.send('update category by slug')
});

categoryRouter.delete('/remove/:slug', (req, res) => {
    res.send('delete category by slug')
});

export default categoryRouter;