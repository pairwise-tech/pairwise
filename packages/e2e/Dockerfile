# This Dockerfile is used for the e2e and Cypress test suites. It first
# builds all the projects and runs the unit tests for each. The build is
# then used to run the e2e and Cypress tests.

FROM dependencies as build

COPY . .

# Setup server environment
RUN yarn server:setup

# Set the damn React variable!
ENV REACT_APP_HOST=http://server:9000

# Uses Lerna to run the build command for all packages
RUN yarn build

FROM build AS test

# Uses Lerna to run the test command for all packages
RUN yarn test