# Pairwise Nest Server

This is the [Nest](https://github.com/nestjs/nest) server application for Pairwise.

## Description

To become familiar with the APIs feel free to run the server and access the generated Swagger documentation at `http://localhost:9000/api`. Note that this server also depends on Redis which needs to be running (run with `yarn redis` from the root level of the project or using the development docker compose files).

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
# NOTE: It may not work with yarn... but it will print out the dependencies you need
# to update. Just copy paste them into a yarn add command.
$ nest update --force
```

## Nest Dependency Injection

NestJS using [dependency injection](https://docs.nestjs.com/providers#dependency-injection) to manage dependencies between different modules. The following is a guideline for the usage of this pattern in NestJS:

```typescript
// Example definition of a NestJS Module:
@Module({
  imports: [TypeOrmModule.forFeature([Payments]), UsersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
```

The main takeaways here are:

1. It is not required for a module to have any imports or exports.
2. Any providers which are used in other modules must be exported from the module they are defined in.
3. For a module to have access to a provider in another module, that module must be imported in the module which requires it.
4. A module's controller exposes API handlers, and typically only depends on the provider service of the same module.
5. A module's provider typically contains business logic and dependencies (e.g. database, other providers, etc.).

Summary: **Export providers, import modules.**

## Database Migrations

If you make any change to any database `Entity`, you can generate a new migrations file by running:

```bash
# First be sure you are running the database and have an updated app build
$ yarn db
$ yarn migration:run
$ yarn build

# Generate a new migration file
$ yarn migration:generate MyMigrationName

# Rebuild server
$ yarn build

# Run any pending migrations
$ yarn migration:run

# Format the migration file
$ yarn prettier:fix
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
