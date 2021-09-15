import io, { Socket } from "socket.io-client";
import {
  assertUnreachable,
  SocketEvents,
  SocketEventTypes,
} from "@pairwise/common";
import ENV from "./utils/e2e-env";
import { createUserAndUpdateProgress, wait } from "./utils/e2e-utils";

// Open a socket connection
const createSocketConnection = () => {
  const socket: Socket = io(ENV.HOST, {
    transports: ["websocket"],
    reconnection: false,
  });

  return socket;
};

/**
 * These tests are executed separately from the other e2e test suite to
 * avoid a race condition with other tests also hitting the /progress
 * endpoint at the same time as this test suite runs.
 */
describe("Backend Web Sockets server is functional", () => {
  test("Web Socket connection works", async () => {
    const socket = createSocketConnection();

    let connected = false;

    socket.on("connect", () => {
      connected = true;
    });

    // Delay to allow socket connection to establish
    await wait(500);

    // Assert connection was established
    expect(connected).toBe(true);

    // Close socket connection
    socket.close();
  });

  test("Web Sockets connection receives challenge updates", async () => {
    const socket = createSocketConnection();

    let message;

    socket.on("message", (event: SocketEvents) => {
      switch (event.type) {
        case SocketEventTypes.REAL_TIME_CHALLENGE_UPDATE: {
          message = event.payload.data;
          break;
        }
        default:
          assertUnreachable(event.type);
      }
    });

    const challenge = await createUserAndUpdateProgress();
    const challengeId = challenge.id;

    // Delay to allow socket event to occur
    await wait(500);

    // Assert message challenge id matches the challenge API call
    const messageChallengeId = message.challengeId;
    expect(challengeId).toBe(messageChallengeId);

    // Close socket connection
    socket.close();
  });
});
