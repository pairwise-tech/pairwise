import { partitionChallengesBySection } from "tools/utils";
import { ChallengeSkeleton, ChallengeSkeletonList } from "@pairwise/common";

describe("test utils.ts functions", () => {
  test("partitionChallengesBySection", () => {
    const challenge: ChallengeSkeleton = {
      id: "ny51KoEI",
      type: "markup",
      title: "Style some text",
      userCanAccess: true,
    };

    const section: ChallengeSkeleton = {
      id: "ny51KoEI",
      type: "section",
      title: "Data Structures",
      userCanAccess: true,
    };

    const project: ChallengeSkeleton = {
      id: "ny51KoEI",
      type: "project",
      title: "Build a game",
      userCanAccess: true,
    };

    const guidedProject: ChallengeSkeleton = {
      id: "ny51KoEI",
      type: "guided-project",
      title: "Guided build a game",
      userCanAccess: true,
    };

    const specialTopic: ChallengeSkeleton = {
      id: "ny51KoEI",
      type: "special-topic",
      title: "Learn about TypeScript",
      userCanAccess: true,
    };

    const repeatChallenges = (c: ChallengeSkeleton) => {
      const list = new Array(10);
      list.fill(c);
      return list;
    };

    const challenges = repeatChallenges(challenge);
    const specialTopics = repeatChallenges(specialTopic);

    const challengeList: ChallengeSkeletonList = [
      ...challenges,
      section,
      ...challenges,
      section,
      ...challenges,
      section,
      project,
      project,
      project,
      guidedProject,
      section,
      ...specialTopics,
    ];

    const result = partitionChallengesBySection(challengeList);
    expect(result).toMatchSnapshot();
  });
});
