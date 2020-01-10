import axios from "axios";
import querystring from "querystring";
import request from "supertest";

/** ===========================================================================
 * e2e Test Utils
 * ============================================================================
 */

export const HOST = process.env.HOST || "http://localhost:9000";

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
 * The Google auth mock server uses an Admin email:
 */
export const fetchAdminAccessToken = async () => {
  let authorizationRedirect;
  let loginRedirect;
  let accessToken;

  await request(`${HOST}/auth/google`)
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
