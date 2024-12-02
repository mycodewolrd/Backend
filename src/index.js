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
