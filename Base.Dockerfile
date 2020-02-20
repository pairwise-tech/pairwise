# This Dockerfile builds the dependencies image which includes installations
# of Cypress, dockerize, Lerna, and all project dependencies. This image is
# used to run the e2e and Cypress tests with the full application using
# docker-compose.

FROM cypress/base:10 AS cypress

# Dockerize is needed to sync containers startup
ENV DOCKERIZE_VERSION v0.6.0
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Fuck! https://github.com/lovell/sharp/issues/1882
RUN apt-get update && apt-get install -y libvips-dev --no-install-recommends

# Install Lerna
RUN npm i -g lerna

# Create app directory
WORKDIR /usr/app

FROM cypress AS base

COPY . .

# Install all dependencies with Lerna
RUN lerna bootstrap

FROM base as dependencies

# Copy everything
COPY . .
