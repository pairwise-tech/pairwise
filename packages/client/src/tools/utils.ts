import { Challenge, CHALLENGE_TYPE } from "@pairwise/common";
import { compose } from "redux";

/**
 * Artificially wait the provided amount of time.
 */
export const wait = async (time: number = 1000) => {
  await new Promise((_: any) => setTimeout(_, time));
};

const CHALLENGE_STORE_KEY = "CHALLENGES";

interface Storage {
  challenges: { [k: string]: string };
  sandboxType: CHALLENGE_TYPE;
}

interface StorageUpdate {
  code: string;
  sandboxType?: CHALLENGE_TYPE;
}

/**
 * Save code to localStorage.
 */
export const persistToLocalStorage = (
  challengeId: string,
  { code, sandboxType = "markup" }: StorageUpdate,
) => {
  const data = getPersistedData();
  const updatedChallenges = { ...data.challenges, [challengeId]: code };
  localStorage.setItem(
    CHALLENGE_STORE_KEY,
    JSON.stringify({
      challenges: updatedChallenges,
      sandboxType,
    }),
  );
};

/**
 * Get all the stored challenges.
 */
const getPersistedData = (): Storage => {
  try {
    const data = localStorage.getItem(CHALLENGE_STORE_KEY);
    if (data) {
      const result = JSON.parse(data);

      // The additional checks after result are to guard against old local
      // storage shape blowing up the app
      if (result && result.challenges && result.sandboxType) {
        return result;
      }
    }
  } catch (err) {
    console.log("[Err] Could not access local storage", err);
  }

  // Default
  return { challenges: {}, sandboxType: "markup" };
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
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (token) {
      return token;
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
  const { challenges } = getPersistedData();
  if (challenge.id in challenges) {
    return challenges[challenge.id];
  } else {
    return challenge.starterCode;
  }
};

/**
 * The error handling here is overcaution since there is a try catch in the
 * other function. However, I don't want the sandbox to end up breaking the app
 * for some yet-unforseen reason
 */
export const getStoredSandboxType = (): CHALLENGE_TYPE => {
  try {
    return getPersistedData().sandboxType;
  } catch (err) {
    console.warn(
      "[Err] Should be unreachable. Could not get stored sandbox type",
      err,
    );
    return "markup";
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
