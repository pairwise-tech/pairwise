# Take the production image and deploy the client. Build the client
# application again here because the build step incorporates the env
# values for the server URL. This is different in test and production,
# rebuilding here will capture the correct production URL which will
# be set in the environment.

FROM pairwise-dependencies AS pairwise-production-client

COPY . .

# Read from the build environment args
ARG REACT_APP_HOST

# # Set it as an env var for the build
# ENV REACT_APP_HOST ${REACT_APP_HOST}

# Set the environment to production
ENV NODE_ENV=production

RUN echo $REACT_APP_HOST

# Install Netlify CLI
RUN npm i -g netlify-cli

# Build common
RUN yarn common:build

# Build the production client app
RUN yarn client:build

# Deploy the client application
CMD netlify deploy --prod --site $NETLIFY_SITE_ID --auth $NETLIFY_AUTH_TOKEN --dir packages/client/build --message "Pairwise Client Deployed (commit $GITHUB_SHA)"
