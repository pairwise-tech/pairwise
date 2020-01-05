# This Dockerfile builds and runs the server application.

FROM node:10-alpine

WORKDIR /usr/src/app

COPY . .

EXPOSE 9000

# Setup server environment variables
RUN npm run setup:env

# Install dependencies
RUN npm install --production

# Build the app
RUN npm run build

