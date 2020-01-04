FROM dependencies as build

# Setup server environment
RUN yarn server:setup

# Build common
RUN yarn common:build

# Build the server
RUN yarn server:build

# Build external services
RUN cd packages/external-services && yarn build

FROM build AS runtime

COPY . .
