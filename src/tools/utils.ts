import { compose } from "redux";

import { CHALLENGE_TYPE } from "modules/challenges/types";
import { getDefaultChallengeStarterCode } from "./challenges";

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

const CODE_KEY_REACT = "LOCAL_STORAGE_CODE_KEY_REACT";
const CODE_KEY_TS = "LOCAL_STORAGE_CODE_KEY_TYPESCRIPT";

/**
 * Save code to localStorage.
 */
export const saveCodeToLocalStorage = (code: string, type: CHALLENGE_TYPE) => {
  const KEY = type === "react" ? CODE_KEY_REACT : CODE_KEY_TS;
  localStorage.setItem(KEY, JSON.stringify(code));
};

/**
 * Get the initial code for the editor, possibly from localStorage if
 * anything is saved there.
 *
 * TODO: Refactor localStorage to store a flat map of id:codeString for all
 * challenges so given a loaded challenge any previous code and just be
 * pulled directly from here.
 */
export const getStarterCodeForChallenge = (type: CHALLENGE_TYPE) => {
  try {
    const KEY = type === "react" ? CODE_KEY_REACT : CODE_KEY_TS;
    const storedCode = localStorage.getItem(KEY);
    if (storedCode) {
      const code = JSON.parse(storedCode);
      if (code) {
        return code;
      }
    }
  } catch (err) {
    // noop
  }

  return getDefaultChallengeStarterCode(type);
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
