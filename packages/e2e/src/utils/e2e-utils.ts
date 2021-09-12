import axios from "axios";
import querystring from "querystring";
import request from "supertest";
import { IUserDto } from "@pairwise/common";
import ENV from "./e2e-env";

/** ===========================================================================
 * e2e Test Utils
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
