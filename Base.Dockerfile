# This Dockerfile builds the dependencies image which includes installations
# of Cypress, dockerize, Lerna, and all project dependencies. This image is
# used to run the e2e and Cypress tests with the full application using
# docker-compose.

FROM cypress/base:12.16.1 AS cypress

# Dockerize is needed to sync containers startup
ENV DOCKERIZE_VERSION v0.6.0
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

COPY . .

# Install Lerna
RUN npm i -g lerna

# Install all dependencies with Lerna
RUN lerna bootstrap
