FROM node:10-alpine
WORKDIR /usr/src/app

COPY . .
RUN npm run setup:env
RUN npm install --production
RUN npm run build

EXPOSE 9000
