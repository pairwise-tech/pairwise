const fs = require("fs");

const json = JSON.parse(fs.readFileSync("pairwise-users.json", "utf8"));

const block = "█";
const values = {};

let maxX = 0;
let maxY = 0;
let totalChallenges = 0;
let userCount = json.users.length;

// Tally up all the users by completed challenge count
for (const user of json.users) {
  const { total } = user.completedChallenges;
  values[total] = (values[total] || 0) + 1;
  maxY = Math.max(maxY, total);
  totalChallenges += total;
  if (total === 0) {
    userCount--;
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

  if (current % 5 === 0) {
    x += 5;
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
console.log(
  `- Total Challenges Completed: ${totalChallenges.toLocaleString()}`,
);
console.log(
  `- Average Challenges/User (excluding 0 challenge users): ${average.toFixed(
    0,
  )}`,
);
console.log("");
