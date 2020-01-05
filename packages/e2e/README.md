### Pairwise e2e Test Suite

This package includes end-to-end test suites for Prototype X which are powered by [Jest](https://jestjs.io/) and [supertest](https://github.com/visionmedia/supertest).

## Development

To add new tests, or debug failing tests, the test suite can be run locally:

```bash
# Run the backend services (from the root level)
$ docker-compose up

# Run the e2e tests in watch mode
$ yarn test:watch
```
