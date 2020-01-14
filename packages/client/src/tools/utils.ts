import { compose } from "redux";
import {
  Challenge,
  assertUnreachable,
  CodeChallengeBlob,
  VideoChallengeBlob,
} from "@pairwise/common";

/** ===========================================================================
 * Common utility functions
 * ============================================================================
 */

/**
 * Artificially wait the provided amount of time.
 */
export const wait = async (time: number = 1000) => {
  await new Promise((_: any) => setTimeout(_, time));
};

/**
 * A compose function which passes only props information for better
 * type-checking.
 */
export const composeWithProps = <T extends {}>(
  ...fns: any
): ((component: any) => (props: T) => any) => {
  return compose(...fns);
};

/**
 * Given a challenge and other relevant data, construct the
 * data blob to represent the user's progress on that challenge
 * object.
 */
export const constructDataBlobFromChallenge = (args: {
  code: string;
  challenge: Challenge;
}) => {
  const { code, challenge } = args;

  switch (challenge.type) {
    case "react":
    case "typescript":
    case "markup": {
      const blob: CodeChallengeBlob = {
        code,
        type: "challenge",
      };
      return blob;
    }
    case "media": {
      const blob: VideoChallengeBlob = {
        type: "video",
        timeLastWatched: 0,
      };
      return blob;
    }
    default: {
      assertUnreachable(challenge.type);
    }
  }
};
