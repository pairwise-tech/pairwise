#!/usr/bin/env node

const shortid = require("shortid");

const main = () => {
  return (
    JSON.stringify(
      {
        id: shortid.generate(),
        type: "markup",
        title: "[UNTITLED]",
        content: "Write some **markdown**...",
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
        supplementaryContent: "Placeholder supplementary content...",
      },
      null,
      2,
    ) + ","
  );
};

console.log(main());
