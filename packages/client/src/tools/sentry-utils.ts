import * as Sentry from "@sentry/browser";

// Report an exception to Sentry
export const captureSentryException = (error: any) => {
  // Note: Sentry is disabled.
  // Sentry.captureException(error);
};

// Report a specific message to Sentry
// This is probably not as useful as reporting an error directly but it
// could but useful to report specific messages if we need to do that.
export const captureSentryMessage = (message: string) => {
  // Note: Sentry is disabled.
  // Sentry.captureMessage(message);
};
