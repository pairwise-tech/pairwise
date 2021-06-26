import { createAuthenticatedUser } from "./utils/e2e-utils";

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
});

/**
 * Perform basic assertions on newly created user.
 */
const checkUser = (user: any) => {
  const { profile, payments } = user;
  expect(profile.email).toBeDefined();
  expect(profile.displayName).toBeDefined();
  expect(profile.givenName).toBeDefined();
  expect(profile.familyName).toBeDefined();
  expect(Array.isArray(payments)).toBeTruthy();
};
