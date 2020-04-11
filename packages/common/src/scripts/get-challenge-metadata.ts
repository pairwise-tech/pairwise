import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as ChildProcess from "child_process";
import { Course, ChallengeMetadata } from "src/types/courses";

const exec = promisify(ChildProcess.exec);

interface GitPorcelainFormat {
  commit: string;
  author: string;
  authorMail: string;
  authorTime: number;
  authorTz: string;
  committer: string;
  committerMail: string;
  committerTime: number;
  committerTz: string;
  summary: string;
  previous: string;
  filename: string;
}

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

  // Currently unused. We could use this to cunt out the exact lines of text for
  // this challenge
  // const getSnippet = () => lines.slice(start, end).join("\n");

  return {
    gitStart: start + 1, // See NOTE
    gitEnd: end,
  };
};

const isNumeric = str => {
  return /^\d+$/.test(str);
};

// Git has a "Porcelain" format for machine consumption. It seems to be entirely
// its own thing. Not terribly difficult to parse though.
const parseGitPorcelain = (str: string): GitPorcelainFormat[] => {
  // This seems simply too dynamic for TS, which is fair. It cannot gaurantee
  // what I'm telling it, but we're working on the assumption that the passed in
  // string really is a git porcelain string and TS can't help us with the
  // specific format of a string
  // @ts-ignore
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
const sortLatestFirst = (x: GitPorcelainFormat[]) =>
  x.sort((a, b) => b.authorTime - a.authorTime);

const getGitMetadata = async ({ gitStart, gitEnd, filepath }) => {
  const {
    stdout: gitPorcelain,
  } = await exec(
    `git blame --line-porcelain -M -L ${gitStart},${gitEnd} ${filepath}`,
    { encoding: "utf-8" },
  );

  // NOTE: I'm creating a stirng date in addition to the authorTime timestamp
  // because it's human readable and doesn't require remembering to * 1000 in
  // order to instantiate a date
  const blameLines = sortLatestFirst(parseGitPorcelain(gitPorcelain)).map(
    x => ({
      commit: x.commit.slice(0, 8),
      summary: x.summary,
      author: x.author,
      authorDate: new Date(x.authorTime * 1000).toISOString(), // See NOTE
    }),
  );

  const contributors = Array.from(
    new Set<string>(blameLines.map(x => x.author)),
  );
  const edits = new Set(blameLines.map(x => x.commit)).size;

  return {
    lineRange: [gitStart, gitEnd],
    contributors,
    edits,
    latestUpdate: blameLines[0],
    earliestUpdate: blameLines[blameLines.length - 1],
  };
};

export const getChallengMetadata = async (
  id: string,
  courseFiles: ReturnType<
    typeof readCourseFilesFromDisk
  > = readCourseFilesFromDisk(),
): Promise<ChallengeMetadata | null> => {
  const foundIn: Partial<ChallengeMetadata> = {};

  for (const {
    filename,
    filepath,
    raw,
    json: { modules, ...course },
  } of courseFiles) {
    if (course.id === id) {
      console.error(`${id} -> [COURSE] ${course.title}`);
    }

    for (const [moduleIndex, { challenges, ...mod }] of modules.entries()) {
      if (mod.id === id) {
        console.error(`${id} -> [MODULE] ${mod.title}`);
      }

      const challengeIndex = challenges.findIndex(x => x.id === id);
      const challenge = challenges[challengeIndex];

      if (challenge) {
        foundIn.filename = filename;
        foundIn.keypath = [
          "modules",
          moduleIndex,
          "challenges",
          challengeIndex,
        ];
        foundIn.course = course;
        foundIn.module = mod;
        foundIn.challenge = {
          id: challenge.id,
          type: challenge.type,
          title: challenge.title,
        };

        const fileLocation = getFileLocation({
          raw,
          challenge,
        });

        foundIn.gitMetadata = await getGitMetadata({
          ...fileLocation,
          filepath,
        });
      }
    }
  }

  return Object.keys(foundIn).length ? (foundIn as ChallengeMetadata) : null;
};

export const readCourseFilesFromDisk = (
  courseRoot: string = path.resolve(__dirname, "../courses"),
) => {
  const courseFiles = fs
    .readdirSync(path.resolve(courseRoot))
    .filter(filename => filename.match(/^\d\d/)) // Only numbered course files
    .map(filename => path.resolve(courseRoot, filename))
    .map(filepath => {
      const raw = fs.readFileSync(filepath, { encoding: "utf-8" });
      return {
        filename: path.basename(filepath),
        filepath,
        raw,
        json: JSON.parse(raw) as Course,
      };
    });

  return courseFiles;
};

const main = async () => {
  const id = process.argv[2];
  const foundIn = await getChallengMetadata(id);

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
