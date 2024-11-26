import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env"

})
const PORT = process.env.PORT || 7000;

connectDB()
.then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error("Mongodb connection failed:", err);
  process.exit(1);
})





// // require('dotenv').config({path: './env'})
// import dotenv from "dotenv";
// import connectDB from "./db/index.js";
// import { app } from "./app.js";
// dotenv.config({
//   path: "./.env",
// });

// connectDB()
//   .then(() => {
//     app.listen(process.env.PORT || 8000, () => {
//       console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.log("MONGO db connection failed !!! ", err);
//   });

// //It's not a best professional approch.... So we do this on db
// // import express from "express";
// // const app = express();
// // ( async () => {
// //     try {
// //         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
// //         app.on("error", (error) => {
// //             console.error("Connection error:", error);
// //         })

// //         app.listen(process.env.PORT, ()=> {
// //             console.log("listening on port ${process.env.PORT}");
// //         })
// //     } catch (error) {
// //         console.error("Error: ", error)
// //         throw err
// //     }
// // })()
