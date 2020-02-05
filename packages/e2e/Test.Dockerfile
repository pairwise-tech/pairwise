# This Dockerfile takes the application build and runs the unit tests
# for all packages.

FROM pairwise-runtime AS test

# Uses Lerna to run the test command for all packages
RUN yarn test