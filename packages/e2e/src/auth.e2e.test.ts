import request from "supertest";
import ENV from "./utils/e2e-env";
import { createAuthenticatedUser, fetchAccessToken } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /auth APIs
 * ============================================================================
 */

describe("Auth APIs", () => {
  test("/auth/facebook (GET) - valid", async (done) => {
    const { user, loginRedirect, finalRedirect, authorizationRedirect } =
      await createAuthenticatedUser("facebook");

    expect(
      authorizationRedirect.includes("response_type=code&redirect_uri="),
    ).toBeTruthy();
    expect(loginRedirect.includes("auth/facebook/callback?code=")).toBeTruthy();
    expect(finalRedirect.includes("?accessToken=")).toBeTruthy();
    checkUser(user);

    done();
  });

  test("/auth/github (GET) - valid", async (done) => {
    const { user, loginRedirect, finalRedirect, authorizationRedirect } =
      await createAuthenticatedUser("github");

    expect(
      authorizationRedirect.includes("response_type=code&redirect_uri="),
    ).toBeTruthy();
    expect(loginRedirect.includes("auth/github/callback?code=")).toBeTruthy();
    expect(finalRedirect.includes("?accessToken=")).toBeTruthy();
    checkUser(user);

    done();
  });

  test("/auth/google (GET) - valid", async (done) => {
    const { user, loginRedirect, finalRedirect, authorizationRedirect } =
      await createAuthenticatedUser("google");

    expect(
      authorizationRedirect.includes("response_type=code&redirect_uri="),
    ).toBeTruthy();
    expect(loginRedirect.includes("auth/google/callback?code=")).toBeTruthy();
    expect(finalRedirect.includes("?accessToken=")).toBeTruthy();
    checkUser(user);

    done();
  });

  test("/auth/logout (GET) - works", async (done) => {
    const accessToken = await fetchAccessToken();
    const authorizationHeader = `Bearer ${accessToken}`;

    request(`${ENV.HOST}/auth/logout`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(200)
      .end((error, response) => {
        expect(response.text).toBe("Success");
        done();
      });

    /**
     * Would only work if the backend has a way of invalidating jwt tokens.
     * This is not implemented at present because it would require additional
     * persistent storage, i.e. a blacklist of logged out tokens.
     */
    // request(`${HOST}/user/profile`)
    //   .get("/")
    //   .set("Authorization", authorizationHeader)
    //   .expect(401)
    //   .end((error, response) => {
    //     expect(response.body.message).toBe("Unauthorized");
    //     done(error);
    //   });
  });
});

/**
 * Perform basic assertions on newly created user.
 */
const checkUser = (user: any) => {
  const { profile, payments } = user;
  expect(profile.email).toBeDefined();
  expect(profile.username).toBeDefined();
  expect(profile.givenName).toBeDefined();
  expect(profile.familyName).toBeDefined();
  expect(Array.isArray(payments)).toBeTruthy();
};
