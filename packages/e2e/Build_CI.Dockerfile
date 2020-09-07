# This is the same as the Build.Dockerfile but it pulls from the GitHub 
# container registry which is used to cache docker image build layers in CI.

FROM docker.pkg.github.com/pairwise-tech/pairwise/pairwise-dependencies:latest as build

COPY . .

# Set the React app server URL for the test/development environment
ENV REACT_APP_HOST=http://server:9000

# Tell the build that this is CI. Certain code should branch off of this.
ENV REACT_APP_CI=1

# Use Lerna to run the build command for all packages
RUN yarn build