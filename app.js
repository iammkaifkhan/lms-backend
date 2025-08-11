import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
import miscRoutes from './routes/miscellaneousRoutes.js';
import dotenv from 'dotenv';
dotenv.config();


const app = express();



app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));

 app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));


 app.use(morgan('dev'));
 
 app.use('/ping', (req, res) => {
    res.send('pong');
 });

// routing of 4 modules

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/', miscRoutes);

app.all('*', (req,res) => {
    res.send('404 Not Found');
});

app.use(errorMiddleware);




export default app;