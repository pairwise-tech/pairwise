FROM dependencies as build

# Setup server environment
RUN yarn server:setup

# Uses Lerna to run the build command for all packages
RUN yarn build

FROM build AS runtime

COPY . .
