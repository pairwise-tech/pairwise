FROM dependencies as build

COPY . .

# Setup server environment
RUN yarn server:setup

# Build common
RUN yarn common:build

# Build external services
RUN yarn services:build

# Build the server
RUN yarn server:build

FROM build AS runtime

COPY . .
