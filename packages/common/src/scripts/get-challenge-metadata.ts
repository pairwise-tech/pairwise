import * as fs from "fs";
import * as path from "path";
import { promisify, inspect } from "util";
import * as ChildProcess from "child_process";
import { Course, ChallengeMetadata } from "src/types/courses";
import bytes from "bytes";

// eslint-disable-next-line
const debug = require("debug")("common:get-challenge-metadata");

const exec = promisify(ChildProcess.exec);

interface GitPorcelainFormat {
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

  // These values are both present in Porcelain output but the associated keys are a custom creation.
  commit: string;
  content: string;
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
  const start = lines.findIndex(line =>
    line.includes(`"id": "${challenge.id}"`),
  ); // See NOTE
  const end = start + Object.keys(challenge).length; // See NOTE

  // Currently unused. We could use this to cunt out the exact lines of text for
  // this challenge
  debug(
    "[getFileLocation] Lines Snippet",
    "\n" +
      lines
        .slice(start, end)
        .map(s => s.slice(0, 80))
        .join("\n"),
  );

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
// NOTE: Regarding the split regex. Porcelain format puts the content of every
// blame line right after a \t character. This means splitting on tab
// effectively splits the porcelain output into output by line of the original
// source file. Porcelain outputs many lines for metadata for each line of
// source, so this lets us group by source line essentially. The matching group
// is very important for the reduce that comes later though. A matching group in
// a split command puts the matched elements in every odd-numbered element. Odd,
// I know, maybe there's a precident in some other langauge. Regardless, this is
// how it works and it's what lets the reducer grab the content and tack it on
// to the last object.
export const parseGitPorcelain = (str: string): GitPorcelainFormat[] => {
  // This seems simply too dynamic for TS, which is fair. It cannot guarantee
  // what I'm telling it, but we're working on the assumption that the passed in
  // string really is a git porcelain string and TS can't help us with the
  // specific format of a string
  return str
    .trim()
    .split(/^(\t.+$)/m) // Very important regex. See NOTE
    .filter(Boolean)
    .reduce((agg, chunk, i) => {
      if (i % 2 !== 0) {
        // NOTE: Trimming will remove whitespace present in the original file
        // content. Not sure if this is advisable.
        const content = chunk.trim();
        agg[agg.length - 1].content = content;
        return agg;
      }

      const [commitLine, ...meta] = chunk.trim().split("\n");
      const blame = meta.reduce(
        (_agg, line) => {
          const [k, ...rest] = line.split(" ");
          const value = rest.join(" ");
          return {
            ..._agg,
            [camelCase(k)]: isNumeric(value) ? Number(value) : value, // Convert values to number if all numbers
          };
        },
        { commit: commitLine.split(" ")[0] },
      );
      return [...agg, blame];
    }, []);
};

// This is a total one-off helper but I always find sorting to be confusing
// without a comment to explain in words the actual ordering.
const sortLatestFirst = (x: GitPorcelainFormat[]) =>
  x.sort((a, b) => b.authorTime - a.authorTime);

// Git porcelain output can get rather large when doing it a while file at a time.
const MAX_BUFFER_SIZE = bytes("10mb");

interface GitMetadataArgs {
  gitStart: number;
  gitEnd: number;
  porcelainLines: GitPorcelainFormat[];
}

// Cache the string results of calling git porcelain.
// NOTE: This takes up a lot of memory (relatively speaking). The porcelain
// output for a file is roughly 10x the size of the file.
const porcelainCache: { [k: string]: GitPorcelainFormat[] } = {};

export const getPorcelainForFile = async (filepath: string) => {
  if (filepath in porcelainCache) {
    debug(`[getPorcelainForFile] Cache Hit -- ${filepath}`);
    return porcelainCache[filepath];
  }

  const blameCommand = `git blame --line-porcelain -M -C -C ${filepath}`;

  debug("[getPorcelainForFile] Blame Command: $", blameCommand);

  const { stdout: gitPorcelain } = await exec(blameCommand, {
    encoding: "utf-8",
    maxBuffer: MAX_BUFFER_SIZE,
  });

  porcelainCache[filepath] = parseGitPorcelain(gitPorcelain);

  return porcelainCache[filepath];
};

const getGitMetadata = async ({
  gitStart,
  gitEnd,
  porcelainLines,
}: GitMetadataArgs) => {
  // Porcelain Lines are assumed to be all lines for the file, so slice out the
  // relevant section. gitStart and gitEnd are all 1-based indexes rather than
  // zero-based, so by decrementing the start we get what we want. gitEnd
  // doesn't need to change since slice is not inclusive on the end arguemnt.
  porcelainLines = porcelainLines.slice(gitStart - 1, gitEnd);

  // This is expected to be the line with "id": "...", which we know will be
  // generated when this challenge was first saved and thus can be treated as
  // the first commit for this challenge.
  const initialCommitLine = porcelainLines[0];

  debug("[getGitMetadata] porcelainLines", porcelainLines);

  debug(
    "[getGitMetadata] initialCommitLine: filtering out lines prior to",
    initialCommitLine,
  );

  // Try to make sure the initial commit line really is the ID line, which was
  // assume is initial becuase IDs do not get modified
  if (!initialCommitLine.content.includes(`"id"`)) {
    const message = "Initial commit line did not include id prop";
    debug(`[getGitMetadata] ${message}`, initialCommitLine);
    throw new Error(`${message} Rerun with DEBUG=common* to see more info`);
  }

  // NOTE: I'm creating a stirng date in addition to the authorTime timestamp
  // because it's human readable and doesn't require remembering to * 1000 in
  // order to instantiate a date
  // NOTE: Only keep blame lines more recent than the initial commit line. Using
  // -M and -C option with git blame tries to track lines that were copy-pasted,
  // however, this can cause false old commits to be associated with lines since
  // some lines in a json object appear copy-pasted due to simply being default
  // values. Such as an empty video URL.
  const blameLines = sortLatestFirst(
    porcelainLines.filter(x => x.authorTime >= initialCommitLine.authorTime), // See NOTE
  ).map(x => ({
    commit: x.commit.slice(0, 8),
    summary: x.summary,
    author: x.author,
    authorDate: new Date(x.authorTime * 1000).toISOString(), // See NOTE
  }));

  // Use a Set to get distinct (unique) entries. Duplicate authors are
  // unavoidable without this, since every blame line has an author and there
  // are only three of us as of this commit.
  const contributors = [...new Set<string>(blameLines.map(x => x.author))];

  // Aggregate commits by each author
  const contributionsBy = blameLines.reduce((agg, x) => {
    // Use set to dedupe commits
    const set = new Set([...(agg[x.author] || []), x.commit]);
    return {
      ...agg,
      [x.author]: Array.from(set),
    };
  }, {});
  const edits = new Set(blameLines.map(x => x.commit)).size;

  return {
    lineRange: [gitStart, gitEnd],
    contributors,
    contributionsBy,
    edits,
    latestUpdate: blameLines[0],
    earliestUpdate: blameLines[blameLines.length - 1],
  };
};

type CourseFiles = ReturnType<typeof readCourseFilesFromDisk>;

export const buildFilePorcelain = async (courseFiles: CourseFiles) => {
  const _tmp = await Promise.all(
    courseFiles
      .map(x => x.filepath)
      .map(async filepath => ({
        filepath,
        porcelain: await getPorcelainForFile(filepath),
      })),
  );

  const result = _tmp.reduce((agg, x) => {
    return {
      ...agg,
      [x.filepath]: x.porcelain,
    };
  }, {});

  return result;
};

export const getChallengMetadata = async (
  id: string,
  courseFiles: CourseFiles = readCourseFilesFromDisk(),
  filePorcelain?: { [k: string]: GitPorcelainFormat[] },
): Promise<ChallengeMetadata | null> => {
  const foundIn: Partial<ChallengeMetadata> = {};

  if (!filePorcelain) {
    debug("Must build file porcelain");
    filePorcelain = await buildFilePorcelain(courseFiles);
  }

  for (const {
    filename,
    filepath,
    raw,
    json: { modules, ...course },
  } of courseFiles) {
    if (course.id === id) {
      console.error(`${id} -> [COURSE] ${course.title}`);
    }

    // Get all git porcelain lines for a given file
    const porcelainLines = filePorcelain[filepath];

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
          porcelainLines,
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
    console.log(inspect(foundIn, { colors: true, depth: 30 }));
  } else {
    console.log(`[COURSE] ${id} Not found`);
  }
};

if (require.main === module) {
  main();
}
