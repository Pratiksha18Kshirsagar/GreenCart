import express from 'express';
import 'dotenv/config.js'
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDb from './configs/db.js';
import userRouter from './routes/userRoutes.js';

const app =express();
const port = process.env.PORT || 4000;


//allow multiple origins
const allowedOrigins = ['http://localhost:5173'];

await connectDb();

//Middleware configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin:allowedOrigins , Credentials:true}));


app.get("/" , (req,res)=>{
    res.send("API is working!!")
})
app.use("/api/user" , userRouter);

app.listen(port ,()=>{
    console.log(`App is listening on ${port}`);
})