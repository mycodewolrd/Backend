import express from 'express';
import cors from 'cors';
const app = express();

//Middleware: who should be talk to data Base
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
)

// common Middleware
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))



export { app };