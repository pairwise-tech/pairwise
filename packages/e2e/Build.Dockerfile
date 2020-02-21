# This Dockerfile takes the dependencies build and runs the build steps
# for all the pacakges. This is used to produce a full application build
# which is then used for the various test stages.

FROM pairwise-dependencies as build

COPY . .

# Setup server environment
RUN yarn server:setup

# Set the React app server URL for the test/development environment
ENV REACT_APP_HOST=http://server:9000

# Use Lerna to run the build command for all packages
RUN yarn build