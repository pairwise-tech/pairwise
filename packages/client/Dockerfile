# Take the production image and deploy the client. Build the client
# application again here because the build step incorporates the env
# values for the server URL. This is different in test and production,
# rebuilding here will capture the correct production URL which will
# be set in the environment.

# If running locally, use this instead:
# FROM pairwise-dependencies

# Pulls from the GitHub Container Registry:
FROM docker.pkg.github.com/pairwise-tech/pairwise/pairwise-dependencies:latest as build

COPY . .

# Read from the build environment args
ARG REACT_APP_HOST
ARG REACT_APP_WEB_SOCKET_HOST
ARG REACT_APP_STRIPE_API_KEY
ARG REACT_APP_SENTRY_DSN

# Enable Google Analytics
ENV REACT_APP_ENABLE_ANALYTICS=true

# Install Netlify CLI
RUN npm i -g netlify-cli

# Build common
RUN yarn common:build

# Build the production client app
RUN yarn client:build

# Deploy the client application
CMD netlify deploy --prod --site $NETLIFY_SITE_ID --auth $NETLIFY_AUTH_TOKEN --dir packages/client/build --message "Pairwise Client Deployed (commit $GITHUB_SHA)"
