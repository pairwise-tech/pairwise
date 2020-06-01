# This Dockerfile builds all the packages, except for the client application.
# It is used for running the top level docker-compose which runs the entire
# backend application, database, and services.

FROM pairwise-dependencies

COPY . .

# Setup server environment
RUN yarn server:setup

# Build common
RUN yarn common:build

# Build external services
RUN yarn services:build

# Build the server
RUN yarn server:build
