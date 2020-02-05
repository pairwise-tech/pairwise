import shortid from "shortid";
import { compose } from "redux";
import {
  Module,
  Challenge,
  assertUnreachable,
  CodeChallengeBlob,
  VideoChallengeBlob,
  DataBlob,
  SandboxBlob,
  CHALLENGE_TYPE,
  ChallengeSkeleton,
  ChallengeSkeletonList,
} from "@pairwise/common";
import { SANDBOX_ID } from "./constants";
import { IconName } from "@blueprintjs/core";

/** ===========================================================================
 * Utils
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
 * data blob to represent the user's progress on that challenge.
 */
export const constructDataBlobFromChallenge = (args: {
  code: string;
  challenge: Challenge;
}): DataBlob => {
  const { code, challenge } = args;

  if (challenge.id === SANDBOX_ID) {
    const blob: SandboxBlob = {
      code,
      type: "sandbox",
      challengeType: "typescript" /* ? */,
    };
    return blob;
  }

  switch (challenge.type) {
    case "section":
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

export const generateEmptyModule = (): Module => ({
  id: shortid.generate(),
  title: "[EMTPY...]",
  challenges: [],
  free: false /* All challenges are locked by default */,
});

export const generateEmptyChallenge = (
  overwrite: Partial<Challenge> = {},
): Challenge => ({
  id: shortid.generate(),
  type: "markup",
  title: "[EMPTY...]",
  content: "",
  testCode: "// test('message', () => expect(...))",
  videoUrl: "",
  starterCode: "",
  solutionCode: "",
  supplementaryContent: "",
  ...overwrite,
});

export const defaultSandboxChallenge = generateEmptyChallenge({
  id: SANDBOX_ID, // Important. This is how the app knows it's the sandbox challenge
  title: "Sandbox",
  type: "markup",
});

export const defaultSandboxBlob = constructDataBlobFromChallenge({
  code: "",
  challenge: defaultSandboxChallenge,
});

/**
 * Get the appropriate icon from a challenge based on the challenge type.
 */
export const getChallengeIcon = (
  type: CHALLENGE_TYPE,
  userCanAccess: boolean,
): IconName => {
  if (!userCanAccess) {
    return "lock";
  }

  if (type === "section") {
    return "bookmark";
  } else if (type === "media") {
    return "book";
  } else {
    return "code";
  }
};

export interface NavigationChallengeSection {
  section: Nullable<ChallengeSkeleton>;
  challenges: ChallengeSkeleton[];
}

/**
 * Behold the following hideous code!
 *
 * Partition the challenges into blocks separate by section. This is
 * the greatest code ever written.
 */
export const partitionChallengesBySection = (
  challengeList: ChallengeSkeletonList,
) => {
  let sections: NavigationChallengeSection[] = [];
  const defaultSection: NavigationChallengeSection = {
    section: null,
    challenges: [],
  };

  const finalSection = challengeList.reduce(
    (
      currentSection: NavigationChallengeSection,
      challenge: ChallengeSkeleton,
    ) => {
      if (challenge.type === "section") {
        if (currentSection.challenges.length > 0) {
          sections = sections.concat(currentSection);
        }

        const nextSection: NavigationChallengeSection = {
          section: challenge,
          challenges: [],
        };
        return nextSection;
      } else {
        return {
          section: currentSection.section,
          challenges: currentSection.challenges.concat(challenge),
        };
      }
    },
    defaultSection,
  );

  sections = sections.concat(finalSection);

  return sections;
};
