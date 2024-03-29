# 🎉 Welcome to Pairwise!

<img width="75" height="75" src="https://user-images.githubusercontent.com/18126719/76191795-1f7ac500-621b-11ea-8e4c-e615e05eae9a.png" />

The **Pairwise** codebase includes a React app client application, a NestJS server application, and other various services, all bundled up in a monorepo using Lerna and Yarn workspaces.

## ‼️ NOTE

Pairwise failed to gain enough user traction and is no longer operating as a business. All the code here is now open source and the app has been converted to a frontend-only application, which is still running for anyone to see. Thanks for visiting!

<img width="1440" alt="pairwise" src="https://user-images.githubusercontent.com/18126719/155054677-9ecb63cd-a2ac-4154-ab62-60c7b7f76bb8.png">

## 📋 Structure

This project is managed using Lerna, and contains the following packages:

| Package                                                                                             | Description                                |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [admin](https://github.com/pairwise-tech/pairwise/tree/main/packages/admin)                         | React admin client application             |
| [client](https://github.com/pairwise-tech/pairwise/tree/main/packages/client)                       | React client application                   |
| [common](https://github.com/pairwise-tech/pairwise/tree/main/packages/common)                       | Shared code, utils, and types              |
| [cypress](https://github.com/pairwise-tech/pairwise/tree/main/packages/cypress)                     | Cypress end-to-end test suite              |
| [e2e](https://github.com/pairwise-tech/pairwise/tree/main/packages/e2e)                             | End-to-end API test suite                  |
| [external-services](https://github.com/pairwise-tech/pairwise/tree/main/packages/external-services) | 3rd party APIs for testing and development |
| [server](https://github.com/pairwise-tech/pairwise/tree/main/packages/server)                       | NestJS backend application                 |

## 🦄 Quick Links

We use the following libraries across the codebase, here are some quick links to their docs:

- [TypeScript](https://www.typescriptlang.org/index.html): Types!
- [React](https://reactjs.org/): The best.
- [Redux](https://redux.js.org/): Yes, Redux.
- [RxJS](https://rxjs-dev.firebaseapp.com/): Futuristic stuff.
- [Redux Observable](https://redux-observable.js.org/): Truly epic.
- [React Router](https://reacttraining.com/react-router/web/guides/quick-start): Meh.
- [BlueprintJS](https://blueprintjs.com/): Modern, fashionable.
- [NestJS](https://docs.nestjs.com/): Feels like SpringBoot.
- [Redis](https://redis.io/): Shared state and data caching layer.
- [SocketIO](https://docs.nestjs.com/): Real time server events.
- [TypeORM](https://typeorm.io/#/): Postgres ORM.
- [Passport](http://www.passportjs.org/docs/): (Easy) authentication.
- [Jest](https://jestjs.io/docs/en/getting-started): The Test Runner.
- [Cypress](https://docs.cypress.io/guides/overview/why-cypress.html#In-a-nutshell): Automate UI testing.
- [ESLint](https://eslint.org/): Write code according to the rules.
- [Prettier](https://prettier.io/docs/en/options.html): Make the code pretty.
- [Lerna](https://lerna.js.org/): All the code, all the repos.
- [VS Code](https://code.visualstudio.com/): Highly recommended, great experience.
- [GitHub Actions](https://github.com/features/actions): Automate!
- [Netlify](https://www.netlify.com/): Host the Pairwise client workspace and admin dashboard.
- [Google Cloud Platform](https://cloud.google.com/): Deploy the production backend.

## 👷 Getting Started

To work with Pairwise you will need [Node](https://nodejs.org/en/), [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/lang/en/docs/), and [Docker](https://www.docker.com/) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage different versions of Node (we recommend Node 12, e.g. `12.16.1`).

We recommend using the latest version of Yarn and Node LTS:

```bash
# Install Node LTS
$ nvm install lts/*

# Set Node LTS as default Node version with nvm
$ nvm alias default lts/*
```

We also recommend using [Visual Studio Code](https://code.visualstudio.com/) and installing the recommended project extensions.

All the important information about how Pairwise works should be covered in the repo `README` documents. These documents serve as a quick reference to learn about how the entire codebase works, and are linked in the above repo structure section.

## 🛠️ Development

To run the app you will need Docker and Node installed. All of the packages tend to have commands of the structure `[package]:[dev|start|watch|build|prod]` so you can generally modify the following scripts depending on how you want to start different packages.

Some setup steps you will need to run after cloning the repo:

```bash
# Install Lerna
$ npm i -g lerna

# Install dependencies
$ lerna bootstrap

# Create .env files in relevant packages
$ yarn setup

# Build all packages
$ yarn build

# Start the database
$ yarn db

# Run database migrations
$ yarn db:setup
```

To run all the services separately:

```bash
# Start the database
$ yarn db

# Start Redis
$ yarn redis

# Start the server
$ yarn server:dev

# Start the client workspace
$ yarn client

# Start the admin client
$ yarn admin

# Start the client in development mode (no server required)
$ yarn client:dev

# (Optional) Run the common package
$ yarn common:watch

# (Optional) Run the external services
$ yarn services:watch
```

To run the backend application (database, server, and external services). This can be useful when just developing the client application, or when working on Cypress tests.

```bash
# Build the Docker image which has all dependencies installed
$ yarn docker:dependencies

# Run the application with Docker Compose
$ yarn up

# Run the client app
$ yarn client
```

## 🏭 Codepress

We use Codepress to develop course content. Codepress is an internal CMS tool built into the Pairwise Workspace. You can run it with the command `yarn client:codepress`. Then, just open the app in your browser to get started. Codepress changes will write directly to the JSON course content file.

## 🚧 Tests

Each package contains unit tests relevant to that package. The backend APIs are tested with a series of e2e tests which are located in the `e2e/` package, and the entire application is also tested using Cypress. The e2e tests include tests for APIs which depend on Redis and SocketIO.

```bash
# Use Lerna to run the test script for each package
$ yarn test

# Build the Docker image which has all dependencies installed
$ yarn docker:dependencies

# Build the applications
$ yarn docker:build

# Run the unit tests for all packages using Docker
$ yarn docker:test

# Run the e2e test suite (be sure to run docker:dependencies first)
$ yarn e2e

# Run the Cypress end to end test suite (be sure to run docker:dependencies first)
$ yarn cypress

# With the application running locally, this command will run the e2e and Cypress tests
$ yarn ci
```

To troubleshoot or develop tests locally, you can run the necessary application services using instructions from above and then run the tests locally from their respective package, `e2e` or `cypress`. You can also run `yarn up` and then run the tests locally (see each test package README for further instructions).

A quick note to keep in mind about running `docker-compose` commands. There are multiple `docker-compose.yml` configurations in the project, if you run `docker-compose` commands you need to reference the file you want to run the command for, or be in the directory where that file is.

## 💂‍♂️ Authentication

We use the passport module for defining single-sign-on provider logins with common social account providers like Google, Facebook, and GitHub. Authorization through one of these strategies creates a user account which is uniquely identified by the email address. After authentication, a user is granted a long-lived `jwt` to stay signed into Pairwise.

To test authentication locally, you will need to run the client and server using `https`, which can be done using the `yarn client|server|services:https` commands. Also, you may need to visit `chrome://flags/#allow-insecure-localhost` in Chrome and enable the option to prevent warnings about insecure https on localhost.

On the server, you will need to ensure the environment variables which specify URL overrides for the SSO providers are removed/disabled: variables of the format `FACEBOOK_..._URL`. These are only used to override the default behavior in the test/development environment and are not necessary to use the actual integration.

All of the SSO provider logins have mock API implementations in the `external-services` package, which are used when running e2e/Cypress tests. These can be enabled locally by running the
external services server and by loading all of the SSO provider environment variables which point to the local external service mock APIs (see `server/sample.env`) when running the application server.

## 🏦 Payments

We are using [Stripe](https://stripe.com/) to process user payments. Currently, the application redirects to a hosted Stripe checkout page which then sends a webhook event to our server if the user completes the checkout process successfully. The user is then redirected back to Pairwise and sees a payment confirmation. Here are some instructions and resources for working locally if you need to work on the Stripe payments integration feature.

The docker-compose files deploy a `stripe` service which runs the [Stripe CLI](https://stripe.com/docs/stripe-cli) docker image which handles processing Stripe events. This allows the payment integration to simply work in development mode when running Pairwise locally or in a CI environment. Stripe provides several options for [easily testing](https://stripe.com/docs/testing) payments in development. For instance, you can enter the card number `4242424242424242` with any future date as an expiration and any 3 digit CVC to submit a test successful payment.

To run the Stripe CLI locally, outside of Docker, you can run the following command:

```bash
# Run the Stripe CLI and forward requests to localhost:9000/payments/stripe-webhook
$ yarn stripe:dev
```

Please note that it is necessary to have the Stripe CLI running for the payment checkout to complete successfully and submit the webhook to our server.

## ⚙️ To Rebuild The Database

If the database schema changes or you want to simply remove all the data in your local database you can do the following:

```bash
# Drops database tables and re-runs the latest migrations
$ yarn db:reset
```

## 🤖 To Refresh Builds and Dependencies

These steps will be necessary if for instance the `node_module` dependencies for any package have changed.

```bash
# Install any missing dependencies
$ yarn

# Runs the builds for all packages, building @pairwise/common first
# NOTE: You may need to increase the memory allocation for Docker on your
# local machine for the build to execute successfully. If you see out of
# memory errors from the client build, this is probably why.
$ yarn build

# Build the base Docker image which has all dependencies installed
$ yarn docker:dependencies

# Rebuild the docker compose for running the app
$ yarn up:build

# Shut down docker-compose services
$ yarn down
```

If you feel like you having issues with Docker or it is running slowly, you can run `docker system prune` to remove any older unused resources and images.

## 📝 Contributing

We follow a normal git workflow. Commit your changes to a branch, make a pull request, and merge the code after the tests pass.

## ✈️ Production

The client workspace is deployed using [Netlify](https://www.netlify.com/) and the backend server is deployed using [Google Cloud Run](https://cloud.google.com/run), which should provide generous scaling benefits. The backend also relies on a Redis instance deployed on [Redis Labs](https://app.redislabs.com/). Updates are shipped continuously by commits to the `main` branch, and configured in the `deploy-production.yml` GitHub Actions workflow file. Some additional services are deployed separately and managed in other `pairwise/` repositories. You can simulate the production backend deployment locally by running the following commands:

```bash
# Build the production server container
$ yarn docker:prod-server-build

# Run the production server
$ yarn docker:prod-server-start
```

On occasion you may need to connect directly to the production database. You can do this by whitelisting your local IP in the Google Cloud SQL console and then using a local Postgres client to connect.
