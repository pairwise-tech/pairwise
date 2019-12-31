FROM node:10-alpine AS image

# Dockerize is needed to sync containers startup
ENV DOCKERIZE_VERSION v0.6.0
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Create app directory
WORKDIR /usr/app

FROM image AS base

# Copy app source
COPY . .

# Run yarn
RUN npx lerna bootstrap

FROM base as dependencies

# Setup
RUN yarn server:build

FROM dependencies AS runtime

COPY . .
