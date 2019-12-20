#!/usr/bin/env node

const shortid = require("shortid");

const obj = {
  id: "6T3GXc4ap",
  type: "typescript",
  title: "Add Two Numbers",
  content:
    "Complete the function body below. The function should receive two numbers as input arguments and return the result of adding these numbers together.",
  starterCode:
    "\nconst addTwoNumbers = (a: number, b: number) => {\n  // Edit code here\n}\n\nconst result = addTwoNumbers(10, 20);\nconsole.log(result);\n\n// Do not edit code below this line\nconst main = addTwoNumbers;\n",
  solutionCode:
    "\nconst addTwoNumbers = (a: number, b: number) => {\n  return a + b;\n}\n\nconst result = addTwoNumbers(10, 20);\nconsole.log(result);\n\n// Do not edit code below this line\nconst main = addTwoNumbers;\n",
  testCode:
    '[{"input":[1,2],"expected":3},{"input":[10,50],"expected":60},{"input":[-10,-50],"expected":-60},{"input":[100,500],"expected":600},{"input":[1123,532142],"expected":533265},{"input":[-10,50],"expected":40},{"input":[1,500],"expected":501},{"input":[842,124],"expected":966},{"input":[1000,500],"expected":1500},{"input":[-100,100],"expected":0},{"input":[2,50234432],"expected":50234434}]',
  supplementaryContent: "Placeholder supplementary content...",
};

const main = () => {
  return (
    JSON.stringify(
      {
        id: shortid.generate(),
        type: "markup",
        title: "[UNTITLED]",
        content: "Write some **markdown**...",
        starterCode:
          "# Write in an editor and use scripts/stringify-clipboard.sh, then copy into here",
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
