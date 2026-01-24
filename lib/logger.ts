import pino from "pino";

const isServer = typeof window === "undefined";
const isDev = process.env.NODE_ENV === "development";
const logLevel = process.env.LOG_LEVEL || "info";

const serverLogger = isServer
  ? pino({
      level: logLevel,
      redact: {
        paths: ["*.password", "*.token", "*.secret", "*.apiKey", "email", "*.email"],
        remove: false,
      },
      transport: isDev
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          }
        : undefined,
    })
  : null;

const levels: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = levels[logLevel] || levels.info;

function clientLog(level: "debug" | "info" | "warn" | "error", message: string, data?: object) {
  if (levels[level] < minLevel) return;
  if (!isDev && level !== "error") return;

  const consoleFn = { debug: console.debug, info: console.info, warn: console.warn, error: console.error }[level];

  if (data) {
    consoleFn(`[${level.toUpperCase()}] ${message}`, data);
  } else {
    consoleFn(`[${level.toUpperCase()}] ${message}`);
  }
}

export const logger = {
  debug: (message: string, data?: object) => {
    isServer && serverLogger ? serverLogger.debug(data ?? {}, message) : clientLog("debug", message, data);
  },
  info: (message: string, data?: object) => {
    isServer && serverLogger ? serverLogger.info(data ?? {}, message) : clientLog("info", message, data);
  },
  warn: (message: string, data?: object) => {
    isServer && serverLogger ? serverLogger.warn(data ?? {}, message) : clientLog("warn", message, data);
  },
  error: (message: string, data?: object) => {
    isServer && serverLogger ? serverLogger.error(data ?? {}, message) : clientLog("error", message, data);
  },
};

export default logger;
