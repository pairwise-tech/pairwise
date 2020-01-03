# Welcome to **Mono Prototype**!

**Mono Prototype** includes a Create React App client application, a NestJS server application, and other various services, all organized in a monorepo using Lerna.

## Development

To get started, install Docker and then run:

```bash
# Launch the database and backend services
$ docker-compose up

# Launch the client application
$ yarn client:dev
# or
$ yarn client:https
```

For more detailed control, see the following commands:

```bash
# Run the setup with Lerna to install all package dependencies
$ lerna bootstrap

# Build the @prototype/common package
$ yarn common:build

# Build the @prototype/common package in watch mode
$ yarn common:watch

# Build all packages
$ yarn build

# Start the database (requires Docker)
$ yarn db

# Run server setup (environment variables and database migrations)
$ yarn server:setup

# Drop your local database tables and re-run database migrations
$ yarn db:reset

# Start the server
$ yarn server

# Start the client
$ yarn client
```

## Running Tests

```bash
# Use Lerna to run the test script for each package
$ yarn test

# Run the external services server locally
$ yarn e2e:services

# Run the e2e test suite
$ yarn e2e

# Run the Cypress end to end test suite
$ yarn cypress
```

## To Rebuild The Database

```bash
# Drops database tables and re-runs the latest migrations
$ yarn db:rebuild
```

## To Refresh Builds and Dependencies

```bash
# Runs the builds for all packages, building @prototype/common first
$ yarn build

# Lerna bootstrap installs and links package dependencies
$ lerna bootstrap
```

## Repository Structure

This project is managed using Lerna, and contains the following packages:

| Package           | Description                                       |
| ----------------- | ------------------------------------------------- |
| client            | React client application                          |
| common            | Shared code, utils, and types                     |
| cypress           | Cypress end-to-end test suite                     |
| e2e               | End-to-end test suite                             |
| external-services | Express server to mock 3rd party APIs for testing |
| server            | NestJS backend application                        |
