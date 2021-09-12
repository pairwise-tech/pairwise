import axios from "axios";
import faker from "faker";
import {
  AdminPurchaseCourseDto,
  Challenge,
  ContentUtility,
  Course,
  createInverseChallengeMapping,
} from "@pairwise/common";
import { createAuthenticatedUser, fetchAdminAccessToken } from "./e2e-utils";
import ENV from "./e2e-env";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const course: Course = ContentUtility.getCourseContent("fpvPtfu7s", "PAID");
const challengeIdList = Object.values(createInverseChallengeMapping([course]));

const getText = (count = 15) => faker.lorem.words(count);

// Randomly return true of false, tend to return true
const yesOrNo = () => Math.random() < 0.8;

const getHeaders = (token: string) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/** ===========================================================================
 * e2e Seed Utils
 * ----------------------------------------------------------------------------
 * These utils will hit the server APIs to create a ton of fake user data.
 * ============================================================================
 */

/**
 *
 */
const purchaseCourseByAdmin = async (email: string, courseId: string) => {
  const token = await fetchAdminAccessToken();
  const plan = yesOrNo ? "REGULAR" : "PREMIUM";
  const body: AdminPurchaseCourseDto = {
    plan,
    courseId,
    userEmail: email,
  };

  console.log(`- Purchasing ${plan} course for user: ${email}`);
  await axios.post(
    `${ENV.HOST}/admin/purchase-course`,
    body,
    getHeaders(token),
  );
};

/**
 * Post feedback for a challenge.
 */
const postFeedback = async (token: string, challengeId: string) => {
  const body = {
    challengeId,
    type: "TOO_HARD",
    feedback: getText(),
  };
  console.log(`- Posting feedback for challenge id: ${challengeId}`);
  await axios.post(`${ENV.HOST}/feedback`, body, getHeaders(token));
};

/**
 * Update user challenge progress.
 */
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
  await axios.post(`${ENV.HOST}/progress`, body, getHeaders(token));
};

/**
 * Save a code blob for a challenge.
 */
const saveBlobForChallenge = async (token: string, challenge: Challenge) => {
  const { id, solutionCode } = challenge;
  if (solutionCode) {
    const body = {
      challengeId: id,
      dataBlob: {
        type: "challenge",
        code: solutionCode,
      },
    };

    console.log(`- Solving challenge id: ${id}`);
    await axios.post(`${ENV.HOST}/blob`, body, getHeaders(token));
  }
};

/**
 * Handle creating users and solve a series of challenges for each
 * user created.
 */
const createUsers = async (count: number) => {
  console.log(`\n- Starting to create ${count} users...\n`);

  const userRecords: Array<{ email: string; token: string }> = [];

  let current = 0;
  while (current < count) {
    current++;
    const result = await createAuthenticatedUser("github");
    userRecords.push({
      token: result.accessToken,
      email: result.user.profile.email,
    });
    console.log(`- User created, email: ${result.user.profile.email}`);
  }

  console.log(`\n- ${count} users created successfully.`);

  let solved = 0;
  let challengeIndex = 0;
  for (const record of userRecords) {
    const { email, token } = record;
    const limit = challengeIndex + ENV.USER_CHALLENGE_COUNT;
    for (let index = challengeIndex; index < limit; index++) {
      challengeIndex++;

      const { challenge, courseId } = challengeIdList[challengeIndex];
      if (challenge.solutionCode !== "") {
        // Handle additional actions for each user
        console.log("");
        await saveBlobForChallenge(token, challenge);
        await updateProgressForChallenge(token, challenge.id, courseId);
        await postFeedback(token, challenge.id);

        solved++;
      }

      // Reset to start if we reach the end, and cancel the current loop
      if (challengeIndex === challengeIdList.length - 1) {
        challengeIndex = 0;
        break;
      }
    }

    const shouldPurchaseCourse = yesOrNo();
    if (shouldPurchaseCourse) {
      await purchaseCourseByAdmin(email, course.id);
    }
  }

  console.log(`\n- Solved ${solved} challenges for ${count} users.\n`);
};

const seed = async () => {
  console.log(`\n- Running seed script to populate database with mock data\n`);
  createUsers(ENV.USER_COUNT);
};

seed();
