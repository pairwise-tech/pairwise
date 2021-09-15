### Pairwise e2e Test Suite

This package includes end to end test suites for Pairwise which are powered by [Jest](https://jestjs.io/) and [supertest](https://github.com/visionmedia/supertest).

These tests run directly against the Nest Server, so they are end to end tests for the server application and backend APIs. These are run using the command `yarn e2e` from the project root level and use Docker to deploy the various services required for the tests to run.

## Development

To add new tests, or debug failing tests, the test suite can be run locally:

```bash
# Run the backend services (from the root level)
$ yarn up

# Run the e2e tests in watch mode
$ yarn test:watch

# Run the test suite which tests the backend APIs which rely on Redis
$ yarn test:realtime

# Test features which rely on SocketIO
$ yarn test:socket-io

# Run seed data script which hits the APIs creating users and solving challenges
$ yarn seed

# Run the full e2e test suite which is run in CI/CD
$ yarn test:e2e
```

Note that the tests for realtime activity and SocketIO need to be run in isolation (not in conjunction with the other running tests). In addition, the realtime activity tests needs to be run against an empty Redis instance (or we should add an admin API which can clear Redis and employ that in the test suite).
