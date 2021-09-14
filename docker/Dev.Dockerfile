# This Dockerfile supports the docker-compose-dev config.

FROM pairwise-dependencies

COPY . .

# Build external services
RUN yarn services:build
