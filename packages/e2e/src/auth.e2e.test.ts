import axios from "axios";
import request from "supertest";
import { HOST, HARD_CODED_FB_ACCESS_TOKEN } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /auth APIs
 * ============================================================================
 */

describe("Auth APIs", () => {
  test("/auth/facebook (GET) - valid", async done => {
    let authorizationRedirect;
    let loginRedirect;
    let finalRedirect;
    let accessToken;

    await request(`${HOST}/auth/facebook`)
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
        finalRedirect = response.header.location;

        const match = "?accessToken=";
        const index = finalRedirect.indexOf(match);
        accessToken = finalRedirect.slice(index + match.length);
      });

    const result = await axios.get(`${HOST}/user/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(
      authorizationRedirect.includes("response_type=code&redirect_uri="),
    ).toBeTruthy();
    expect(loginRedirect.includes("auth/facebook/callback?code=")).toBeTruthy();
    expect(finalRedirect.includes("?accessToken=")).toBeTruthy();

    const { profile, payments } = result.data;
    expect(profile.email).toBeDefined();
    expect(profile.displayName).toBeDefined();
    expect(profile.givenName).toBeDefined();
    expect(profile.familyName).toBeDefined();
    expect(Array.isArray(payments)).toBeTruthy();

    done();
  });

  test("/auth/github (GET) - valid", async done => {
    let authorizationRedirect;
    let loginRedirect;
    let finalRedirect;
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
        finalRedirect = response.header.location;

        const match = "?accessToken=";
        const index = finalRedirect.indexOf(match);
        accessToken = finalRedirect.slice(index + match.length);
      });

    const result = await axios.get(`${HOST}/user/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(
      authorizationRedirect.includes("response_type=code&redirect_uri="),
    ).toBeTruthy();
    expect(loginRedirect.includes("auth/github/callback?code=")).toBeTruthy();
    expect(finalRedirect.includes("?accessToken=")).toBeTruthy();

    const { profile, payments } = result.data;
    expect(profile.email).toBeDefined();
    expect(profile.displayName).toBeDefined();
    expect(profile.givenName).toBeDefined();
    expect(profile.familyName).toBeDefined();
    expect(Array.isArray(payments)).toBeTruthy();

    done();
  });

  test("/auth/google (GET) - valid", async done => {
    let authorizationRedirect;
    let loginRedirect;
    let finalRedirect;
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
        finalRedirect = response.header.location;

        const match = "?accessToken=";
        const index = finalRedirect.indexOf(match);
        accessToken = finalRedirect.slice(index + match.length);
      });

    const result = await axios.get(`${HOST}/user/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(
      authorizationRedirect.includes("response_type=code&redirect_uri="),
    ).toBeTruthy();
    expect(loginRedirect.includes("auth/google/callback?code=")).toBeTruthy();
    expect(finalRedirect.includes("?accessToken=")).toBeTruthy();

    const { profile, payments } = result.data;
    expect(profile.email).toBeDefined();
    expect(profile.displayName).toBeDefined();
    expect(profile.givenName).toBeDefined();
    expect(profile.familyName).toBeDefined();
    expect(Array.isArray(payments)).toBeTruthy();

    done();
  });
});
