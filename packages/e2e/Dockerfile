# This Dockerfile builds all project packages and is used for the e2e and
# Cypress test suites.

FROM dependencies as build

# Setup server environment
RUN yarn server:setup

# Set the damn React variable!
ENV REACT_APP_HOST=http://server:9000

# Uses Lerna to run the build command for all packages
RUN yarn build

FROM build AS test

# Uses Lerna to run the test command for all packages
RUN yarn test

FROM test AS pairwise

COPY . .
