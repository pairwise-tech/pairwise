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
        timeCompleted: new Date(),
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
        timeCompleted: new Date(),
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
        timeCompleted: new Date(),
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The challengeId is invalid");
        done(error);
      });
  });

  test("/progress (POST) requires a valid timeCompleted field", async done => {
    request(`${HOST}/progress`)
      .post("/")
      .send({
        complete: true,
        challengeId: "5ziJI35f",
        courseId: "fpvPtfu7s",
        timeCompleted: "blegh",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toEqual([
          "timeCompleted must be a ISOString",
        ]);
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
        timeCompleted: new Date(),
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

    const challengeOneTime = new Date();
    await updateProgressItem({
      complete: false,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
      timeCompleted: challengeOneTime,
    });

    await updateProgressItem({
      complete: true,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
      timeCompleted: new Date(),
    });

    await updateProgressItem({
      complete: true,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
      timeCompleted: new Date(),
    });

    const challengeTwoTime = new Date();
    await updateProgressItem({
      complete: true,
      challengeId: "50fxTLRcV",
      courseId: "fpvPtfu7s",
      timeCompleted: challengeTwoTime,
    });

    const challengeThreeTime = new Date();
    await updateProgressItem({
      complete: true,
      challengeId: "WUA8ezECU",
      courseId: "fpvPtfu7s",
      timeCompleted: challengeThreeTime,
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
          ["5ziJI35f"]: {
            complete: true,
            timeCompleted: challengeOneTime.toISOString(),
          },
          ["50fxTLRcV"]: {
            complete: true,
            timeCompleted: challengeTwoTime.toISOString(),
          },
          ["WUA8ezECU"]: {
            complete: true,
            timeCompleted: challengeThreeTime.toISOString(),
          },
        };

        expect(JSON.parse(entry.progress)).toEqual(expected);
        done(error);
      });
  });
});
