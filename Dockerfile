FROM dependencies as setup

# Copy everything
COPY . .

# Setup server environment
RUN yarn server:setup

FROM setup AS build

# Uses Lerna to run the build command for all packages
RUN yarn build

FROM build AS runtime

COPY . .

# FROM node:10-alpine AS image

# # Dockerize is needed to sync containers startup
# ENV DOCKERIZE_VERSION v0.6.0
# RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
#   && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
#   && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# # Install Lerna
# RUN npm i -g lerna

# # Create app directory
# WORKDIR /usr/app

# FROM image AS base

# # Copy all dependency inputs to cache the npm install step
# COPY package.json lerna.json yarn.lock /usr/app/
# COPY packages/common/package.json /usr/app/packages/common/package.json
# COPY packages/client/package.json /usr/app/packages/client/package.json
# COPY packages/server/package.json /usr/app/packages/server/package.json
# COPY packages/e2e/package.json /usr/app/packages/e2e/package.json
# COPY packages/cypress/package.json /usr/app/packages/cypress/package.json
# COPY packages/external-services/package.json /usr/app/packages/external-services/package.json

# # Install all dependencies with Lerna
# RUN lerna bootstrap

# FROM base as dependencies

# # Copy everything
# COPY . .

# # Setup server environment
# RUN yarn server:setup

# FROM dependencies AS build

# # Uses Lerna to run the build command for all packages
# RUN yarn build

# FROM build AS runtime

# COPY . .
