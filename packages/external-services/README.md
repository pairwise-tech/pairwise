# Pairwise External Services

This package contains a simple Express server which provides API endpoints representing 3rd party external service APIs using by the Pairwise application. These are used for mocking the behavior of these APIs for testing and development purposes.
This server runs when the `e2e` or `cypress` tests are running in order to test the full application.

## Getting Started

```bash
# Run the server in watch mode
$ yarn watch

# Run the server
$ yarn build && yarn start

# Run the package tests
$ yarn test
```
