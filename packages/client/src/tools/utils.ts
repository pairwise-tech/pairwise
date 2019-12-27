import { Challenge } from "@prototype/common";
import { compose } from "redux";

/**
 * Assert a condition cannot occur. Used for writing exhaustive switch
 * blocks (e.g. see unwrapOkValueIfExists).
 */
export const assertUnreachable = (x: never): never => {
  throw new Error(
    `Panic! Received a value which should not exist: ${JSON.stringify(x)}`,
  );
};

/**
 * Artificially wait the provided amount of time.
 */
export const wait = async (time: number = 1000) => {
  await new Promise((_: any) => setTimeout(_, time));
};

const CHALLENGE_STORE_KEY = "CHALLENGES";

/**
 * Save code to localStorage.
 */
export const saveCodeToLocalStorage = (challengeId: string, code: string) => {
  const challenges = getStoredChallenges();
  const updatedChallenges = { ...challenges, [challengeId]: code };
  localStorage.setItem(CHALLENGE_STORE_KEY, JSON.stringify(updatedChallenges));
};

/**
 * Get all the stored challenges.
 */
const getStoredChallenges = () => {
  try {
    const data = localStorage.getItem(CHALLENGE_STORE_KEY);
    if (data) {
      const result = JSON.parse(data);
      if (result) {
        return result;
      }
    }
  } catch (err) {
    console.log(err);
  }

  return {};
};

export const ACCESS_TOKEN_STORAGE_KEY = "ACCESS_TOKEN_STORAGE_KEY";

/**
 * Set the access token.
 */
export const setAccessTokenInLocalStorage = (accessToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
};

/**
 * Get the access token.
 */
export const getAccessTokenFromLocalStorage = () => {
  try {
    const result = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (result) {
      const token = JSON.parse(result);
      if (token) {
        return token;
      }
    }
  } catch (err) {
    console.log(err);
  }

  return "";
};

/**
 * Get the initial code for the editor, possibly from localStorage if
 * anything is saved there.
 */
export const getStoredCodeForChallenge = (challenge: Challenge) => {
  const challenges = getStoredChallenges();
  if (challenge.id in challenges) {
    return challenges[challenge.id];
  } else {
    return challenge.starterCode;
  }
};

/**
 * A compose function which passes only props information for better
 * type-checking.
 */
export const composeWithProps = <T extends {}>(
  ...fns: any
): ((component: any) => (props: T) => any) => {
  return compose(...fns);
};
