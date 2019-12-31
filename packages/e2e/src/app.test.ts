import axios from "axios";
import request from "supertest";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const HOST = process.env.HOST || "http://localhost:9000";

const HARD_CODED_FB_ACCESS_TOKEN =
  "EAAGVjNBRNAQBANZAADnztFVVC3Qi0KQst6gxPTbxVWbLcf0cx7Sih0pwn7elK69NVvZAfJYOX8fgA5eurgEijXXqjcLOmTZCCMTgH1jrmlZA67HaymQ1uvsbJnM73aXZAUGPltYkwdoDJAXpi84HjVixwT4EMRCHIfjAnZCsWJJCY6LpFT62PIZCNvlg7YWaSQyq6ombABjoAZDZD";

const fetchAccessToken = async () => {
  const result = await axios.get(
    `${HOST}/auth/facebook?access_token=${HARD_CODED_FB_ACCESS_TOKEN}`,
  );
  const { accessToken } = result.data;
  return accessToken;
};

// @ts-ignore
jest.setTimeout(30000); /* Fuck the internet at Starbucks! */

/** ===========================================================================
 * Tests
 * ============================================================================
 */

describe.skip("AppController (e2e)", () => {
  test("/ (GET)", () => {
    return request(HOST)
      .get("/")
      .expect(200)
      .expect("Hello World!");
  });
});

describe.skip("User and Auth APIs", () => {
  test("/auth/facebook (GET) - invalid", () => {
    return request(`${HOST}/auth/facebook`)
      .get("/")
      .expect(401);
  });

  test("/auth/facebook (GET) - valid", () => {
    return request(
      `${HOST}/auth/facebook?access_token=${HARD_CODED_FB_ACCESS_TOKEN}`,
    )
      .get("/")
      .expect(200)
      .expect(response => {
        expect(response.body.accessToken).toBeDefined();
      });
  });

  test("/user/profile (GET)", async () => {
    const accessToken = await fetchAccessToken();
    const result = await axios.get(`${HOST}/user/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(result.data).toEqual({
      uuid: "6e7a1ac2-b3b9-4d3c-b329-747b39855646",
      email: "sean.smith.2009@gmail.com",
      displayName: "Sean Smith",
      givenName: "Sean",
      familyName: "Smith",
    });
  });
});

describe("Challenge APIs", () => {
  let accessToken;
  let authorizationHeader;

  beforeAll(async () => {
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
  });

  test("/progress (POST) should require authentication", async done => {
    request(`${HOST}/progress`)
      .post("/")
      .send({
        passed: true,
        challengeId: "abc",
        courseId: "def",
      })
      .set("Authorization", "Bearer asd97f8809as7fsa")
      .expect(401)
      .end((error, response) => {
        expect(response.body.error).toBe("Unauthorized");
        done(error);
      });
  });

  test("/progress (POST) rejects invalid courseIds", async done => {
    request(`${HOST}/progress`)
      .post("/")
      .send({
        passed: true,
        challengeId: "abc",
        courseId: "def",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The courseId is invalid");
        done(error);
      });
  });

  test("/progress (POST) rejects invalid challengeIds", async done => {
    request(`${HOST}/progress`)
      .post("/")
      .send({
        passed: true,
        challengeId: "abc",
        courseId: "fpvPtfu7s",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The challengeId is invalid");
        done(error);
      });
  });

  test("/progress (POST) requires a valid input object", async done => {
    request(`${HOST}/progress`)
      .post("/")
      .send({
        passed: "hi",
        challengeId: "5ziJI35f",
        courseId: "fpvPtfu7s",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.error).toBe("Bad Request");
        done(error);
      });
  });

  test("/progress (POST) handles valid insertions correctly", async done => {
    const updateProgressItem = async (progress: any) => {
      return axios.post(`${HOST}/progress`, progress, {
        headers: {
          Authorization: authorizationHeader,
        },
      });
    };

    await updateProgressItem({
      passed: false,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
    });

    await updateProgressItem({
      passed: true,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
    });

    await updateProgressItem({
      passed: true,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
    });

    await updateProgressItem({
      passed: true,
      challengeId: "50fxTLRcV",
      courseId: "fpvPtfu7s",
    });

    await updateProgressItem({
      passed: true,
      challengeId: "WUA8ezECU",
      courseId: "fpvPtfu7s",
    });

    request(`${HOST}/progress`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(200)
      .end((error, response) => {
        expect(Array.isArray(response.body)).toBeTruthy();
        const entry = response.body.pop();
        expect(entry.uuid).toBeDefined();
        expect(entry.courseId).toBeDefined();

        const expected = {
          ["5ziJI35f"]: { passed: true },
          ["WUA8ezECU"]: { passed: true },
          ["50fxTLRcV"]: { passed: true },
        };

        expect(JSON.parse(entry.progress)).toEqual(expected);
        done(error);
      });
  });

  test("/challenges (GET)", () => {
    return request(`${HOST}/challenges`)
      .get("/")
      .expect(200)
      .expect(response => {
        expect(response.body.title).toBe("Fullstack TypeScript");
        expect(Array.isArray(response.body.modules)).toBeTruthy();
      });
  });
});
