import express from 'express'
import cookieParser from 'cookie-parser';
import { PORT } from './config/env.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import cartRouter from './routes/cart.routes.js';
import orderRouter from './routes/order.routes.js';
import connectToDatabase from './database/mongodb.js';
import errorMiddleware from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser())
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);

app.use(errorMiddleware)

app.get('/', (req, res)=>{
res.send('welcome to the burger backend api!');
});

app.listen(PORT, async()=>{
    console.log(`burger backend api work on http://localhost:${PORT}`);
    await connectToDatabase()
});

export default app;