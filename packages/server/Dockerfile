FROM node:10-alpine
WORKDIR /usr/src/app

COPY . .
RUN cp sample.env .env
RUN npm install --production
RUN npm run build

EXPOSE 9000
CMD [ "npm", "run", "start:prod" ]