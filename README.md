# Welcome to Pairwise!

The **Pairwise** codebase includes a React app client application, a NestJS server application, and other various services, all organized in a monorepo using Lerna.

## Structure

This project is managed using Lerna, and contains the following packages:

| Package           | Description                                       |
| ----------------- | ------------------------------------------------- |
| client            | React client application                          |
| common            | Shared code, utils, and types                     |
| cypress           | Cypress end-to-end test suite                     |
| e2e               | End-to-end test suite                             |
| external-services | Express server to mock 3rd party APIs for testing |
| server            | NestJS backend application                        |
| www               | Marketing website built with Gatsby               |

## Development

To run the app you will need Docker and Node installed. All of the packages tend to have commands of the structure `[package]:[dev|start|watch|build|prod]` so you can generally modify the following scripts depending on how you want to start different packages.

Some setup steps you will need to run after cloning the repo:

```bash
# Install dependencies
$ lerna bootstrap

# Create .env files in relevant packages
$ yarn setup

# Build all packages
$ yarn build

# Start the database
$ yarn db

# Run server setup (environment variables and database migrations)
$ yarn server:setup
```

To run all the services separately:

```bash
# Start the database
$ yarn db

# Start the server
$ yarn server:dev

# Start the client
$ yarn client:dev

# (Optional) Run the common package
$ yarn common:watch

# (Optional) Run the external services
$ yarn services:watch
```

To run the backend application (database, server, and external services). This can be useful when just developing the client application, or when working on Cypress tests.

```bash
# Build the Docker image which has all dependencies installed
$ yarn docker:build

# Run the application with Docker Compose
$ yarn up

# Run the client app
$ yarn client:dev
```

## Running Tests

Please note that there is a separate Dockerfile, `DockerfileBase`, which builds an image containing all dependencies for the project. This can be built using `yarn docker:build` and is used by various `docker-compose` commands. You should build this first, and only rebuild it if some project dependencies have changed and need to be re-installed.

```bash
# Use Lerna to run the test script for each package
$ yarn test

# Build the Docker image which has all dependencies installed
$ yarn docker:build

# Run the e2e test suite (be sure to run docker:build first)
$ yarn e2e

# Run the Cypress end to end test suite (be sure to run docker:build first)
$ yarn cypress

# With the application running locally, this command will run the e2e and Cypress tests
$ yarn ci
```

To troubleshoot or develop tests locally, you can run the necessary application services using instructions from above and then run the tests locally from their respective package, `e2e` or `cypress`. You can also run `yarn up` and then run the tests locally (see each test package README for further instructions).

A quick note to keep in mind about running `docker-compose` commands. There are multiple `docker-compose.yml` configurations in the project, if you run `docker-compose` commands you need to reference the file you want to run the command for, or be in the directory where that file is.

## Authentication

We use the passport module for defining single-sign-on provider logins with common social account providers like Google, Facebook, and GitHub. Authorization through one of these strategies creates a user account which is uniquely identified by the email address. After authentication, a user is granted a long-lived `jwt` to stay signed into Pairwise.

To test authentication locally, you will need to run the client and server using `https`, which can be done using the `yarn client|server:https` commands. You will also need to adjust relevant environment variables for each of these to `https` where appropriate.

All of the SSO provider logins have mock API implementations in the `external-services` package, which are used when running e2e/Cypress tests. These can be enabled locally by running the
external services server and by loading all of the SSO provider environment variables which point to the local external service mock APIs (see `server/sample.env`) when running the application server.

## To Rebuild The Database

```bash
# Drops database tables and re-runs the latest migrations
$ yarn db:rebuild
```

## To Refresh Builds and Dependencies

These steps will be necessary if for instance some package `node_module` dependencies have changed.

```bash
# Runs the builds for all packages, building @pairwise/common first
$ yarn build

# Lerna bootstrap installs and links package dependencies
$ lerna bootstrap

# Build the Docker image which has all dependencies installed
$ yarn docker:build

# Rebuild the docker compose for running the app
$ yarn up:build
```
