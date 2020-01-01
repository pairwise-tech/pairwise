FROM node:10-alpine
WORKDIR /usr/src/app

COPY . .
RUN npm install
RUN npm run mock:build

EXPOSE 7000