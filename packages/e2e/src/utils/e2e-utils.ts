import axios from "axios";
import querystring from "querystring";
import request from "supertest";

/** ===========================================================================
 * e2e Test Utils
 * ============================================================================
 */

const HOST = process.env.HOST || "http://localhost:9000";

const HARD_CODED_FB_ACCESS_TOKEN =
  "EAAGVjNBRNAQBAOuGymWeupll003o2XTnbf2uQReFCE4rdYB3HNSkfJt0uOrNMGZAIWEkIobmb1CNZBabpz94TI0kIca656YaKy5JmJwt0tYZAm8BoSGZCRYu6cyOWntl0xCh4v7NxkGmnkf8xpk3gmkWIyRLMggyxJQMjtbfoKZAdEcRwfptLLaPZC1KZB3ZCxULaFxt5R3JLQZDZD";

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
const fetchAccessToken = async () => {
  let authorizationRedirect;
  let loginRedirect;
  let accessToken;

  await request(`${HOST}/auth/github`)
    .get("/")
    .expect(302)
    .then(response => {
      authorizationRedirect = response.header.location;
    });

  await request(authorizationRedirect)
    .get("/")
    .expect(302)
    .then(response => {
      loginRedirect = response.header.location;
    });

  await request(loginRedirect)
    .get("/")
    .expect(302)
    .then(response => {
      accessToken = getAccessTokenFromRedirect(response.header.location);
    });

  return accessToken;
};

/**
 * Helper to fetch a user given an accessToken.
 */
export const fetchUserGivenAccessToken = async (accessToken: string) => {
  const result = await axios.get(`${HOST}/user/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return result.data;
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { HOST, HARD_CODED_FB_ACCESS_TOKEN, fetchAccessToken };
