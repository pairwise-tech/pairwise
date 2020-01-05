# Pairwise Cypress Test Suite

A full end to end test suite for the entire application using Cypress, which runs against the actual backend. This test suite can be run using Docker from the root directory, and runs in CI for pull requests and deploys.

## Development

To add new tests, or debug failing tests, the test suite can be run locally:

```bash
# Run the backend services (from the root level)
$ docker-compose up

# Run the client app, e.g.
$ yarn client:dev

# Run the Cypress tests here:
$ yarn cypress:open
```

With the tests and app running, you can make changes and add new tests. For more details on using Cypress and funny assertions like `expect('test').to.have.length.of.at.most(4)`, you can [see their documentation](https://docs.cypress.io/guides/overview/why-cypress.html).

## Organization

The folder organization follows the suggested Cypress folder structure, with tests suffixed by `.spec.ts` in the `src/integration` folder, and other test utils in the `src/support` folder.
