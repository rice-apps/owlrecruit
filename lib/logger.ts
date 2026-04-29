/**
 * Server-only structured logger implementing the "Wide Events / Canonical Log Lines" pattern.
 *
 * Each API request should create one logger with `createRequestLogger`, accumulate structured
 * fields via `log.set(fields)`, then emit a single canonical JSON log line at the end via
 * `log.flush(status)`.
 *
 * Backed by pino. In development, pino-pretty formats output for readability.
 * In production, output is newline-delimited JSON.
 *
 * This module is server-only and must never be imported in client components.
 */
import "server-only";
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const pinoLogger = pino({
  level: isDev ? "trace" : "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: null,
  serializers: {
    err: pino.stdSerializers.err,
  },
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        ignore: "pid,hostname",
      },
    },
  }),
});

type LogFields = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Per-request canonical log line builder
// ---------------------------------------------------------------------------

interface RequestLogger {
  /** Merge additional fields into the pending canonical log line. */
  set(fields: LogFields): void;
  /**
   * Emit the final canonical log line with the given HTTP status code.
   * Should be called exactly once at the end of each request handler.
   */
  flush(status: number): void;
  /**
   * Immediately emit an error event (for unexpected caught exceptions).
   * Also sets `error` in the pending log line so flush() captures it too.
   */
  error(message: string, err?: unknown): void;
  /** Immediately emit a warning event. */
  warn(message: string, fields?: LogFields): void;
}

/**
 * Creates a per-request logger pre-seeded with route context.
 *
 * @example
 * export async function GET(req: Request, { params }) {
 *   const log = createRequestLogger({ method: "GET", path: "/api/openings" });
 *   // ... do work, call log.set({ user_id, org_id }) as you learn more ...
 *   log.flush(200);
 *   return NextResponse.json(data);
 * }
 */
export function createRequestLogger(context: LogFields): RequestLogger {
  const startMs = Date.now();
  let pending: LogFields = { ...context };

  return {
    set(fields: LogFields) {
      pending = { ...pending, ...fields };
    },

    flush(status: number) {
      const duration_ms = Date.now() - startMs;
      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
      pinoLogger[level]({ ...pending, status, duration_ms }, "request");
    },

    error(message: string, err?: unknown) {
      const duration_ms = Date.now() - startMs;
      const errorSummary =
        err instanceof Error
          ? err.message
          : err != null
            ? String(err)
            : message;
      pending = { ...pending, error: errorSummary };
      pinoLogger.error(
        { ...pending, ...(err instanceof Error && { err }), duration_ms },
        message,
      );
    },

    warn(message: string, fields?: LogFields) {
      const duration_ms = Date.now() - startMs;
      pinoLogger.warn({ ...pending, ...fields, duration_ms }, message);
    },
  };
}

export const logger = pinoLogger;
