# This Dockerfile takes the dependencies build and runs the build steps
# for all the packages. This is used to produce a full application build
# which is then used for the various test stages.

FROM pairwise-dependencies as build

COPY . .

# Set the React app server URL for the test/development environment
ENV REACT_APP_HOST=http://server:9000

# CI=true
# Certain code will branch off of this.
ENV REACT_APP_CI=1

# Run all builds sequentially
RUN yarn common:build

RUN yarn services:build

RUN yarn server:build

RUN yarn client:build
