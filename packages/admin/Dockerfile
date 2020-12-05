# Build and deploy the admin client dashboard with Netlify

# If running locally, use this instead:
# FROM pairwise-dependencies

# Pulls from the GitHub Container Registry:
FROM docker.pkg.github.com/pairwise-tech/pairwise/pairwise-dependencies:latest as build

COPY . .

# Read from the build environment args
ARG REACT_APP_HOST

RUN echo REACT_APP_HOST

# Install Netlify CLI
RUN npm i -g netlify-cli

# Build common
RUN yarn common:build

# Build the admin client dashboard
RUN yarn admin:build

# Deploy the admin client
CMD netlify deploy --prod --site $NETLIFY_SITE_ID --auth $NETLIFY_AUTH_TOKEN --dir packages/admin/build --message "Pairwise Admin Client Deployed (commit $GITHUB_SHA)"
