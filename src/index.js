import { app } from './app.js';


app.listen
// require('dotenv').config({path: './env'})
import dotenv from 'dotenv';
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})
connectDB()



//It's not a best professional approch.... So we do this on db
// import express from "express";
// const app = express();
// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error", (error) => {
//             console.error("Connection error:", error);
//         })

//         app.listen(process.env.PORT, ()=> {
//             console.log("listening on port ${process.env.PORT}");
//         })
//     } catch (error) {
//         console.error("Error: ", error)
//         throw err
//     }
// })()