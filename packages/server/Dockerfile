# Take the production image and run the server.

FROM pairwise-runtime AS pairwise-production-server

COPY . .

# Set TypeORM environment variables
ENV TYPEORM_LOGGING=false
ENV TYPEORM_SYNCHRONIZE=false
ENV TYPEORM_ENTITIES=dist/**/*.entity.js
ENV TYPEORM_MIGRATIONS=dist/migrations/**/*.js
ENV TYPEORM_SUBSCRIBERS=dist/subscriber/**/*.js
ENV TYPEORM_MIGRATIONS_DIR=src/migrations

# Launch Pairwise!
CMD ["yarn", "server:prod"]
