import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize, json, uncolorize } = format;

// 1)  PKT timestamp function
const pakistanTime = () =>
  new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
    .format(new Date())
    .replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/, "$3-$2-$1 $4");

// 2) Console: colored, timestamped
const consoleFormat = combine(
  colorize(),
  timestamp({ format: pakistanTime }),
  printf(({ level, message, timestamp }) => {
    return ` ${level}: ${message} at ${timestamp}`;
  })
);

// 3) File: uncolored JSON, PKT timestamp
const fileFormat = combine(
  uncolorize(),
  timestamp({ format: pakistanTime }),
  json()
);

const logger = createLogger({
  level: "info",
  transports: [
    // Console transport:
    new transports.Console({ format: consoleFormat }),

    // File transport:
    new transports.File({
      filename: "app.log",
      format: fileFormat,
    }),
  ],
});

export default logger;
