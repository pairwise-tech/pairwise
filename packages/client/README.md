# Pairwise Client Application

This is the Pairwise client application! This is the core product which provides the curriculum and workspace to users. This package also includes `codepress` which is an internal CMS tool for managing and writing course content. Codepress is built directly into the client application.

# Getting Started

```shell
# Run the application
$ yarn start:dev

# Run Codepress
$ yarn start:codepress

# Run the tests
$ yarn test

# Build the application
$ yarn build
```

# Tests

The unit tests for this package includes a test suite to test all of the challenges solution code against their test code. You can see it in `Torvalds.test.ts`.

# HTTPS for Local Development

Visit chrome://flags/#allow-insecure-localhost in Chrome and enable the option to prevent warnings about insecure https on localhost.
