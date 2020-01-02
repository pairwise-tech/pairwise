import { HOST, fetchAccessToken } from "./utils/e2e-utils";
import axios from "axios";
import faker from "faker";

/** ===========================================================================
 * e2e Stress Tests
 * ============================================================================
 */

const NUMBER_OF_USERS = 25;
const NUMBER_OF_REQUESTS_PER_USER = 10;
const TOTAL_REQUESTS = NUMBER_OF_USERS * NUMBER_OF_REQUESTS_PER_USER;

describe("Stress Test the Server", () => {
  test("Create users and hit the /progress/challenge endpoint repeatedly", async done => {
    /* Wait 1 second to allow other tests to complete first */
    await new Promise((_: any) => setTimeout(_, 1000));

    const start = Date.now();

    const testAPI = async () => {
      const results = await Promise.all(
        new Array(NUMBER_OF_REQUESTS_PER_USER).fill(1).map(async () => {
          const accessToken = await fetchAccessToken();
          const authorizationHeader = `Bearer ${accessToken}`;
          const headers = {
            Authorization: authorizationHeader,
          };

          const randomString = faker.lorem.sentences();

          const body = {
            challengeId: "9scykDold",
            dataBlob: JSON.stringify({ code: randomString }),
          };

          const response = await axios.post(
            `${HOST}/progress/challenge`,
            body,
            {
              headers,
            },
          );
          return response.data;
        }),
      );

      for (const result of results) {
        expect(result).toBe("Success");
      }
    };

    await Promise.all(
      new Array(NUMBER_OF_USERS).fill(1).map(async () => testAPI()),
    );

    const end = Date.now();
    const time = end - start;
    const RPS = (TOTAL_REQUESTS / time) * 1000;

    /**
     * Seems to average around 100 rps.
     *
     * NOTE: Actually the number is higher because each user produces
     * additional API calls in the test, e.g. for user creation.
     */
    console.log(`Handled ${TOTAL_REQUESTS} requests in ${time} milliseconds.`);
    console.log(`That's about ${RPS} requests per second.`);

    done();
  });
});
