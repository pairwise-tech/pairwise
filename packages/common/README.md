# Pairwise Common

This package contains common resources, utilities, and type definitions shared across the Pairwise codebase. This package is distributed locally using Lerna and modules can be imported like this: `import { IUserDto, Ok, Result } from "@pairwise/common";`.

To run the project locally:

```bash
# Run the TypeScript compiler in watch mode
$ yarn watch

# Build the project
$ yarn build

# Run the package tests
$ yarn test
```

If you are developing other packages locally which import from `@pairwise/common` you will need to build this package locally to import the updated modules. The easiest way to do this is to run `yarn watch` to rebuild this package whenever the code changes. You may need to refresh the application you are using (e.g. client, server, etc.) for the changes to be picked up.
