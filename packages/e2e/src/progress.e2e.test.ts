import axios from "axios";
import request from "supertest";
import { fetchAccessToken, HOST } from "./utils/e2e-utils";
import { IProgressDto } from "@pairwise/common";

/** ===========================================================================
 * e2e Tests for /progress APIs
 * ============================================================================
 */

describe("User Progress APIs", () => {
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
        complete: true,
        challengeId: "abc",
        courseId: "def",
      })
      .set("Authorization", "Bearer asd97f8809as7fsa")
      .expect(401)
      .end((error, response) => {
        expect(response.body.message).toBe("Unauthorized");
        done(error);
      });
  });

  test("/progress (POST) rejects invalid courseIds", async done => {
    request(`${HOST}/progress`)
      .post("/")
      .send({
        complete: true,
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
        complete: true,
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
        complete: "hi",
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
    const updateProgressItem = async (progress: IProgressDto) => {
      return axios.post(`${HOST}/progress`, progress, {
        headers: {
          Authorization: authorizationHeader,
        },
      });
    };

    await updateProgressItem({
      complete: false,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
    });

    await updateProgressItem({
      complete: true,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
    });

    await updateProgressItem({
      complete: true,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
    });

    await updateProgressItem({
      complete: true,
      challengeId: "50fxTLRcV",
      courseId: "fpvPtfu7s",
    });

    await updateProgressItem({
      complete: true,
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
          ["5ziJI35f"]: { complete: true },
          ["WUA8ezECU"]: { complete: true },
          ["50fxTLRcV"]: { complete: true },
        };

        expect(JSON.parse(entry.progress)).toEqual(expected);
        done(error);
      });
  });
});
