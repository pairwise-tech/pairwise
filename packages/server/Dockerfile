# FROM pairwise-runtime AS pairwise-server-build

FROM docker.pkg.github.com/pairwise-tech/pairwise/pairwise-dependencies:latest as build

# Copy everything
COPY . .

# Install Zeit ncc
RUN npm i -g @zeit/ncc

# Build common
RUN yarn common:build

# Build server
RUN yarn server:build

# Compile the server into a single js file
RUN cd packages/server && ncc build dist/main.js --out target --source-map --minify

FROM node:12-alpine AS pairwise-server-runtime

WORKDIR /usr/src/app

# Copy target folder with bundled index.js file
COPY --from=pairwise-server-build /app/packages/server/target /usr/src/app/target

# Copy dist folder which includes migrations files (required for typeorm)
COPY --from=pairwise-server-build /app/packages/server/dist /usr/src/app/dist

# Install typeorm and pg to run migrations
RUN npm install pg@7.15.1 typeorm@0.2.25

# Run the migrations and launch Pairwise!
CMD ["sh", "-c", "./node_modules/.bin/typeorm migration:run && node target/index.js"]
