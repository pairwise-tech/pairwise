const fs = require("fs");

const data = JSON.parse(fs.readFileSync("pairwise-users.json", "utf8"));

const getUserEmailWithoutPayment = () => {
  const usersWithPayment = data.users
    .filter(user => user.payments.length === 0)
    .map(user => user.email)
    .filter(Boolean);

  return usersWithPayment;
};

const writeToFile = (filename, data) => {
  const users = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, users, "utf-8");
  console.log(`\n- Wrote data to new file: ${filename}\n`);
};

const users = getUserEmailWithoutPayment();
writeToFile("user-emails.json", users);
