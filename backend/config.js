const ENV_KEYS = Object.freeze([
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "DATABASE_SSL",
  "DATABASE_POOL_MAX",
  "GOLD_TASKS_FILE",
  "CORS_ORIGIN",
  "ADMIN_BOOTSTRAP_TOKEN",
  "REVIEWER_MIN_CALIBRATION_ATTEMPTS",
  "REVIEWER_PASS_CALIBRATION_ACCURACY",
  "REVIEWER_WARNING_CALIBRATION_ACCURACY",
  "REVIEWER_WARNING_SCORE",
  "REVIEWER_SUSPENSION_SCORE",
  "REVIEWER_MAX_CONSECUTIVE_FAILURES",
  "SECURITY_RATE_WINDOW_MS",
  "SECURITY_RATE_MAX_REQUESTS",
  "DATASET_VERSION",
  "PIPELINE_RELEASE_VERSION"
]);

function number(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function getConfig() {
  return Object.freeze({
    nodeEnv: process.env.NODE_ENV || "development",
    port: number("PORT", 8787),
    databaseUrl: process.env.DATABASE_URL || "",
    databaseSsl: process.env.DATABASE_SSL !== "false",
    databasePoolMax: number("DATABASE_POOL_MAX", 10),
    goldTasksFile: process.env.GOLD_TASKS_FILE || "",
    corsOrigin: process.env.CORS_ORIGIN || "*",
    adminBootstrapToken: process.env.ADMIN_BOOTSTRAP_TOKEN || "",
    reviewerMinCalibrationAttempts: number("REVIEWER_MIN_CALIBRATION_ATTEMPTS", 3),
    reviewerPassCalibrationAccuracy: number("REVIEWER_PASS_CALIBRATION_ACCURACY", 0.8),
    reviewerWarningCalibrationAccuracy: number("REVIEWER_WARNING_CALIBRATION_ACCURACY", 0.7),
    reviewerWarningScore: number("REVIEWER_WARNING_SCORE", 3),
    reviewerSuspensionScore: number("REVIEWER_SUSPENSION_SCORE", 2),
    reviewerMaxConsecutiveFailures: number("REVIEWER_MAX_CONSECUTIVE_FAILURES", 3),
    securityRateWindowMs: number("SECURITY_RATE_WINDOW_MS", 60_000),
    securityRateMaxRequests: number("SECURITY_RATE_MAX_REQUESTS", 120),
    datasetVersion: process.env.DATASET_VERSION || "1.0.0",
    pipelineReleaseVersion: process.env.PIPELINE_RELEASE_VERSION || ""
  });
}

module.exports = { ENV_KEYS, getConfig };
