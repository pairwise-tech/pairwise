import * as Sentry from "@sentry/node";
import { slackService } from "../slack/slack.service";

// Report an exception to Sentry and log it for debugging purposes.
export const captureSentryException = (e: Error | string) => {
  const error = typeof e === "string" ? new Error(e) : e;

  // Since the full error is reported to Sentry reduce log clutter
  // by only reporting the error message here:
  console.error(`[SENTRY ERROR]: Capturing Sentry Error: ${error.message}`);

  // Post to Slack manually, until upgrading Sentry plan
  slackService.postSentryError(`\`[SENTRY ERROR]:\` ${error.message}`);

  // Send full error to Sentry
  Sentry.captureException(error);
};
