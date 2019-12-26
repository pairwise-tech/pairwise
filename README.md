Welcome to **Mono Prototype**!

This app includes a Create React App client application and a NestJS server application.

To get started, follow these steps:

```bash
# Run the setup with Lerna
$ lerna bootstrap

# Build the @prototype/common package
$ yarn common:build

# Start the database (requires Docker)
$ yarn db

# Run server setup (environment variables and database migrations)
$ yarn server:setup

# Start the server
$ yarn server

# Start the client
$ yarn client
```
