# Welcome to **Mono Prototype**!

**Mono Prototype** includes a Create React App client application, a NestJS server application, and other various services, all organized in a monorepo using Lerna.

## Development

To get started, install Docker and then run:

```bash
# Launch the database and backend services
$ docker-compose up

# Launch the client application
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

# Run the external services server locally
$ yarn e2e:services

# Run the full build and test suite locally using Docker
$ yarn e2e
```

## To Rebuild The Database

```
# Drops database tables and re-runs the latest migrations
$ yarn db:rebuild
```

## Repository Structure

This project is managed using Lerna, and contains the following packages:

| Package           | Description                                       |
| ----------------- | ------------------------------------------------- |
| client            | React client application                          |
| common            | Shared code, utils, and types                     |
| e2e               | End-to-end test suite                             |
| external-services | Express server to mock 3rd party APIs for testing |
| server            | NestJS backend application                        |
