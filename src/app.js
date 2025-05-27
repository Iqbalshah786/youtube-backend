import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import logger from "./utils/logger.js";
import cookieParser from "cookie-parser";

const app = express();

// middlewares

// corse middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// security middleware
app.use(helmet());
// common middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// morgan format for logging
const morganFormat = ":method :url :status :response-time ms";

// middleware
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

//routes
//import routes
import healthcheckRouter from "./routes/healthcheck.routes.js";

//routes
app.use("/api/v1/healthcheck", healthcheckRouter);

export { app };
