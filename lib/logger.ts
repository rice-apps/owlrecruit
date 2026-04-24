import log from "loglevel";

log.setDefaultLevel(process.env.NODE_ENV === "production" ? "error" : "trace");

const logger = {
  trace: log.trace.bind(log),
  debug: log.debug.bind(log),
  info: log.info.bind(log),
  warn: log.warn.bind(log),
  error: log.error.bind(log),
};

export { logger };
