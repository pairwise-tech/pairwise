#!/usr/bin/env node

const shortid = require("shortid");

// Restrict shortid to only friendly-looking characters for nicer-looking ids
shortid.characters(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@",
);

const main = () => {
  return (
    JSON.stringify(
      {
        id: shortid.generate(),
        type: "markup",
        title: "[UNTITLED]",
        instructions: "Write some **markdown**...",
        starterCode:
          "// Write in an editor and use scripts/stringify-clipboard.sh, then copy into here",
        solutionCode: "",
        testCode: JSON.stringify([
          {
            test:
              "(function() { const el = document.querySelector('p'); return el.innerText !== ''; })()",
            message: "There should be a p tag with some text",
          },
        ]),
        content: "Placeholder supplementary content...",
      },
      null,
      2,
    ) + ","
  );
};

console.log(main());
