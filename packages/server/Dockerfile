FROM pairwise-runtime AS pairwise-server-build

# Copy everything
COPY . .

# Install Zeit ncc
RUN npm i -g @zeit/ncc

# Compile the server into a single js file
RUN cd packages/server && ncc build dist/main.js --out target --source-map --minify

FROM node:12-alpine AS pairwise-server-runtime

WORKDIR /usr/src/app

# Copy target folder with bundled index.js file
COPY --from=pairwise-server-build /packages/server/target /usr/src/app/target

# Copy dist folder which includes migrations files (required for typeorm)
COPY --from=pairwise-server-build /packages/server/dist /usr/src/app/dist

# Install typeorm and pg to run migrations
RUN npm install pg@7.15.1 typeorm@0.2.25

# Run the migrations and launch Pairwise!
CMD ["sh", "-c", "./node_modules/.bin/typeorm migration:run && node target/index.js"]

# Old Version:

# # Take the production image and run the server.

# FROM pairwise-runtime AS pairwise-production-server

# COPY . .

# # Set TypeORM environment variables
# # Other environment secrets are set in the production environment
# ENV TYPEORM_LOGGING=false
# ENV TYPEORM_SYNCHRONIZE=false
# ENV TYPEORM_ENTITIES=dist/**/*.entity.js
# ENV TYPEORM_MIGRATIONS=dist/migrations/**/*.js
# ENV TYPEORM_SUBSCRIBERS=dist/subscriber/**/*.js
# ENV TYPEORM_MIGRATIONS_DIR=src/migrations

# # Launch Pairwise!
# CMD ["yarn", "server:prod"]