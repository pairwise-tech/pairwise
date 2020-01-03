### Cypress e2e Test Suite

A full end to end test suite for the entire application using Cypress.

This test suite can be run using Docker from the root directory.

### Development

To add new tests, or debug failing tests, the test suite can be run locally:

```bash
# Run the backend services (from the root level)
$ docker-compose up

# Run the client app, e.g.
$ yarn client:dev

# Run the Cypress tests here:
$ yarn cypress:open
```

With the tests and app running, you can make changes and add new tests.
