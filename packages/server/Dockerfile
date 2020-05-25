# Take the production image and run the server. Note that if you
# are debugging this locally you will need to provide the server
# environment variables.

FROM pairwise-runtime AS pairwise-server-build

# Copy everything
COPY . .

# Install Zeit ncc
RUN npm i -g @zeit/ncc

# Compile the server into a single js file
RUN cd packages/server && ncc build dist/main.js --source-map --minify -out target

FROM node:12-alpine AS pairwise-server-runtime

WORKDIR /usr/src/app

# Copy dist folder with server index.js file
COPY --from=pairwise-server-build /usr/app/packages/server/target /usr/src/app/target

# Copy dist folder which includes migrations files (required for Typeorm CLI
# migration to run)
COPY --from=pairwise-server-build /usr/app/packages/server/dist /usr/src/app/dist

# Install typeorm
RUN npm i -g typeorm

# Install pg (required by typeorm)
RUN npm i -g pg

# Run the migrations and launch Pairwise!
CMD ["sh", "-c", "typeorm migration:run && node target/index.js"]
