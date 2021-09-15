import {
  createAuthenticatedUser,
  postFeedback,
  purchaseCourseByAdmin,
  saveBlobForChallenge,
  updateProgressForChallenge,
  yesOrNo,
} from "./e2e-utils";
import ENV from "./e2e-env";
import {
  Course,
  ContentUtility,
  createInverseChallengeMapping,
} from "@pairwise/common";

const course: Course = ContentUtility.getCourseContent("fpvPtfu7s", "PAID");
const challengeIdList = Object.values(createInverseChallengeMapping([course]));

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

        console.log(`- Solving challenge id: ${challenge.id}`);
        await saveBlobForChallenge(token, challenge);

        console.log(`- Updating progress for challenge id: ${challenge.id}`);
        await updateProgressForChallenge(token, challenge.id, courseId);

        console.log(`- Posting feedback for challenge id: ${challenge.id}`);
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
