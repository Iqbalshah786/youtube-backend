import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize, json, uncolorize } = format;

// 1) Console: colored, timestamped
const consoleFormat = combine(
  colorize(),
  printf(({ level, message, timestamp }) => {
    return `${level}: ${message}`;
  })
);

// 2) File: uncolored JSON with ISO timestamp
const fileFormat = combine(uncolorize(), timestamp(), json());

const logger = createLogger({
  level: "info",
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({
      filename: "app.log",
      format: fileFormat,
    }),
  ],
});

export default logger;
