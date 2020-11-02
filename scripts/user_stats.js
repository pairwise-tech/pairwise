const fs = require("fs");

const users = "pairwise-users.json";
const course = "packages/common/src/courses/01_fullstack_typescript.json";

const json = JSON.parse(fs.readFileSync(users, "utf8"));
const courseJSON = JSON.parse(fs.readFileSync(course, "utf8"));

const ChallengeMap = new Map();

for (const m of courseJSON.modules) {
  for (const c of m.challenges) {
    ChallengeMap.set(c.id, 0);
  }
}

console.log(ChallengeMap);

const totalCourseChallenges = ChallengeMap.size;

/** ===========================================================================
 * Tally up some stats on user data
 * ============================================================================
 */

const block = "█";
const values = {};

const SPACER = 5;
const LEADER_COUNT = 10;

const stats = json.stats;
let maxX = 0;
let maxY = 0;
let totalChallenges = 0;
let userCount = json.users.length;
let zeroChallengeUsers = 0;
let powerUsers = 0;

const leaderboard = {};

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
}

let average = totalChallenges / userCount;

let x = 0;
let chart = {};
let current = -1;

// Truncate into blocks of 5
while (current < maxY) {
  current++;

  if (current in values) {
    chart[x] = (chart[x] || 0) + values[current];
  }

  if (current % SPACER === 0) {
    x += SPACER;
  }
}

const data = Object.entries(chart).reverse();

// Get the max completed in the truncated blocks
for (const [x, y] of data) {
  maxX = Math.max(maxX, y);
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
 * Print out results
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
  `- Average Challenges/User (excluding zero challenge users): ${average.toFixed(
    0,
  )}`,
);
console.log(
  `- Challenges Completed in Last Week: ${stats.challengesCompletedInLastWeek}`,
);
console.log(
  `- Total Challenges in Course: ${totalCourseChallenges.toLocaleString()}`,
);
console.log(`- Top Leader: ${json.leaderboard.leaderChallengeCount}`);
console.log(`- Power Users (50+ Challenges Completed): ${powerUsers}`);
console.log(`- No Email Users: ${stats.usersWithoutEmail}`);
console.log(`- Zero Challenge Users: ${zeroChallengeUsers}`);

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

// Print out the data to the console
for (const [x, y] of data) {
  const gap = maxX - y;
  const suffix = `${" ".repeat(gap)} ${y}`;

  if (x === "0") {
    console.log(`    ${space(x)}  :  ${block.repeat(y)} ${suffix}`);
  } else {
    const count = `${space(x - 4)} - ${space(x, false)}`;
    console.log(`${count}:  ${block.repeat(y)} ${suffix}`);
  }
}

console.log("");
