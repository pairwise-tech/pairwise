FROM node:10-alpine
WORKDIR /usr/src/app

COPY . .
RUN npm install
RUN npm build

EXPOSE 7000