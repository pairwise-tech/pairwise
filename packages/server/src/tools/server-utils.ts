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
 * Server utils
 * ============================================================================
 */

const fetchPullRequestDiff = async (pullRequestNumber: number) => {
  const url = `https://api.github.com/repos/pairwise-tech/pairwise/pulls/${pullRequestNumber}/files`;
  const result = await axios.get(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      authorization: `token ${ENV.GITHUB_API_TOKEN}`,
    },
  });
  return result.data;
};

const fetchFileBlob = async (fileSHA: string) => {
  const url = `https://api.github.com/repos/pairwise-tech/pairwise/git/blobs/${fileSHA}`;
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
 */
export const parsePullRequestDiff = async (
  pullRequestId: string,
  currentCourseList: CourseList,
): Promise<PullRequestDiffContext[] | string> => {
  try {
    const id = Number(pullRequestId);
    if (!id || typeof id !== "number") {
      throw new Error("Invalid pull request id provided");
    }
    // Fetch the pull request diff
    const diff = await fetchPullRequestDiff(id);

    const matchFile = (fileName: string) => (diff: any) => {
      return diff.filename === fileName;
    };

    const filename = (name: string) => {
      return `packages/common/src/courses/${name}.json`;
    };

    // Get all the course files
    const ts = diff.find(matchFile(filename("01_fullstack_typescript")));
    const python = diff.find(matchFile("02_python_language"));
    const rust = diff.find(matchFile("03_rust_language"));
    const go = diff.find(matchFile("04_golang_language"));
    const courses = [ts, python, rust, go].filter(Boolean);

    if (courses.length > 0) {
      const result = await Promise.all(
        courses.map(async (courseDiffFile) => {
          const { sha, patch } = courseDiffFile;
          /**
           * Extract all the git file annotations which denote changed line
           * numbers in the diff.
           */
          const lineDiffs = patch
            .split("\n")
            .filter((x) => /@@(.*)@@/.test(x))
            .map((x) => x.match(/\+(.*)\,/).pop());

          /**
           * Fetch the blob for the course JSON in file in this PR. Convert
           * it to formatted JSON and split it by line so we can iterate
           * through it with reference to the line numbers.
           */
          const blob = await fetchFileBlob(sha);
          const blobJSON = JSON.stringify(blob, null, 2);
          const jsonByLines = blobJSON.split("\n");

          /**
           * Iterate through the JSON by line number and extract all the
           * challenge ids which overlap with line numbers from the diff.
           */
          let currentChallengeId = null;
          const challengeIds = [];
          const lineNumberSet = new Set(lineDiffs.map((line) => +line));

          for (let i = 1; i < jsonByLines.length + 1; i++) {
            const lineNumber = i;
            const line = jsonByLines[lineNumber - 1];
            if (line.includes(`"id":`)) {
              const id = line.match(/\"id\": \"(.*)\"/).pop();
              currentChallengeId = id;
            }

            if (lineNumberSet.has(lineNumber)) {
              challengeIds.push(currentChallengeId);
            }
          }

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
          const prDiffContext = challengeIds.map((id) => {
            // May be undefined if updated challenge is new:
            const originalChallengeMeta = originalChallengeMap[id];
            // May be undefined if updated challenge is a deletion:
            const updatedChallengeMeta = pullRequestChallengeMap[id];

            // One of them should exist...
            const existing = originalChallengeMap
              ? originalChallengeMeta
              : updatedChallengeMeta;

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
          });

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
