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
  ProjectChallengeBlob,
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
      challengeType: challenge.type,
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
    case "guided-project":
    case "special-topic":
    case "media": {
      const blob: VideoChallengeBlob = {
        type: "video",
        timeLastWatched: 0,
      };
      return blob;
    }
    case "project": {
      const blob: ProjectChallengeBlob = {
        type: "project",
        url: "",
        repo: "",
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
 * Behold, the great challenge partitioning method!
 *
 * This method partitions a list of challenge into blocks of challenges by
 * section challenges which exist in the challenge list.
 *
 * It takes all challenges in a section, until the next section (or until
 * a non-challenge type is encountered) and groups them into a block. These
 * can then be rendered in a way that allow the sections to be separately
 * collapsed and expanded.
 *
 * The behavior may change in the future, especially around projects and
 * special topics.
 *
 * Sean is responsible for this!
 */
export const partitionChallengesBySection = (
  challengeList: ChallengeSkeletonList,
) => {
  const defaultSection: NavigationChallengeSection = {
    section: null,
    challenges: [],
  };

  let currentSection = defaultSection;
  let firstReachedProjects = false;
  let firstReachedSpecialTopics = false;
  let sections: NavigationChallengeSection[] = [];

  for (const challenge of challengeList) {
    const { type } = challenge;

    const SHOULD_END_SECTION = type === "section";
    const reachedProjectsNow = type === "project" || type === "guided-project";
    const reachedSpecialTopics = type === "special-topic";

    const PROJECT_BOUNDARY = reachedProjectsNow && !firstReachedProjects;
    const SPECIAL_TOPIC_BOUNDARY =
      reachedSpecialTopics && !firstReachedSpecialTopics;

    if (SPECIAL_TOPIC_BOUNDARY) {
      if (currentSection.challenges.length > 0) {
        sections = sections.concat(currentSection);
      }
      const nextSection: NavigationChallengeSection = {
        section: null,
        challenges: [challenge],
      };
      firstReachedSpecialTopics = true;
      currentSection = nextSection;
    } else if (PROJECT_BOUNDARY) {
      if (currentSection.challenges.length > 0) {
        sections = sections.concat(currentSection);
      }
      const nextSection: NavigationChallengeSection = {
        section: null,
        challenges: [challenge],
      };
      firstReachedProjects = true;
      currentSection = nextSection;
    } else if (SHOULD_END_SECTION) {
      if (currentSection.challenges.length > 0) {
        sections = sections.concat(currentSection);
      }

      const nextSection: NavigationChallengeSection = {
        section: challenge,
        challenges: [],
      };
      currentSection = nextSection;
    } else {
      currentSection = {
        section: currentSection.section,
        challenges: currentSection.challenges.concat(challenge),
      };
    }
  }

  /* Add whatever last challenges remain and were not aggregated yet */
  sections = sections.concat(currentSection);

  return sections;
};
