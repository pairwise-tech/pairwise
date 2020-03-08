import * as Sentry from "@sentry/node";

// Report an exception to Sentry
export const captureSentryException = (error: any) => {
  Sentry.captureException(error);
};
