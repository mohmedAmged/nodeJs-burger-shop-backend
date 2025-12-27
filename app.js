import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import { PORT } from './config/env.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import cartRouter from './routes/cart.routes.js';
import orderRouter from './routes/order.routes.js';
import connectToDatabase from './database/mongodb.js';
import errorMiddleware from './middlewares/error.middleware.js';
import arcjetMiddleware from './middlewares/arcjet.middleware.js';
import productRouter from './routes/product.routes.js';
import categoryRouter from './routes/category.routes.js';
import workflowRouter from './routes/workflow.routes.js';

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://burger-shop-gamma-wine.vercel.app', 
    'https://dashboard-admin-burger-shop.vercel.app'
  ],
  credentials: true,
}))
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser())
app.use(arcjetMiddleware)


app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/workflows', workflowRouter);
app.use(errorMiddleware)

app.get('/', (req, res)=>{
res.send('welcome to the burger backend api!');
});

// app.listen(PORT, async()=>{
//     console.log(`burger backend api work on http://localhost:${PORT}`);
//     await connectToDatabase()
// });
const start = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`burger backend api work on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start application:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;