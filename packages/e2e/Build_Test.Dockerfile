# This is the same as the Build.Dockerfile but it pulls from the GitHub 
# container registry which is used to cache docker image build layers in CI.

FROM docker.pkg.github.com/pairwise-tech/pairwise/pairwise-dependencies:latest as build

COPY . .

# Setup server environment
RUN yarn server:setup

# Build common
RUN yarn common:build

# Build external services
RUN yarn services:build

# Build the server
RUN yarn server:build
