import dotenv from "dotenv";
import { app } from "./app.js";
import logger from "./utils/logger.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;

// connect to the database
connectDB()
  .then(() => {
    app.listen(port, () => {
      logger.info(`⚙️ Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    logger.error("Database connection failed:", error);
  });
