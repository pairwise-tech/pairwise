import axios from "axios";
import request from "supertest";

/** ===========================================================================
 * e2e Test Utils
 * ============================================================================
 */

const HOST = process.env.HOST || "http://localhost:9000";

const HARD_CODED_FB_ACCESS_TOKEN =
  "EAAGVjNBRNAQBAOuGymWeupll003o2XTnbf2uQReFCE4rdYB3HNSkfJt0uOrNMGZAIWEkIobmb1CNZBabpz94TI0kIca656YaKy5JmJwt0tYZAm8BoSGZCRYu6cyOWntl0xCh4v7NxkGmnkf8xpk3gmkWIyRLMggyxJQMjtbfoKZAdEcRwfptLLaPZC1KZB3ZCxULaFxt5R3JLQZDZD";

const fetchAccessToken = async () => {
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

  return accessToken;
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { HOST, HARD_CODED_FB_ACCESS_TOKEN, fetchAccessToken };
