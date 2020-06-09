# Pairwise Nest Server

## Description

This is the [Nest](https://github.com/nestjs/nest) server application for Pairwise.

To become familiar with the APIs feel free to run the server and access the generated Swagger documentation at `http://localhost:9000/api`.

## Setup

```bash
# Create environment variables file
$ yarn setup:env
```

## Running the App

First, run Postgres with Docker (You will need Docker installed):

```bash
# Start Postgres with: docker-compose up
$ yarn db

# Run database migrations
$ yarn setup:db
```

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test

# test coverage
$ yarn test:cov
```

## Update Nest

To update the various NestJS library dependencies, you can use the Nest CLI:

```bash
# Install the Nest CLI if you don't have it
$ npm i -g @nestjs/cli

# Update Nest libraries
$ nest update --force
```

## Database Migrations

If you make any change to any database `Entity`, you can generate a new migrations file by running:

```bash
# Generate a new migration file
$ yarn migration:generate MyMigrationName

# Run any pending migrations
$ yarn migration:run
```

Where `MyMigrationName` is a name to describe the current migration. The second command will execute the migration against the database.

## Deployment

```bash
# Build the Dockerfile
$ docker build -t pairwise-server .

# Run the built image
$ docker run -it pairwise-server
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
