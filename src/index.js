import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(`Server crash: ${error}`);
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running at port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection failed", error);
  });
