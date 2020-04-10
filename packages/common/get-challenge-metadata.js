const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const camelCase = str => {
  const capitalize = s => s.slice(0, 1).toUpperCase() + s.slice(1);
  const [head, ...tail] = str.split("-");
  return head + tail.map(capitalize).join("");
};

// NOTE: subtracting 1 from the start brings the opening { into play.
// NOTE: length of keys + 2 is 1 to include the closing } in the json file and 1
// because slice is not includive of the end index
// NOTE: Adding 1 back onto start makes git blame -L <start>. Looking at the
// docs it looks like git line indexes are actually 1-based not 0-based.
const getFileLocation = ({ raw, challenge }) => {
  const lines = raw.split("\n");
  const start =
    lines.findIndex(line => line.includes(`"id": "${challenge.id}"`)) - 1; // See NOTE
  const end = start + Object.keys(challenge).length + 2; // See NOTE
  return {
    getSnippet: () => lines.slice(start, end).join("\n"),
    gitStart: start + 1, // See NOTE
    gitEnd: end,
  };
};

const isNumeric = str => {
  return /^\d+$/.test(str);
};

// Git has a "Porcelain" format for machine consumption. It seems to be entirely
// its own thing. Not terribly difficult to parse though.
const parseGitPorcelain = str => {
  return str
    .trim()
    .split(/^\t.+$/m)
    .filter(Boolean)
    .map(chunk => {
      const [commitLine, ...meta] = chunk.trim().split("\n");
      return meta.reduce(
        (agg, line) => {
          const [k, ...rest] = line.split(" ");
          const value = rest.join(" ");
          return {
            ...agg,
            [camelCase(k)]: isNumeric(value) ? Number(value) : value, // Convert values to number if all numbers
          };
        },
        { commit: commitLine.split(" ")[0] },
      );
    });
};

// This is a total one-off helper but I always find sorting to be confusing
// without a comment to explain in words the actual ordering.
const sortOldestFirst = x => x.sort((a, b) => a.authorTime - b.authorTime);

const getGitMetadata = ({ gitStart, gitEnd }) => {
  const gitPorcelain = execSync(
    `git blame --line-porcelain -L ${gitStart},${gitEnd} /Users/ian/dev/pairwise/packages/common/src/courses/01_fullstack_typescript.json`,
    { encoding: "utf-8" },
  );
  const blameLines = sortOldestFirst(
    parseGitPorcelain(gitPorcelain),
  ).map(x => ({ ...x, authorDate: new Date(x.authorTime * 1000) }));

  const authors = Array.from(new Set(blameLines.map(x => x.author))).sort();
  const edits = new Set(blameLines.map(x => x.commit)).size;

  return {
    authors,
    edits,
    firstCommit: blameLines[0],
    lastCommit: blameLines[blameLines.length - 1],
  };
};

const getChallengMetadata = (id, coursesFiles = readCourseFilesFromDisk()) => {
  const foundIn = {};

  coursesFiles.forEach(
    ({
      filename,
      filepath,
      raw,
      json: { modules, ...course },
      courseIndex,
    }) => {
      if (course.id === id) {
        console.error(`${id} -> [COURSE] ${course.title}`);
      }

      modules.forEach(({ challenges, ...mod }, moduleIndex) => {
        if (mod.id === id) {
          console.error(`${id} -> [MODULE] ${mod.title}`);
        }

        const challengeIndex = challenges.findIndex(
          challenge => challenge.id === id,
        );
        const challenge = challenges[challengeIndex];

        if (challenge) {
          foundIn.filename = filename;
          foundIn.filepath = filepath;
          (foundIn.keypath = [
            "modules",
            moduleIndex,
            "challenges",
            challengeIndex,
          ]),
            (foundIn.course = course);
          foundIn.module = mod;
          foundIn.challenge = {
            id: challenge.id,
            type: challenge.type,
            title: challenge.title,
          };

          foundIn.fileLocation = getFileLocation({
            raw,
            challenge,
          });

          foundIn.gitMetadata = getGitMetadata(foundIn.fileLocation);
        }
      });
    },
  );

  return Object.keys(foundIn).length ? foundIn : null;
};

const readCourseFilesFromDisk = (courseRoot = "./src/courses") => {
  const coursesFiles = fs
    .readdirSync(path.resolve(courseRoot))
    .map(filename => path.resolve(courseRoot, filename))
    .map(filepath => {
      const raw = fs.readFileSync(filepath, { encoding: "utf-8" });
      return {
        filename: path.basename(filepath),
        filepath,
        raw,
        json: JSON.parse(raw),
      };
    });

  return coursesFiles;
};
module.exports.readCourseFilesFromDisk = readCourseFilesFromDisk;

const main = () => {
  const id = process.argv[2];
  const foundIn = getChallengMetadata(id);

  if (foundIn) {
    console.log(
      `${id} found at `,
      [
        foundIn.filename,
        foundIn.course.title,
        foundIn.module.title,
        foundIn.challenge.title,
      ].join(" > "),
    );
    console.log(foundIn);
  } else {
    console.log(`[COURSE] ${id} Not found`);
  }
};

if (require.main === module) {
  main();
}
