import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

import {
  getChallengMetadata,
  readCourseFilesFromDisk,
} from "./get-challenge-metadata";
import { Challenge } from "src/types/courses";

const log = (...args) => {
  console.log("[COURSE METADATA]", ...args);
};

const hasTodo = (challenge: Challenge) => {
  return Object.values(challenge)
    .filter(x => typeof x === "string")
    .some(x => x.toLowerCase().includes("todo"));
};

const main = async () => {
  const outfile = path.resolve(__dirname, "../courses/metadata.json");
  const courseDir = path.resolve(__dirname, "../courses");

  let existingFile;
  try {
    existingFile = JSON.parse(fs.readFileSync(outfile, { encoding: "utf-8" }));
  } catch (err) {
    log("No existig file found or parse failure.");
  }

  // TODO: We can use this to git diff the course dir against this commit. If
  const currentCommit = execSync(`git log -n 1 --pretty=format:"%h"`, {
    encoding: "utf-8",
  }).trim();

  if (existingFile) {
    const { buildCommit } = existingFile["@@PAIRWISE"];
    const cmd = `git diff --name-only ${buildCommit} -- ${courseDir}`;
    const filesChanged = execSync(cmd, { encoding: "utf-8" }).trim();

    if (!filesChanged) {
      log(
        `No course files changed since last build commit ${buildCommit}. Course metadata will not be rebuilt.`,
      );
      return;
    }

    log("The following course files have changed:");
    log(
      filesChanged
        .split("\n")
        .map(x => `- ${x}`)
        .join("\n"),
    );
    log("Index will be rebuilt.");
  }

  log("Building index...");

  const courseFiles = readCourseFilesFromDisk(courseDir);

  const allChallenges = courseFiles
    .map(x => x.json)
    .flatMap(x => x.modules)
    .flatMap(x => x.challenges);

  const result = {
    "@@PAIRWISE": {
      buildCommit: currentCommit,
      totalChallenges: allChallenges.length,
      codeChallenges: allChallenges.filter(x => x.solutionCode).length,
      videoChallenges: allChallenges.filter(x => x.videoUrl).length,
      todoChallenges: allChallenges.filter(hasTodo).map(x => x.id),
    },
  };

  const allMetadata = await Promise.all(
    allChallenges.map(({ id }) => {
      return getChallengMetadata(id, courseFiles);
    }),
  );

  allMetadata.forEach(metadata => {
    result[metadata.challenge.id] = metadata;
  });

  log(`Writing to ${outfile}`);
  fs.writeFileSync(outfile, JSON.stringify(result, null, 2), {
    encoding: "utf-8",
  });
  log("Build Successful.");
};

main();
