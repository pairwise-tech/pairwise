import axios from "axios";
import querystring from "querystring";
import request from "supertest";
import {
  AdminPurchaseCourseDto,
  Challenge,
  ContentUtility,
  Course,
  createInverseChallengeMapping,
  IUserDto,
} from "@pairwise/common";
import ENV from "./e2e-env";
import faker from "faker";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const course: Course = ContentUtility.getCourseContent("fpvPtfu7s", "PAID");
const challengeIdList = Object.values(createInverseChallengeMapping([course]));

const getText = (count = 15) => faker.lorem.words(count);

// Randomly return true of false, tend to return true
export const yesOrNo = () => Math.random() < 0.8;

export const wait = async (time = 1000) => {
  await new Promise((resolve, reject) => setTimeout(resolve, time));
};

const getHeaders = (token: string) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/** ===========================================================================
 * e2e Auth Utils
 * ============================================================================
 */

/**
 * Parse the accessToken after successful authentication.
 */
export const getAccessTokenFromRedirect = (redirect: string) => {
  const indexOfQuestionMark = redirect.indexOf("?");
  const queryParams = redirect.slice(indexOfQuestionMark + 1);
  const params = querystring.parse(queryParams);
  return params.accessToken;
};

/**
 * Create a new user and return the accessToken to use for authentication in
 * other tests.
 */
export const fetchAccessToken = async () => {
  const { accessToken } = await createAuthenticatedUser("github");
  return accessToken;
};

/**
 * The Google auth mock server uses an Admin email:
 */
export const fetchAdminAccessToken = async () => {
  const { accessToken } = await createAuthenticatedUser("google");
  return accessToken;
};

/**
 * Helper to fetch a user given an accessToken.
 */
export const fetchUserWithAccessToken = async (accessToken: string) => {
  const result = await axios.get<IUserDto>(`${ENV.HOST}/user/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const user = result.data;
  return user;
};

/**
 * A helper method to authenticate a new user with an SSO provider and return
 * relevant data on the newly created user to use for other tests.
 */
export const createAuthenticatedUser = async (
  provider: "facebook" | "github" | "google",
) => {
  let authorizationRedirect;
  let loginRedirect;
  let finalRedirect;
  let accessToken;

  await request(`${ENV.HOST}/auth/${provider}`)
    .get("/")
    .expect(302)
    .then((response) => {
      authorizationRedirect = response.header.location;
    });

  await request(authorizationRedirect)
    .get("/")
    .expect(302)
    .then((response) => {
      loginRedirect = response.header.location;
    });

  await request(loginRedirect)
    .get("/")
    .expect(302)
    .then((response) => {
      finalRedirect = response.header.location;
      accessToken = getAccessTokenFromRedirect(response.header.location);
    });

  const result = await axios.get(`${ENV.HOST}/user/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const user = result.data;

  return {
    authorizationRedirect,
    loginRedirect,
    finalRedirect,
    accessToken,
    user,
  };
};

/** ===========================================================================
 * e2e Seed Utils
 * ----------------------------------------------------------------------------
 * These utils will hit the server APIs to create a ton of fake user data.
 * ============================================================================
 */

/**
 * Purchase course by admin.
 */
export const purchaseCourseByAdmin = async (
  email: string,
  courseId: string,
) => {
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
export const postFeedback = async (token: string, challengeId: string) => {
  const body = {
    challengeId,
    type: "TOO_HARD",
    feedback: getText(),
  };

  await axios.post(`${ENV.HOST}/feedback`, body, getHeaders(token));
};

/**
 * Get recent progress updates
 */
export const fetchRecentProgressUpdates = async (token: string) => {
  return axios.get(`${ENV.HOST}/progress/recent`, getHeaders(token));
};

/**
 * Fetch user leaderboard rankings.
 */
export const fetchLeaderboardRankings = async (token: string) => {
  return axios.get(`${ENV.HOST}/user/leaderboard`, getHeaders(token));
};

/**
 * Update user challenge progress.
 */
export const updateProgressForChallenge = async (
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

  await axios.post(`${ENV.HOST}/progress`, body, getHeaders(token));
};

/**
 * Save a code blob for a challenge.
 */
export const saveBlobForChallenge = async (
  token: string,
  challenge: Challenge,
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

    console.log(`- Solving challenge id: ${id}`);
    await axios.post(`${ENV.HOST}/blob`, body, getHeaders(token));
  }
};

/**
 * Helper util to create a user and solve a challenge.
 */
export const createUserAndSolveChallenge = async () => {
  const result = await createAuthenticatedUser("github");
  const token = result.accessToken;

  const { challenge } = challengeIdList.find(
    (x) => x.challenge.solutionCode !== "",
  );

  await saveBlobForChallenge(token, challenge);
  return challenge;
};

/**
 * Helper util to create a user and solve a challenge.
 */
export const createUserAndUpdateProgress = async () => {
  const result = await createAuthenticatedUser("github");
  const token = result.accessToken;

  // Get some challenge
  const { challenge } = challengeIdList.find(
    (x) => x.challenge.id === "yI82pwBw",
  );

  await updateProgressForChallenge(token, challenge.id, course.id);
  return challenge;
};
