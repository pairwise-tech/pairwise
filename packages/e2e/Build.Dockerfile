# This Dockerfile takes the dependencies build and runs the build steps
# for all the pacakges. This is used to produce a full application build
# which is then used for the various test stages.

FROM pairwise-dependencies as build

COPY . .

# Setup server environment
RUN yarn server:setup

# Set the damn React variable!
ENV REACT_APP_HOST=http://server:9000

# Uses Lerna to run the build command for all packages
# RUN yarn build

# Enable for local server build debugging (much faster):
RUN yarn common:build
RUN yarn server:build
