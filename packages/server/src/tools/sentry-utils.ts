import * as Sentry from "@sentry/node";

// Report an exception to Sentry and log it for debugging purposes.
export const captureSentryException = (e: Error | string) => {
  const error = typeof e === "string" ? new Error(e) : e;

  // Since the full error is reported to Sentry reduce log clutter
  // by only reporting the error message here:
  console.error(`[SENTRY ERROR]: Capturing Sentry Error: ${error.message}`);

  // Send full error to Sentry
  Sentry.captureException(error);
};
