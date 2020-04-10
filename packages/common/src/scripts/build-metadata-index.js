const {
  getChallengMetadata,
  readCourseFilesFromDisk,
} = require("./get-challenge-metadata");

const hasTodo = challenge => {
  return Object.values(challenge)
    .filter(x => typeof x === "string")
    .some(x => x.toLowerCase().includes("todo"));
};

const main = () => {
  const courseFiles = readCourseFilesFromDisk();

  const allChallenges = courseFiles
    .map(x => x.json)
    .flatMap(x => x.modules)
    .flatMap(x => x.challenges);

  const result = {
    "@@PAIRWISE": {
      totalChallenges: allChallenges.length,
      codeChallenges: allChallenges.filter(x => x.solutionCode).length,
      videoChallenges: allChallenges.filter(x => x.videoUrl).length,
      todoChallenges: allChallenges.filter(hasTodo).map(x => x.id),
    },
  };

  allChallenges.forEach(({ id }) => {
    const metadata = getChallengMetadata(id, courseFiles);
    if (metadata) {
      result[id] = metadata;
    } else {
      console.error(`[WARN] ${id} Challenge Not Found`);
    }
  });

  // Pipe the output to some file
  console.log(JSON.stringify(result, null, 2));
};

main();
