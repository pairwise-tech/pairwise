const fs = require("fs");

const users = "pairwise-users.json";
const fullstackTypeScript =
  "packages/common/src/courses/01_fullstack_typescript.json";

const json = JSON.parse(fs.readFileSync(users, "utf8"));
const courseJSON = JSON.parse(fs.readFileSync(fullstackTypeScript, "utf8"));

/** ===========================================================================
 * Growth Stats Script
 * ----------------------------------------------------------------------------
 * This is a very ad-hoc script to tally up various user/growth stats and
 * user/course progress visualizations for quick reference. The code is
 * written quickly and not necessarily well designed.
 * ============================================================================
 */

const block = "█";
const values = {};

const CHALLENGE_SPACER = 5;
const COURSE_SPACER = 10;
const LEADER_COUNT = 10;

const stats = json.stats;
let maxChallengeProgress = 0;
let maxCourseProgress = 0;
let maxY = 0;
let totalChallenges = 0;
let userCount = json.users.length;
let zeroChallengeUsers = 0;
let powerUsers = 0;
let scalingFactor = 10;

const leaderboard = {};
const ChallengeMap = new Map();

// Reduce all the challenges into an ordered list by challenge id
for (const m of courseJSON.modules) {
  for (const c of m.challenges) {
    ChallengeMap.set(c.id, 0);
  }
}

const totalCourseChallenges = ChallengeMap.size;

// Tally up all the users by completed challenge count
for (const user of json.users) {
  const { total } = user.completedChallenges;

  // Tally leaders with names
  const name = user.displayName ? `${user.displayName}` : "no name";
  leaderboard[total] = `${user.email} (${name})`;

  if (total >= 50) {
    powerUsers++;
  }

  // Count all challenges
  values[total] = (values[total] || 0) + 1;
  maxY = Math.max(maxY, total);
  totalChallenges += total;
  if (total === 0) {
    userCount--;
    zeroChallengeUsers++;
  }

  // Tally up all completed challenge ids
  for (const id of user.completedChallengeIds) {
    if (ChallengeMap.has(id)) {
      const count = ChallengeMap.get(id) || 0;
      ChallengeMap.set(id, count + 1);
    }
  }
}

let average = totalChallenges / userCount;

let x = 0;
let current = -1;
let challengeSummary = {};

// Truncate into blocks for easier visualization
while (current < maxY) {
  current++;

  if (current in values) {
    challengeSummary[x] = (challengeSummary[x] || 0) + values[current];
  }

  if (current % CHALLENGE_SPACER === 0) {
    x += CHALLENGE_SPACER;
  }
}

x = 0;
current = 0;
let courseSummary = {};

// Truncate into blocks for easier visualization
for (const [_, v] of ChallengeMap) {
  current++;

  courseSummary[x] = (courseSummary[x] || 0) + v;

  if (current % COURSE_SPACER === 0) {
    x += COURSE_SPACER;
  }
}

const userProgressData = Object.entries(challengeSummary).reverse();
const courseProgressData = Object.entries(courseSummary).reverse();

// Get the max completed in the truncated
for (const [_, y] of userProgressData) {
  maxChallengeProgress = Math.max(maxChallengeProgress, y);
}

// Get the max completed in the truncated blocks
for (const [_, y] of courseProgressData) {
  maxCourseProgress = Math.max(maxCourseProgress, y);
}

// Helper to space values evenly
const space = (value, spaceBefore = true) => {
  let space = "";
  if (value < 10) {
    space = "  ";
  } else if (value < 100) {
    space = " ";
  }

  if (spaceBefore) {
    return `${space + value}`;
  } else {
    return `${value + space}`;
  }
};

/** ===========================================================================
 * Print Out Results
 * ============================================================================
 */

console.log("");
console.log("- Stats:");
console.log("");

console.log(`- Total Users: ${stats.totalUsers}`);
console.log(`- Weekly User Growth: ${stats.newUsersInLastWeek}`);
console.log(
  `- Total Challenges Completed: ${totalChallenges.toLocaleString()}`,
);
console.log(
  `- Challenges Completed in Last Week: ${stats.challengesCompletedInLastWeek}`,
);
console.log(
  `- Average Challenges/User (excluding zero challenge users): ${average.toFixed(
    0,
  )}`,
);
console.log(`- Power Users (50+ Challenges Completed): ${powerUsers}`);
console.log(`- Top Leader: ${json.leaderboard.leaderChallengeCount}`);
console.log(`- No Email Users: ${stats.usersWithoutEmail}`);
console.log(`- Zero Challenge Users: ${zeroChallengeUsers}`);
console.log(
  `- Total Challenges in FullStack TypeScript Course: ${totalCourseChallenges.toLocaleString()}`,
);

const leaders = Object.entries(leaderboard)
  .reverse()
  .slice(0, LEADER_COUNT);

console.log("");
console.log("- Leaderboard:");
console.log("");

let position = 1;
for (const [score, name] of leaders) {
  console.log(`${space(position)}: ${name}, score: ${score}`);
  position++;
}

console.log("\n- User Challenge Progress Distribution:\n");

// Print out the user progress distribution to the console
for (const [x, y] of userProgressData) {
  const gap = maxChallengeProgress - y;
  const suffix = `${" ".repeat(gap)} ${y}`;

  if (x === "0") {
    console.log(`    ${space(x)}  :  ${block.repeat(y)} ${suffix}`);
  } else {
    const count = `${space(x - 4)} - ${space(x, false)}`;
    console.log(`${count}:  ${block.repeat(y)} ${suffix}`);
  }
}

console.log("\n- Overall Course Progress Distribution:\n");

// Print out the course progress distribution to the console
for (const [x, y] of courseProgressData) {
  const width = Math.floor(y / scalingFactor);
  const gap = Math.floor(maxCourseProgress / scalingFactor) - width;
  const suffix = `${y < 10 ? "" : " "}${" ".repeat(gap)} ${y}`;
  const item = y < 10 ? "▍" : block.repeat(width);
  const count = `${space(+x + 1)} - ${space(+x + COURSE_SPACER, false)}`;
  console.log(`${count}:  ${item}   ${suffix}`);
}

console.log("");
