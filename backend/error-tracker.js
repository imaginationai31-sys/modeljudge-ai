const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");

const ERROR_DIR = path.join(__dirname, "..", "logs");
const ERROR_FILE = path.join(ERROR_DIR, "errors.jsonl");

function serializeError(error) {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return { message: String(error) };
}

function captureException(error, context = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    error: serializeError(error),
    context
  };
  try {
    fs.mkdirSync(ERROR_DIR, { recursive: true });
    fs.appendFileSync(ERROR_FILE, `${JSON.stringify(event)}\n`, "utf8");
  } catch (writeError) {
    logger.error("error_tracking_write_failed", { error: writeError.message });
  }
  logger.error("exception_captured", { ...context, error: event.error });
  return event;
}

function installProcessHandlers() {
  process.on("uncaughtException", error => {
    captureException(error, { source: "uncaughtException" });
    process.exitCode = 1;
  });
  process.on("unhandledRejection", reason => {
    captureException(reason, { source: "unhandledRejection" });
  });
}

module.exports = { captureException, installProcessHandlers, ERROR_FILE };
