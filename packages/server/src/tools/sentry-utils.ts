import * as Sentry from "@sentry/node";

// Log error information for debugging, without reporting to Sentry.
export const logErrorMessage = (message, error) => {
  console.error(`[ERROR]: ${message}: `, error);
};

// Report an exception to Sentry and log it for debugging purposes.
export const captureSentryException = (error: any) => {
  logErrorMessage("Capturing Sentry Error: ", error);
  Sentry.captureException(error);
};
