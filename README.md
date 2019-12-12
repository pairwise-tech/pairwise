# gatsby-starter-typescript-graphql

This is a starter kit for [Gatsby.js](https://www.gatsbyjs.org/) websites written in TypeScript.
It leverages [GraphQL Code Generator](https://graphql-code-generator.com/) to enable typesafe GraphQL queries.

## Features

- Type safety with [TypeScript](https://www.typescriptlang.org/)
- Typesafe GraphQL with [graphql-codegen](https://graphql-code-generator.com/)
- [ESLint](https://eslint.org/) with [TypeScript support](https://typescript-eslint.io/)
- Styling with [styled-components](https://emotion.sh/)

## Setup

Install the Gatsby CLI

```bash
yarn global add gatsby-cli
```

Create a new site

```bash
gatsby new <PROJECT_NAME> https://github.com/spawnia/gatsby-starter-typescript-graphql
```

## Usage

Start a dev server

```bash
yarn start
```

Create a production build

```bash
yarn build
```

Serve the production build locally

```bash
yarn serve
```

Generate GraphQL type definitions

```bash
yarn codegen
```

# Query the GitHub GraphQL API

By default, this starter adds the [GitHub GraphQL API](https://developer.github.com/v4/) as a source.
This can be quite useful for personal sites or blogs to show off your projects.

To connect with the GitHub API, you will need to add an environment variable.

```bash
cp .env.development.example .env.example
```
