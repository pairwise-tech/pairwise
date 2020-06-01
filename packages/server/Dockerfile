# Take the production image and run the server. Note that if you
# are debugging this locally you will need to provide the server
# environment variables.

FROM pairwise-runtime AS pairwise-server-build

WORKDIR /usr/src/app

# Copy everything
COPY . .

RUN ls

RUN pwd

# Install Zeit ncc
RUN npm i -g @zeit/ncc

# Compile the server into a single js file
RUN cd packages/server && ncc build dist/main.js --out target --source-map --minify

RUN cd packages/server && ls && pwd

FROM node:12-alpine AS pairwise-server-runtime

WORKDIR /usr/src/app

RUN ls

# Copy target folder with bundled index.js file
COPY --from=pairwise-server-build /usr/src/app/packages/server/target /usr/src/app/target

# Copy dist folder which includes migrations files (required for typeorm)
COPY --from=pairwise-server-build /usr/src/app/packages/server/dist /usr/src/app/dist

# Install typeorm (required to run migrations)
RUN npm i -g typeorm

# Install pg (required by typeorm)
RUN npm i -g pg

# Run the migrations and launch Pairwise!
CMD ["sh", "-c", "typeorm migration:run && node target/index.js"]
