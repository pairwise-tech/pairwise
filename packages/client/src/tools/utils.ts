import md5 from "md5";
import shortid from "shortid";
import { compose } from "redux";
import {
  Module,
  Challenge,
  assertUnreachable,
  CodeChallengeBlob,
  VideoChallengeBlob,
  DataBlob,
  SandboxBlob,
  CHALLENGE_TYPE,
  CHALLENGE_PROGRESS,
  ChallengeSkeleton,
  ChallengeSkeletonList,
  ProjectChallengeBlob,
  CourseList,
  createInverseChallengeMapping,
  UserProgressMap,
  CourseSkeleton,
  getChallengeSlug,
  AppTheme,
  MonacoEditorThemes,
  PortfolioSkills,
} from "@pairwise/common";
import { SANDBOX_ID } from "./constants";
import { Location } from "history";
import { IconName } from "@blueprintjs/core";
import { ParsedQuery } from "query-string";
import { ChallengeTypeOption } from "components/ChallengeTypeMenu";

/** ===========================================================================
 * Utils
 * ============================================================================
 */

/**
 * Artificially wait the provided amount of time.
 */
export const wait = async (time = 1000) => {
  await new Promise((_: any) => setTimeout(_, time));
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

/**
 * Determine if a challenge should only show content (no code editor).
 */
export const isContentOnlyChallenge = (challenge: Challenge) => {
  const { type } = challenge;
  return (
    type === "media" ||
    type === "section" ||
    type === "project" ||
    type === "guided-project" ||
    type === "special-topic"
  );
};

/**
 * Determine if a challenge requires the workspace (code editor).
 */
export const challengeRequiresWorkspace = (
  challenge: Challenge | null | undefined,
) => {
  if (!challenge) {
    return false;
  }

  const contentOnlyChallenge = isContentOnlyChallenge(challenge);
  return !contentOnlyChallenge;
};

// Pretty print. Just a debug function when you're existing logs ar a wee bit cluttered.
export const pp = (s: string, ...args: any[]) => {
  if (args.length) {
    console.log(`%c${s} 👉 %o`, "font-size:18px;color:lime;", args);
  } else {
    console.log(`%c${s}`, "font-size:18px;color:lime;");
  }
};

/**
 * Given a challenge and other relevant data, construct the
 * data blob to represent the user's progress on that challenge.
 */
export const constructDataBlobFromChallenge = (args: {
  code?: string;
  projectURL?: string;
  repoURL?: string;
  challenge: Challenge;
}): DataBlob => {
  const { code = "", repoURL = "", projectURL = "", challenge } = args;

  if (challenge.id === SANDBOX_ID) {
    const blob: SandboxBlob = {
      code,
      type: "sandbox",
      challengeType: challenge.type,
    };
    return blob;
  }

  switch (challenge.type) {
    case "section":
    case "react":
    case "typescript":
    case "markup":
    case "python":
    case "golang":
    case "rust": {
      const blob: CodeChallengeBlob = {
        code,
        type: "challenge",
      };
      return blob;
    }
    case "guided-project":
    case "special-topic":
    case "media": {
      const blob: VideoChallengeBlob = {
        type: "video",
        timeLastWatched: 0,
      };
      return blob;
    }
    case "project": {
      const blob: ProjectChallengeBlob = {
        type: "project",
        repo: repoURL,
        url: projectURL,
        timeLastWatched: 0,
      };
      return blob;
    }
    default: {
      assertUnreachable(challenge.type);
    }
  }
};

// Restrict shortid to only friendly-looking characters for nicer-looking ids
shortid.characters(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@",
);

export const generateEmptyModule = (): Module => ({
  id: shortid.generate(),
  title: "[EMPTY...]",
  free: false /* All challenges are locked by default */,
  challenges: [],
});

const starterTestCodeTypeScript = `test("\`example\` function should...", () => {
  pass();
});
`;

const starterTestCodePython = `def test():
  return True
\`;

test("The \`example\` function should ...", async () => {
  const CODE_STRING = __user_code_string__;
  const result = await executePythonChallengeTests(CODE, TEST_STRING);
  handleAlternateLanguageTestResult(result, console.log);
});
`;

/**
 * The identifier is hard-coded here because it is used in the default
 * test code and in the file export generation. It should match in both
 * cases and not be changed.
 */
const RUST_TEST_STRING_IDENTIFIER = "const TEST_STRING = `";

const starterTestCodeRust = `// Do not change the following line, it is used in Rust file export generation.
${RUST_TEST_STRING_IDENTIFIER}
// Returns a boolean representing challenge test status.
fn test() -> bool {
  true
}
\`;

test("The \`example\` function should...", async () => {
  const CODE_STRING = __user_code_string__;
  const result = await executeRustChallengeTests(CODE_STRING, TEST_STRING);
  handleAlternateLanguageTestResult(result, console.log);
});

`;

const starterTestCodeGolang = `const TEST_STRING = \`
func test() bool {  
  return true
}
\`;

test("The \`example\` function should...", async () => {
  const CODE = __user_code_string__;
  const result = await executeGolangChallengeTests(CODE, TEST_STRING);
  handleAlternateLanguageTestResult(result, console.log);
});

`;

const defaultTestCodeOptions = {
  typescript: starterTestCodeTypeScript,
  python: starterTestCodePython,
  rust: starterTestCodeRust,
  golang: starterTestCodeGolang,
};

export const generateEmptyChallenge = (args: {
  id?: string;
  overwrite?: Partial<Challenge>;
}): Challenge => {
  const { id, overwrite } = args;

  // Default:
  let type: CHALLENGE_TYPE = "typescript";

  // Use hard-coded course ids
  if (id === "asiuq8e7l") {
    type = "python";
  } else if (id === "alosiqu45") {
    type = "rust";
  } else if (id === "aiqu278z9") {
    type = "golang";
  }

  const defaultTestCode = defaultTestCodeOptions[type];
  const testCode = !!defaultTestCode ? defaultTestCode : "";

  return {
    type,
    id: shortid.generate(),
    title: "[EMPTY...]",
    instructions: "",
    testCode,
    videoUrl: "",
    starterCode: "",
    solutionCode: "",
    content: "",
    ...overwrite,
  };
};

export const defaultSandboxChallenge = generateEmptyChallenge({
  overwrite: {
    id: SANDBOX_ID, // Important. This is how the app knows it's the sandbox challenge
    title: "Sandbox",
    type: "markup",
  },
});

export const defaultSandboxBlob = constructDataBlobFromChallenge({
  code: "",
  challenge: defaultSandboxChallenge,
});

/**
 * Get the appropriate icon from a challenge based on the challenge type.
 */
export const getChallengeIcon = (
  type: CHALLENGE_TYPE,
  userCanAccess: boolean,
  challengeProgress?: CHALLENGE_PROGRESS,
): IconName => {
  if (!userCanAccess) {
    return "lock";
  }

  if (
    challengeProgress &&
    type !== "section" &&
    challengeProgress === "COMPLETE"
  ) {
    return "tick";
  }

  if (type === "section") {
    return "caret-down";
  } else if (type === "media") {
    return "book";
  } else {
    return "code";
  }
};

export const getChallengeProgress = (
  userProgressMap: Nullable<UserProgressMap>,
  courseId: string,
  challengeId: string,
): CHALLENGE_PROGRESS => {
  if (
    userProgressMap &&
    userProgressMap[courseId] &&
    userProgressMap[courseId][challengeId]
  ) {
    if (userProgressMap[courseId][challengeId].complete) {
      return "COMPLETE";
    }
    return "INCOMPLETE";
  }
  return "NOT_ATTEMPTED";
};

export const getSectionProgress = (
  sectionChallenges: ChallengeSkeleton[],
  userProgressMap: Nullable<UserProgressMap>,
  courseId: string,
) => {
  return sectionChallenges.reduce(
    (acc: number, { id }) =>
      getChallengeProgress(userProgressMap, courseId, id) === "COMPLETE"
        ? acc + 1
        : acc,
    0,
  );
};

export interface NavigationChallengeSection {
  section: Nullable<ChallengeSkeleton>;
  challenges: ChallengeSkeleton[];
}

/**
 * Behold, the great challenge partitioning method!
 *
 * This method partitions a list of challenge into blocks of challenges by
 * section challenges which exist in the challenge list.
 *
 * It takes all challenges in a section, until the next section (or until
 * a non-challenge type is encountered) and groups them into a block. These
 * can then be rendered in a way that allow the sections to be separately
 * collapsed and expanded.
 *
 * The behavior may change in the future, especially around projects and
 * special topics.
 *
 * Sean is responsible for this!
 */
export const partitionChallengesBySection = (
  challengeList: ChallengeSkeletonList,
) => {
  const defaultSection: NavigationChallengeSection = {
    section: null,
    challenges: [],
  };

  let currentSection = defaultSection;
  let firstReachedSpecialTopics = false;
  let sections: NavigationChallengeSection[] = [];

  for (const challenge of challengeList) {
    const { type } = challenge;

    const SHOULD_END_SECTION = type === "section";
    const reachedSpecialTopics = type === "special-topic";

    const SPECIAL_TOPIC_BOUNDARY =
      reachedSpecialTopics && !firstReachedSpecialTopics;

    const CURRENT_SECTION_HAS_CONTENT =
      !!currentSection.section || currentSection.challenges.length > 0;

    if (SPECIAL_TOPIC_BOUNDARY) {
      if (CURRENT_SECTION_HAS_CONTENT) {
        sections = sections.concat(currentSection);
      }
      const nextSection: NavigationChallengeSection = {
        section: null,
        challenges: [challenge],
      };
      firstReachedSpecialTopics = true;
      currentSection = nextSection;
    } else if (SHOULD_END_SECTION) {
      if (CURRENT_SECTION_HAS_CONTENT) {
        sections = sections.concat(currentSection);
      }

      const nextSection: NavigationChallengeSection = {
        section: challenge,
        challenges: [],
      };
      currentSection = nextSection;
    } else {
      currentSection = {
        section: currentSection.section,
        challenges: currentSection.challenges.concat(challenge),
      };
    }
  }

  /* Add whatever last challenges remain and were not aggregated yet */
  sections = sections.concat(currentSection);

  return sections;
};

/**
 * Find a course by id in the course list.
 */
export const findCourseById = (courseId: string, courses: CourseList) => {
  const course = courses.find((c) => c.id === courseId);
  return course;
};

/**
 * Get a challenge id from a workspace url path.
 */
export const findChallengeIdInLocationIfExists = ({
  pathname,
}: Location): string => {
  return pathname.replace("/workspace/", "").split("/")[0];
};

/**
 * Given a course and a possible default challenge id, derive the course,
 * module, and challenge ids to set as active in the Workspace. Falls back
 * to sensible default options for course and module (the first one), but
 * challenge ID and slug can be null.
 */
export const deriveIdsFromCourseWithDefaults = (
  courses: CourseList,
  maybeChallengeId: Nullable<string> = null,
) => {
  const defaultCourse = courses[0];
  const challengeMap = createInverseChallengeMapping(courses);
  const challengeId = maybeChallengeId;

  let slug = challengeId;
  let courseId = defaultCourse.id;
  let moduleId = defaultCourse.modules[0].id;

  if (challengeId && challengeId in challengeMap) {
    courseId = challengeMap[challengeId].courseId;
    moduleId = challengeMap[challengeId].moduleId;
    slug = getChallengeSlug(challengeMap[challengeId].challenge);
  }

  return {
    slug,
    courseId,
    moduleId,
    challengeId,
  };
};

/**
 * Map the course skeletons when fetched in DEV mode. This just transforms
 * the skeletons so all the content is available in development.
 */
export const mapCourseSkeletonInDev = (courseSkeleton: CourseSkeleton) => {
  return {
    ...courseSkeleton,
    modules: courseSkeleton.modules.map((m) => {
      return {
        ...m,
        free: true,
        userCanAccess: true,
        challenges: m.challenges.map((c) => {
          return {
            ...c,
            userCanAccess: true,
          };
        }),
      };
    }),
  };
};

// Definition of specific types to identify different states for the
// initial app load:
export enum APP_INITIALIZATION_TYPE {
  DEFAULT = "DEFAULT",

  // Special types:
  SIGN_IN = "SIGN_IN",
  EMAIL_UPDATED = "EMAIL_UPDATED",
  ACCOUNT_CREATED = "ACCOUNT_CREATED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_CANCELLED = "PAYMENT_CANCELLED",
  PURCHASE_COURSE_FLOW = "PURCHASE_COURSE_FLOW",
  AUTHENTICATION_FAILURE = "AUTHENTICATION_FAILURE",
  ADMIN_PULL_REQUEST_VIEW = "ADMIN_PULL_REQUEST_VIEW",
}

// Check a list of param keys exists in the parsed query params from a url
const checkParamsExist = (params: ParsedQuery<string>, keys: string[]) => {
  for (const key of keys) {
    if (params[key] === undefined) {
      return false;
    }
  }

  return true;
};

// Parse the initial url and params which may have loaded the app and
// return the APP_INITIALIZATION_TYPE enum which specifically
// categorizes the app initialization type. This is then used to trigger
// other events in the app based on the initialization state.
export const parseInitialUrlToInitializationType = (
  path: string,
  params: ParsedQuery<string>,
): APP_INITIALIZATION_TYPE => {
  // A user authenticated:
  if (checkParamsExist(params, ["accessToken", "accountCreated"])) {
    if (params.accountCreated === "true") {
      return APP_INITIALIZATION_TYPE.ACCOUNT_CREATED;
    } else {
      return APP_INITIALIZATION_TYPE.SIGN_IN;
    }
  }

  // A user updated their email successfully:
  if (path === "/account" && checkParamsExist(params, ["emailUpdated"])) {
    if (params.emailUpdated === "true") {
      return APP_INITIALIZATION_TYPE.EMAIL_UPDATED;
    }
  }

  // There was some error during authentication.
  if (
    path === "/authentication-failure" &&
    checkParamsExist(params, ["strategy"])
  ) {
    return APP_INITIALIZATION_TYPE.AUTHENTICATION_FAILURE;
  }

  // A deep link into the payment flow, which also expects a courseId
  // param, e.g. https://app.pairwise.tech/purchase?courseId="fpvPtfu7s"
  if (path === "/purchase") {
    return APP_INITIALIZATION_TYPE.PURCHASE_COURSE_FLOW;
  }

  // A user returned from the checkout flow after cancelling:
  if (path === "/payment-cancelled") {
    return APP_INITIALIZATION_TYPE.PAYMENT_CANCELLED;
  }

  // A user returned from the checkout flow after payment success:
  if (path === "/payment-success" && checkParamsExist(params, ["courseId"])) {
    return APP_INITIALIZATION_TYPE.PAYMENT_SUCCESS;
  }

  // Admin user deep-linking to view a pull request diff
  if (
    path === "/admin/pull-request" &&
    checkParamsExist(params, ["pullRequestId"])
  ) {
    return APP_INITIALIZATION_TYPE.ADMIN_PULL_REQUEST_VIEW;
  }

  // Default category:
  return APP_INITIALIZATION_TYPE.DEFAULT;
};

// Format a date, e.g. 2020-02-15T13:10:18.920Z -> Saturday, February 15, 2020
export const formatDate = (rawDate: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const date = new Date(rawDate);
  const formatted = date.toLocaleDateString("en-US", options);
  return formatted;
};

export const logWhatChanged = (
  a: { [k: string]: any },
  b: { [k: string]: any },
) => {
  Object.keys(b)
    .filter((key) => {
      return a[key] !== b[key];
    })
    .forEach((key) => {
      const ax = a[key];
      const bx = b[key];
      console.log(
        "changed property:",
        key,
        "from",
        typeof ax === "function" ? "[FUNC A]" : ax,
        "to",
        typeof bx === "function" ? "[FUNC B]" : bx,
      );
    });
};

// Get an appropriate name and file extension for a challenge
export const getFileExtensionByChallengeType = (challenge: Challenge) => {
  const { type, title } = challenge;

  // Should format the name decently enough I think
  const name = title.replace(/ /g, "-").toLowerCase();

  // File extensions
  const HTML = "html";
  const REACT = "tsx";
  const TYPESCRIPT = "ts";
  const RUST = "rs";
  const PYTHON = "py";
  const GOLANG = "go";

  switch (type) {
    case "markup":
      return { name, ext: HTML };
    case "react":
      return { name, ext: REACT };
    case "typescript":
      return { name, ext: TYPESCRIPT };
    case "rust":
      return { name, ext: RUST };
    case "python":
      return { name, ext: PYTHON };
    case "golang":
      return { name, ext: GOLANG };
    case "media":
    case "section":
    case "project":
    case "guided-project":
    case "special-topic":
      return null;
    default:
      return assertUnreachable(type);
  }
};

/**
 * In the event parsing the Rust challenge test code fails, prepare a fallback
 * file for download.
 */
const assembleFallbackRustFile = (
  code: string,
  challenge: Challenge,
): string => {
  const fileString = `
/**
 * Pairwise Rust Challenge: ${challenge.title}
 * https://app.pairwise.tech/workspace/${challenge.id}
 *
 * There was an issue generating the test code for this challenge. Here is
 * the challenge code, in a runnable main function:
 */
fn main() -> () {
  // Challenge Code:
  ${code}

  return ();
}
`;

  return fileString;
};

/**
 * Assemble Rust challenge and test code into a runnable file, for download
 * and execution.
 */
const assembleRustFile = (
  code: string,
  testString: string,
  challenge: Challenge,
): string => {
  const fileString = `
/**
 * Pairwise Rust Challenge: ${challenge.title}
 * https://app.pairwise.tech/workspace/${challenge.id}
 * 
 * Note that some challenges will have additional tests which only run in the
 * Pairwise browser workspace environment, and some tests will just simply
 * return true (the only requirement is that the code compiles).
 * 
 * To run this file, create a new project with cargo (e.g. 'cargo new') and
 * paste all the contents here into the main.rs file. Then use the
 * 'cargo run' command to run this file.
 * 
 * Also, you may have to adjust the indentation/formatting of the code. A
 * helpful tool for this is CargoFmt: https://github.com/rust-lang/rustfmt
 */
fn pairwise_challenge() -> () {
  // User challenge code (change this for the challenge):
  ${code}

  // Test code (do not change this):
  ${testString}

  // Invoke test function:
  let test_result: bool = test();

  // The result should be true:
  assert_eq!(test_result, true);

  println!("\\n- Challenge passes the tests: {}", test_result);
  return ();
}

// Run the challenge + test code with helpful logging:
fn main() {
  println!("\\n- Running tests for challenge: ${challenge.title}");
  println!("- Code log output:\\n");
  pairwise_challenge();
  println!("- Test run complete, exiting.\\n");
}`;

  return fileString;
};

// Get an appropriate name and file extension for a challenge
export const getCodeForFileExport = (
  code: string,
  challenge: Challenge,
): string => {
  const { type, testCode } = challenge;

  switch (type) {
    case "markup":
    case "react":
    case "typescript":
    case "python":
    case "golang": {
      return code;
    }
    case "rust": {
      /**
       * For Rust challenges try to assembly the test code into a full
       * runnable file, in case folks want to evaluate these on their local
       * machines and interact with the compiler more directly.
       */
      try {
        const identifier = RUST_TEST_STRING_IDENTIFIER;
        const initialIndex = testCode.indexOf("const TEST_STRING = `");
        const startIndex = initialIndex + identifier.length + 1;
        const endIndex = testCode.indexOf("`;");
        const rustTestString = testCode.slice(startIndex, endIndex);
        const rustCode = assembleRustFile(code, rustTestString, challenge);
        return rustCode;
      } catch (err) {
        console.warn(
          "[WARNING]: Failed to parse test code for Rust challenge file download, challenge id: ",
          challenge.id,
        );
        return assembleFallbackRustFile(code, challenge);
      }
    }
    case "media":
    case "section":
    case "project":
    case "guided-project":
    case "special-topic":
      return "No challenge tests.";
    default:
      return assertUnreachable(type);
  }
};

// Copy some text to the clipboard
export const copyToClipboard = (text: string) => {
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};

/**
 * Convert an email address to the Gravatar supported avatar link.
 *
 * See details here: https://en.gravatar.com/site/implement/hash/
 */
export const getGravatarUrlFromEmail = (email: string): string => {
  const hash = md5(email.trim().toLowerCase());
  return `https://s.gravatar.com/avatar/${hash}?s=80`;
};

/**
 * Determine if a user avatar URL is using Gravatar using a simple match
 * against the URL.
 */
export const isUsingGravatar = (avatarUrl?: string): boolean => {
  return !!avatarUrl && avatarUrl.includes("gravatar.com");
};

type OS = "Mac" | "iOS" | "Windows" | "Android" | "Linux";

/**
 * Determine client OS, code from this StackOverflow post:
 * https://stackoverflow.com/questions/38241480/detect-macos-ios-windows-android-and-linux-os-with-js
 */
export const getClientOS = (): Nullable<OS> => {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const macPlatforms = new Set(["Macintosh", "MacIntel", "MacPPC", "Mac68K"]);
  const windowsPlatforms = new Set(["Win32", "Win64", "Windows", "WinCE"]);
  const iosPlatforms = new Set(["iPhone", "iPad", "iPod"]);
  let os: Nullable<OS> = null;

  if (macPlatforms.has(platform)) {
    os = "Mac";
  } else if (iosPlatforms.has(platform)) {
    os = "iOS";
  } else if (windowsPlatforms.has(platform)) {
    os = "Windows";
  } else if (/Android/.test(userAgent)) {
    os = "Android";
  } else if (!os && /Linux/.test(platform)) {
    os = "Linux";
  }

  return os;
};

/**
 * Determine if a challenge is an alternate language challenge which
 * requires custom code execution support.
 */
export const isAlternateLanguageChallenge = (challenge: Challenge): boolean => {
  const { type } = challenge;
  return type === "rust" || type === "python" || type === "golang";
};

/**
 * Capitalize a string.
 */
export const capitalize = (text: string) => {
  return text[0].toUpperCase() + text.slice(1);
};

export const SANDBOX_TYPE_CHOICES: ChallengeTypeOption[] = [
  { value: "markup", label: "HTML/CSS" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
];

/**
 * Validate a possible sandbox challenge type.
 */
export const isValidSandboxChallengeType = (
  type: any,
): Nullable<CHALLENGE_TYPE> => {
  const item = SANDBOX_TYPE_CHOICES.find((x) => x.value === type);
  return item !== undefined ? item.value : null;
};

/**
 * Default the editor theme to match the app theme.
 */
export const getMonacoTheme = (
  appTheme: AppTheme,
  editorTheme: MonacoEditorThemes,
) => {
  let theme = editorTheme;

  if (theme === MonacoEditorThemes.DEFAULT) {
    if (appTheme === "dark") {
      theme = MonacoEditorThemes.DARK;
    } else {
      theme = MonacoEditorThemes.LIGHT;
    }
  }

  return theme;
};

/** ===========================================================================
 * Utils
 * ============================================================================
 */

/**
 * Map portfolio skill tags to the associated devicon className.
 *
 * Reference: https://devicon.dev
 */
export const mapSkillToDeviconClassName = (
  skill: PortfolioSkills,
  theme: AppTheme,
): string => {
  const isDark = theme === "dark";

  switch (skill) {
    case PortfolioSkills.HTML:
      return "devicon-html5-plain colored";

    case PortfolioSkills.CSS:
      return "devicon-css3-plain colored";

    case PortfolioSkills.TypeScript:
      return "devicon-typescript-plain colored";

    case PortfolioSkills.Git:
      return "devicon-git-plain colored";

    case PortfolioSkills.GitHub:
      if (isDark) {
        return "devicon-github-original-wordmark";
      } else {
        return "devicon-github-original-wordmark colored";
      }

    case PortfolioSkills.React:
      return "devicon-react-original colored";

    case PortfolioSkills.NodeJS:
      return "devicon-nodejs-plain colored";

    case PortfolioSkills.Express:
      if (isDark) {
        return "devicon-express-original-wordmark";
      } else {
        return "devicon-express-original-wordmark colored";
      }

    case PortfolioSkills.PostgreSQL:
      return "devicon-postgresql-plain-wordmark colored";

    case PortfolioSkills.Jest:
      return "devicon-jest-plain colored";

    case PortfolioSkills.Docker:
      return "devicon-docker-plain-wordmark colored";

    default:
      assertUnreachable(skill);
  }
};
