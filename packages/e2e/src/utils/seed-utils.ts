import axios from "axios";
import {
  Challenge,
  ContentUtility,
  Course,
  createInverseChallengeMapping,
} from "@pairwise/common";
import { createAuthenticatedUser, HOST } from "./e2e-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const course: Course = ContentUtility.getCourseContent("fpvPtfu7s", "PAID");
const challengeMap = Object.values(createInverseChallengeMapping([course]));

const getHeaders = (token: string) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const postFeedback = async (token: string) => {
  const body = {
    feedback: "hi",
    type: "TOO_HARD",
    challengeId: "0fCd6MkU",
  };
  await axios.post(`${HOST}/feedback`, body, getHeaders(token));
};

const updateProgressForChallenge = async (
  token: string,
  challengeId: string,
  courseId: string,
) => {
  const body = {
    complete: true,
    challengeId,
    courseId,
    timeCompleted: new Date(),
  };

  console.log(`- Updating progress for challenge id: ${challengeId}`);
  await axios.post(`${HOST}/progress`, body, getHeaders(token));
};

const solveChallenge = async (
  token: string,
  challenge: Challenge,
  courseId: string,
) => {
  const { id, solutionCode } = challenge;
  if (solutionCode) {
    const body = {
      challengeId: id,
      dataBlob: {
        type: "challenge",
        code: solutionCode,
      },
    };

    console.log(`- Solving challenge id: ${challenge.id}`);
    await axios.post(`${HOST}/blob`, body, getHeaders(token));
    await updateProgressForChallenge(token, id, courseId);
  }
};

const createUsers = async (count: number) => {
  console.log(`\n- Starting to create ${count} users...\n`);

  const accessTokens = [];

  let current = 0;
  while (current < count) {
    current++;
    const result = await createAuthenticatedUser("github");
    accessTokens.push(result.accessToken);
    console.log(`- User created, email: ${result.user.profile.email}`);
  }

  console.log(`\n- ${count} users created successfully.\n`);

  let solved = 0;
  let challengeIndex = 0;
  for (const token of accessTokens) {
    const limit = challengeIndex + 10;
    for (let index = challengeIndex; index < limit; index++) {
      challengeIndex++;
      const { challenge, courseId } = challengeMap[challengeIndex];
      if (challenge.solutionCode !== "") {
        await solveChallenge(token, challenge, courseId);
        solved++;
      }
    }
  }

  console.log(`\n Solved ${solved} challenges.\n`);
};

const main = async () => {
  console.log(`\n- Running seed script to populate database with mock data\n`);
  createUsers(50);
};

main();
