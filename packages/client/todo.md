_Things not done yet for the challenge workspace:_

### HARD:

- [ ] Build Codepress!
- [~] Type definition files: see codesandbox source code which dynamically
  fetches and inserts @types/ dependencies for modules.
- [~] Fetch import modules dynamically: unknown ~
  - I think on these first two points we should just hard code the
    libraries we support for the challenges. There is no reason for
    someone to import other libraries in the challenges. Hard coding
    these fixed dependencies and their type definitions will be
    dramatically easier than building some generic system to dynamically
    fetch them.
- [ ] Ability to run React Native challenges: should be possible by importing
      react-native-web and creating a "mobile-like" preview view
- [!] Ability to run NodeJS challenges (e.g. fs, express, etc.): may be
  possible by mocking the specific functions we want to provide
  testing for.
- [!] Ability to run database challenges, (e.g. SQL, Mongo, etc.): may
  require a fixed backend environment to run database queries against,
  the queries could be run in atomic transactions which are always
  rolled back to preserve a consistent database state.
- [!] Secure iframe environment from infinite loops and other unsafe code, e.g.
  remove alert, confirm, and other global functions from the user's code,
  securing from infinite loops may require using a web worker to execute
  the code.

### EASIER:

- [ ] Test async code challenges
- [ ] Markdown support in challenge content and test results
- [ ] Improve theme styling for code editor (multi theme support?)
- [ ] cmd+enter should run code but not enter a new line in the editor
- [ ] Syntax/compilation errors should be reported to the workspace console
- [ ] Challenge and tests content should scroll if overflowing the resizable
      container grid they are in.

### DONE:

- [x] TSX syntax highlighting
- [x] TSX syntax support in monaco editor
- [x] Ability to test React challenges
- [x] Include console warn and info in console method overrides
- [x] Don't show test console output in workspace console window
