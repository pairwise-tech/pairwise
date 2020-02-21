# Take the production image and deploy the client.

FROM pairwise-runtime AS pairwise-production-client

COPY . .

# Install Netlify CLI
RUN npm i -g netlify-cli

# Deploy the client application
CMD netlify deploy --prod --site $NETLIFY_SITE_ID --auth $NETLIFY_AUTH_TOKEN --dir packages/client/build --message "Pairwise Client Deployed (commit $GITHUB_SHA)"
