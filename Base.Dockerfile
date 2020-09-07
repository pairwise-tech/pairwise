# This Dockerfile builds the dependencies image which includes installations
# of Cypress, dockerize, Lerna, and all project dependencies. This image is
# used to run the e2e and Cypress tests with the full application using
# docker-compose.

FROM cypress/base:12.16.1

# Dockerize is needed to sync containers startup
ENV DOCKERIZE_VERSION v0.6.0
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Install Lerna
RUN npm i -g lerna

WORKDIR /app

# Dependencies
COPY package.json /app/
COPY yarn.lock /app/
COPY lerna.json /app/

# Copy client dependency files
COPY packages/client/package.json /app/packages/client/
COPY packages/client/yarn.lock /app/packages/client/

# Copy common dependency files
COPY packages/common/package.json /app/packages/common/

# Copy cypress dependency files
COPY packages/cypress/package.json /app/packages/cypress/

# Copy e2e dependency files
COPY packages/e2e/package.json /app/packages/e2e/

# Copy external-services dependency files
COPY packages/external-services/package.json /app/packages/external-services/

# Copy server dependency files
COPY packages/server/package.json /app/packages/server/
COPY packages/server/yarn.lock /app/packages/server/

# Copy www dependency files
COPY packages/www/package.json /app/packages/www/
COPY packages/www/yarn.lock /app/packages/www/

# Install all dependencies
RUN yarn install

# Copy the rest
COPY . /app
