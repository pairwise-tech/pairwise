// Import Workers:
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import CodeFormatWorker from "workerize-loader!./prettier-code-formatter";

import { CHALLENGE_TYPE } from "@pairwise/common";

/** ===========================================================================
 * Types
 * ============================================================================
 */

export interface TestCase {
  test: string;
  message: string;
  testResult: boolean;
  error?: string;
}

export interface CodeFormatMessage {
  code: string;
  type: CHALLENGE_TYPE;
  channel: string;
}

export interface CodeFormatMessageEvent extends MessageEvent {
  data: CodeFormatMessage;
}

// NOTE: Instantiating the worker right here at the top level feels off. Could
// potentially cause build issues if we get too tricky with our build, but for
// now this should be fine
const codeWorker = new CodeFormatWorker();

export const requestCodeFormatting = (message: CodeFormatMessage) => {
  codeWorker.postMessage(message);
};

export const subscribeCodeWorker = (fn: (e: CodeFormatMessageEvent) => any) => {
  codeWorker.addEventListener("message", fn);
};

export const unsubscribeCodeWorker = (
  fn: (e: CodeFormatMessageEvent) => any,
) => {
  codeWorker.removeEventListener("message", fn);
};
