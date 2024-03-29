import { assertUnreachable, getChallengeSlug } from "../tools/utils";

describe("Tools > Utils", () => {
  test("assertUnreachable", () => {
    expect(() => {
      const value = { value: "some value " };
      assertUnreachable(value as never);
    }).toThrow();
  });

  // To test this I just brought in the first 100 challenges. We could use
  // snapshot testing, but I was worried we might accidentally update the
  // snapshots and miss something. If these tests are going to change we want to
  // be sure about it, since these are our URLs
  test("getChallengeSlug", () => {
    const slugTests = [
      { id: "iSF4BNIl", title: "Hello, Pairwise!" },
      { id: "Oqha$qtc", title: "Style HTML with CSS" },
      { id: "Sbb4Nf76s", title: "Start Programming" },
      { id: "yxZjmD0o", title: "Welcome to Pairwise! 🎉" },
      { id: "IEC6FcKI", title: "Intro" },
      { id: "5ziJI35f", title: "HTML, the Language of the Web" },
      { id: "9scykDold", title: "The h1 Tag" },
      { id: "9scykdziW", title: "HTML Heading Tags" },
      { id: "9scykuYtf", title: "Nesting Tags" },
      { id: "MNNx8m4XV", title: "The Span Tag" },
      { id: "rOuaLSaYV", title: "Divs!" },
      { id: "SB9wO2H4z", title: "Divs, Divs, Divs!" },
      { id: "C76VHWFEt", title: "Links" },
      { id: "TaV@i63z8", title: "Entering Text with Input Tags" },
      { id: "Fnru9fJsk", title: "The Label Tag" },
      { id: "6hRkTDrSu", title: "Forms" },
      { id: "e@rWfBJRk", title: "Textarea" },
      { id: "kp3HVbx$L", title: "The Select Tag" },
      { id: "f4zGLmWO2", title: "Buttons" },
      { id: "Ba5aAVqP", title: "An HTML Portfolio" },
      { id: "Uf6xcgQtW", title: "Checkpoint" },
      { id: "CuwykKRM", title: "Enter CSS" },
      { id: "ny51KoEI", title: "Style Some Text" },
      { id: "KlxN3f11", title: "Changing Colors" },
      { id: "wCrQh1f4", title: "Highlighting Text" },
      { id: "5oqm6GmH", title: "The div Tag — Putting Things in Boxes" },
      { id: "2kQ6adnb", title: "CSS Classes" },
      { id: "za5KHMo7", title: "Styles Within Styles" },
      { id: "3g8czfBn", title: "Multiple Selectors — Styling Many Things" },
      { id: "0CUYA6z5m", title: "Debugging CSS" },
      { id: "B1LBriGU", title: "The Box Model" },
      { id: "nel5ggJ1", title: "Box Sizing Border Box" },
      { id: "WqwXPsOO", title: "Margins and Centering Things on the Page" },
      { id: "Ojsg01Bi", title: "Padding and inline-blocks" },
      { id: "0fCd6MkU", title: "Borders" },
      { id: "s8be1H0U", title: "Columns and Rows — The Display Property" },
      { id: "iFvzasqW", title: "Flexbox — Creating an Evenly-Spaced nav Menu" },
      { id: "iZ6nlkiQ", title: "The Hover State" },
      { id: "fAGpsa4L", title: "CSS is not Always Intuitive" },
      { id: "zt2RAhbC", title: "CSS Positioning " },
      { id: "$TscTvcd", title: "CSS Positioning: Absolute" },
      { id: "kUhWPOkj", title: "Top, Left, Bottom, Right" },
      { id: "BLEmRiRd", title: "Revisiting the Display Property" },
      { id: "Ao8hbaiP", title: "CSS Transforms" },
      { id: "kphKEurPG", title: "Projects" },
      { id: "GiZqL4Jpk", title: "Create a Webpage" },
      { id: "CtxaGAJoJ", title: "Create a Mobile UI" },
      { id: "nVAILxovd", title: "Create a Tic Tac Toe Board" },
      { id: "kbllMGDEL3", title: "Create a Calculator" },
      { id: "DDOHTQQC", title: "Guided Projects" },
      { id: "LROl5K9R", title: "Create a Webpage Guided Project" },
      { id: "iwszDGGy", title: "Create a Mobile UI Guided Project" },
      { id: "sfxItMSR", title: "Create a Tic Tac Toe Board Guided Project" },
      { id: "Fpw0qzGv", title: "Create a Calculator Guided Project" },
      { id: "4rq4ezCu", title: "Special Topics" },
      { id: "8YMC6xUd", title: "Getting Your Site Online" },
      { id: "C$3mo2yQ", title: "The Document Object Model" },
      { id: "DUVDDO97", title: "Inline Styles" },
      { id: "e3mgVBucq", title: "Web Accessibility" },
      { id: "wsATIwe9M", title: "CSS Units" },
      { id: "2qKcNab8", title: "Intro" },
      { id: "AvOR6cM4o", title: "The TypeScript Language" },
      { id: "OM9Y1SvnG", title: "TypeScript in Action" },
      { id: "UZG$5V862", title: "Compilation" },
      { id: "vf8UoQalQ", title: "Keywords" },
      { id: "k3ljxZpDx", title: "Practice with Keywords" },
      { id: "2EnIHyp9S", title: "Whitespace and Semicolons" },
      { id: "YUeIPBR0M", title: "Format the Code!" },
      { id: "s9RpoVOt2", title: "Comments" },
      { id: "bf1g0r$bL", title: "Comment the Code!" },
      { id: "aMuPir571", title: "Comment a Function" },
      { id: "DFlhdsLoO", title: "Well Written Code" },
      { id: "8p4BZqPl", title: "Logging and Debugging" },
      { id: "5mpYgBmX", title: "Logging Values" },
      { id: "RL6JBhYL", title: "Console Warn and Error" },
      { id: "pqwU3tyw", title: "Console Info" },
      { id: "Y$6fSREp", title: "Debugging" },
      { id: "jaZYVeNS", title: "Debugging Skills" },
      { id: "7llHMoYzK", title: "Errors and Error Handling" },
      { id: "58fZQwoQA", title: "The Throw Keyword" },
      { id: "CoUCabHwR", title: "The Catch Keyword" },
      { id: "TiacxGwtm", title: "Catching Errors" },
      { id: "C8I5vca4a", title: "Try/Catch" },
      { id: "wesvb7Sd1", title: "Error Handling and Clean Code" },
      { id: "0gih2c1M", title: "Types and Type Primitives" },
      { id: "w3bc0PeO", title: "Numbers" },
      { id: "UnMCiU0Z", title: "Strings" },
      { id: "qNF6Faom", title: "Booleans" },
      { id: "p2Iu3bYN", title: "Null and Undefined" },
      { id: "7CDlUIz9", title: "Type Inference" },
      { id: "Q2hgPS5P", title: "Inference in Action" },
      { id: "qYQ8GOYvW", title: "What Type is This?" },
      { id: "VppIs2a7", title: "Being Explicit with Type Annotations" },
      { id: "AB2T4DCt", title: "Fix Me!" },
      { id: "VpxIs2a9", title: "Type Inference vs. Explicit Types" },
      { id: "xLJj8XiU", title: "The Any Type" },
      { id: "KbkT6v8g", title: "Any in Action" },
      { id: "UNWwhyHW", title: "Variables & Assignment" },
      { id: "JALDb575", title: "Declare a Variable" },
      { id: "LyQWstvV", title: "Declaring Typed Variables" },
    ];
    expect(slugTests.map(getChallengeSlug)).toEqual([
      "iSF4BNIl/hello-pairwise",
      "Oqha$qtc/style-html-with-css",
      "Sbb4Nf76s/start-programming",
      "yxZjmD0o/welcome-to-pairwise",
      "IEC6FcKI/intro",
      "5ziJI35f/html-the-language-of-the-web",
      "9scykDold/the-h1-tag",
      "9scykdziW/html-heading-tags",
      "9scykuYtf/nesting-tags",
      "MNNx8m4XV/the-span-tag",
      "rOuaLSaYV/divs",
      "SB9wO2H4z/divs-divs-divs",
      "C76VHWFEt/links",
      "TaV@i63z8/entering-text-with-input-tags",
      "Fnru9fJsk/the-label-tag",
      "6hRkTDrSu/forms",
      "e@rWfBJRk/textarea",
      "kp3HVbx$L/the-select-tag",
      "f4zGLmWO2/buttons",
      "Ba5aAVqP/an-html-portfolio",
      "Uf6xcgQtW/checkpoint",
      "CuwykKRM/enter-css",
      "ny51KoEI/style-some-text",
      "KlxN3f11/changing-colors",
      "wCrQh1f4/highlighting-text",
      "5oqm6GmH/the-div-tag-putting-things-in-boxes",
      "2kQ6adnb/css-classes",
      "za5KHMo7/styles-within-styles",
      "3g8czfBn/multiple-selectors-styling-many-things",
      "0CUYA6z5m/debugging-css",
      "B1LBriGU/the-box-model",
      "nel5ggJ1/box-sizing-border-box",
      "WqwXPsOO/margins-and-centering-things-on-the-page",
      "Ojsg01Bi/padding-and-inlineblocks",
      "0fCd6MkU/borders",
      "s8be1H0U/columns-and-rows-the-display-property",
      "iFvzasqW/flexbox-creating-an-evenlyspaced-nav-menu",
      "iZ6nlkiQ/the-hover-state",
      "fAGpsa4L/css-is-not-always-intuitive",
      "zt2RAhbC/css-positioning",
      "$TscTvcd/css-positioning-absolute",
      "kUhWPOkj/top-left-bottom-right",
      "BLEmRiRd/revisiting-the-display-property",
      "Ao8hbaiP/css-transforms",
      "kphKEurPG/projects",
      "GiZqL4Jpk/create-a-webpage",
      "CtxaGAJoJ/create-a-mobile-ui",
      "nVAILxovd/create-a-tic-tac-toe-board",
      "kbllMGDEL3/create-a-calculator",
      "DDOHTQQC/guided-projects",
      "LROl5K9R/create-a-webpage-guided-project",
      "iwszDGGy/create-a-mobile-ui-guided-project",
      "sfxItMSR/create-a-tic-tac-toe-board-guided-project",
      "Fpw0qzGv/create-a-calculator-guided-project",
      "4rq4ezCu/special-topics",
      "8YMC6xUd/getting-your-site-online",
      "C$3mo2yQ/the-document-object-model",
      "DUVDDO97/inline-styles",
      "e3mgVBucq/web-accessibility",
      "wsATIwe9M/css-units",
      "2qKcNab8/intro",
      "AvOR6cM4o/the-typescript-language",
      "OM9Y1SvnG/typescript-in-action",
      "UZG$5V862/compilation",
      "vf8UoQalQ/keywords",
      "k3ljxZpDx/practice-with-keywords",
      "2EnIHyp9S/whitespace-and-semicolons",
      "YUeIPBR0M/format-the-code",
      "s9RpoVOt2/comments",
      "bf1g0r$bL/comment-the-code",
      "aMuPir571/comment-a-function",
      "DFlhdsLoO/well-written-code",
      "8p4BZqPl/logging-and-debugging",
      "5mpYgBmX/logging-values",
      "RL6JBhYL/console-warn-and-error",
      "pqwU3tyw/console-info",
      "Y$6fSREp/debugging",
      "jaZYVeNS/debugging-skills",
      "7llHMoYzK/errors-and-error-handling",
      "58fZQwoQA/the-throw-keyword",
      "CoUCabHwR/the-catch-keyword",
      "TiacxGwtm/catching-errors",
      "C8I5vca4a/trycatch",
      "wesvb7Sd1/error-handling-and-clean-code",
      "0gih2c1M/types-and-type-primitives",
      "w3bc0PeO/numbers",
      "UnMCiU0Z/strings",
      "qNF6Faom/booleans",
      "p2Iu3bYN/null-and-undefined",
      "7CDlUIz9/type-inference",
      "Q2hgPS5P/inference-in-action",
      "qYQ8GOYvW/what-type-is-this",
      "VppIs2a7/being-explicit-with-type-annotations",
      "AB2T4DCt/fix-me",
      "VpxIs2a9/type-inference-vs-explicit-types",
      "xLJj8XiU/the-any-type",
      "KbkT6v8g/any-in-action",
      "UNWwhyHW/variables-assignment",
      "JALDb575/declare-a-variable",
      "LyQWstvV/declaring-typed-variables",
    ]);
  });
});
