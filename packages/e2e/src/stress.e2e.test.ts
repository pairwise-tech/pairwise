import { HOST, fetchAccessToken } from "./utils/e2e-utils";
import axios from "axios";
import faker from "faker";

/** ===========================================================================
 * e2e Stress Tests
 * ----------------------------------------------------------------------------
 * Seems to average around 100 rps [1].
 *
 * NOTE: Actually the number is higher because each user produces
 * additional API calls in the test, e.g. for user creation.
 *
 * Assuming a normal user will make an API request every 2 minutes or so,
 * which is reasonable considering most API requests will be to update
 * saved challenge code or mark a challenge as passed (in reality, it
 * will probably be less frequently than every 2 minutes).
 *
 * And assuming a regular user is active for about 8 hours a day, another
 * generous assumption.
 *
 * Then a regular user would consume about 240 requests/day.
 *
 * Assuming user distribution is evenly distributed throughout an entire
 * day (probably not true but it may be true for a large enough user
 * population), then 1 user would generate about 0.003 requests/second.
 *
 * 240 requests per user per day / (24*60*60 seconds in a day) = 0.003 rps
 *
 * If the application on a single machine has a capacity of ~ 100rps,
 * then based on these estimates it could accommodate around 8.5 million
 * daily active users, by these generously rough estimates.
 *
 * 8,500,000 requests per day / (24*60*60 seconds in a day) ~ 100 rps
 *
 * 8,500,000 requests per day / 240 requests per user per day ~ 35,000 users
 *
 * In reality, running on more powerful cloud hardware, a single server
 * could probably support 50-100K daily active users. Moreover, the
 * application could be easily scaled horizontally to support up to 1 million
 * daily active users.
 *
 * It's likely the assumptions about user activity made here are too generous,
 * however, they suggest the application should scale very well. They also
 * suggest it's prudent to limit/reduce unnecessary API requests.
 * ===========================================================================
 */

const NUMBER_OF_USERS = 15;
const NUMBER_OF_REQUESTS_PER_USER = 5;
const TOTAL_REQUESTS = NUMBER_OF_USERS * NUMBER_OF_REQUESTS_PER_USER;

describe.skip("Stress Test the Server", () => {
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
            dataBlob: { code: randomString, type: "challenge" },
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

    /* [1] */
    const end = Date.now();
    const time = end - start;
    const RPS = (TOTAL_REQUESTS / time) * 1000;
    console.log(`Handled ${TOTAL_REQUESTS} requests in ${time} milliseconds.`);
    console.log(`That's about ${RPS} requests per second.`);

    done();
  });
});
