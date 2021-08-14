import axios from "axios";
import { InternalServerErrorException } from "@nestjs/common";
import {
  CourseList,
  createInverseChallengeMapping,
  PullRequestDiffContext,
} from "@pairwise/common";
import { captureSentryException } from "./sentry-utils";
import ENV from "./server-env";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface CourseFileDiff {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch: string;
}

/** ===========================================================================
 * Pull Request Diff Utils
 * ============================================================================
 */

const PAIRWISE_REPO_BASE =
  "https://api.github.com/repos/pairwise-tech/pairwise";

/**
 * Fetch PR diff.
 */
const fetchPullRequestDiff = async (pullRequestNumber: number) => {
  const url = `${PAIRWISE_REPO_BASE}/pulls/${pullRequestNumber}/files`;
  const result = await axios.get(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      authorization: `token ${ENV.GITHUB_API_TOKEN}`,
    },
  });

  return result.data;
};

/**
 * Fetch individual file blob.
 */
const fetchFileBlob = async (fileSHA: string) => {
  const url = `${PAIRWISE_REPO_BASE}/git/blobs/${fileSHA}`;
  const result = await axios.get(url, {
    headers: {
      Accept: "application/vnd.github.VERSION.raw",
      authorization: `token ${ENV.GITHUB_API_TOKEN}`,
    },
  });
  return result.data;
};

/**
 * Accept a pull request id and fetch pull request diff metadata from GitHub
 * in order to provide diff content context for admin client.
 *
 * NOTE: To test or debug this locally against a real pull request, you may
 * want to:
 *
 * 1. Create a pull request with course changes.
 * 2. Checkout the main branch and rebuild common/.
 * 3. Run the admin app and server locally, and inspect that pull request.
 *
 * If you run on your pull request branch which presumably contains the
 * course changes, there will be no diff.
 */
export const parsePullRequestDiff = async (
  pullRequestId: string,
  currentCourseList: CourseList,
): Promise<PullRequestDiffContext[] | string> => {
  try {
    const id = Number(pullRequestId);
    if (!id || typeof id !== "number") {
      throw new Error(`Invalid pull request id provided, received: ${id}`);
    }
    // Fetch the pull request diff
    const diff = await fetchPullRequestDiff(id);

    const matchFile = (courseName: string) => (diff: any) => {
      const filename = `packages/common/src/courses/${courseName}.json`;
      return diff.filename === filename;
    };

    // Get all the course files
    const ts = diff.find(matchFile("01_fullstack_typescript"));
    const python = diff.find(matchFile("02_python_language"));
    const rust = diff.find(matchFile("03_rust_language"));
    const go = diff.find(matchFile("04_golang_language"));
    const courses: CourseFileDiff[] = [ts, python, rust, go].filter(Boolean);

    if (courses.length > 0) {
      const result = await Promise.all(
        courses.map(async (courseDiffFile) => {
          const { sha, patch } = courseDiffFile;

          const allChangedLines = getPatchChangedLines(patch);

          /**
           * Fetch the blob for the course JSON in file in this PR. Convert
           * it to formatted JSON and split it by line so we can iterate
           * through it with reference to the line numbers.
           */
          const blob = await fetchFileBlob(sha);
          const blobJSON = JSON.stringify(blob, null, 2);
          const jsonByLines = blobJSON.split("\n");

          const challengeIds = getPatchChallengeIds(
            allChangedLines,
            jsonByLines,
          );

          /**
           * Lookup up the original challenge (if it exists) and the updated
           * challenge.
           */
          const originalChallengeMap =
            createInverseChallengeMapping(currentCourseList);
          const pullRequestChallengeMap = createInverseChallengeMapping([blob]);

          /**
           * Map over the identified altered challenge ids from the pull request
           * and construct content context to return in the response.
           */
          const prDiffContext = challengeIds
            .map((id) => {
              // May be undefined if updated challenge is new:
              const originalChallengeMeta = originalChallengeMap[id];
              // May be undefined if updated challenge is a deletion:
              const updatedChallengeMeta = pullRequestChallengeMap[id];

              // One of them should exist...
              const existing = originalChallengeMeta
                ? originalChallengeMeta
                : updatedChallengeMeta;

              // If no challenge is found then the id was probably a module
              // or course id, return null.
              if (existing === undefined) {
                return null;
              }

              const { moduleId, courseId } = existing;
              const originalChallenge = originalChallengeMeta
                ? originalChallengeMeta.challenge
                : null;
              const updatedChallenge = updatedChallengeMeta
                ? updatedChallengeMeta.challenge
                : null;

              return {
                id,
                moduleId,
                courseId,
                updatedChallenge,
                originalChallenge,
              };
            })
            .filter((x) => x !== null);

          return prDiffContext;
        }),
      );

      // Flatten the results and remove null id diffs
      return result
        .reduce((flat, diff) => flat.concat(diff), [])
        .filter((x) => x.id !== null);
    } else {
      return "No course JSON has been modified in this PR.";
    }
  } catch (err) {
    captureSentryException(err);
    throw new InternalServerErrorException(err);
  }
};

/**
 * Extract all the line numbers which are changed in a pull
 * request diff.
 */
const getPatchChangedLines = (patch: string) => {
  const patches = patch.split(/@(.*)@\n/);

  const patchDiffLines = [];

  // Match all git diff annotations using the @@...@@ syntax, and extract
  // the annotation and subsequent diff and return both as a tuple.
  for (let i = 0; i < patches.length; i++) {
    const entry = patches[i];
    if (entry.charAt(0) === "@") {
      const lines = entry.match(/\+(.*)\ @/).pop();
      patchDiffLines.push([lines, patches[i + 1]]);
      i++;
    }
  }

  const allChangedLines: number[] = [];

  // Iterate through all the diffs and find each line which is marked with
  // a + or - to include in the changed lines. The reason for this is that
  // some additional lines are included in the path which are unchanged.
  for (const pair of patchDiffLines) {
    const [lines, diff] = pair;
    const [startLine, numberOfLines] = lines.split(",");
    const start = Number(startLine);
    const total = Number(numberOfLines);
    const parsedDiff = diff.split("\n");

    let index = 0;

    for (let i = start; i < start + total; i++) {
      const line = parsedDiff[index];
      const firstCharacter = line.charAt(0);
      if (firstCharacter === "-" || firstCharacter === "+") {
        allChangedLines.push(i);
      }
      index++;
    }
  }

  return allChangedLines;
};

/**
 * Get all the challenge ids which are affected by a pull request.
 */
const getPatchChallengeIds = (
  allChangedLines: number[],
  jsonByLines: string[],
) => {
  let currentChallengeId = null;
  const challengeIdSet: Set<string> = new Set();
  const lineNumberSet = new Set(allChangedLines);

  for (let i = 1; i < jsonByLines.length + 1; i++) {
    const lineNumber = i;
    const line = jsonByLines[lineNumber - 1];
    if (line.includes(`"id":`)) {
      const id = line.match(/\"id\": \"(.*)\"/).pop();
      currentChallengeId = id;
    }

    if (lineNumberSet.has(lineNumber)) {
      challengeIdSet.add(currentChallengeId);
    }
  }

  return Array.from(challengeIdSet);
};
