# Take the production image and run the server.

FROM pairwise-runtime AS pairwise-production-server

COPY . .

ENV GITHUB_AUTHORIZATION_URL=
ENV GITHUB_PROFILE_URL=
ENV GITHUB_TOKEN_URL=
ENV GOOGLE_PROFILE_URL=
ENV GOOGLE_TOKEN_URL=

# Launch Pairwise!
CMD ["yarn", "server:prod"]
