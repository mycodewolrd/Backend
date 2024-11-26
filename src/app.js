import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

//Middleware: who should be talk to data Base
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
)

// common Middleware
app.use(express.json({limit: "16kb"})) //Parses incoming JSON payloads in requests with a size limit of 16KB.
app.use(express.urlencoded({extended: true, limit:"16kb"}))//Parses incoming URL-encoded data (e.g., form submissions) with a size limit of 16KB and allows rich objects via extended: true.
app.use(express.static("public"))//Serves static files (like HTML, CSS, images, etc.) from the "public" directory.
app.use(cookieParser()) //Parses cookies from incoming requests and makes them accessible via req.cookies in your Express app.



//routes import
import userRouter from "./routes/user.routes.js";


//routes declaretion
app.use("/api/v1/users", userRouter) //its gives you the access of user.router.js file
// http://localhost:8000/api/v1/users/register




export { app };