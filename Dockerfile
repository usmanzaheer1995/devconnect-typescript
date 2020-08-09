FROM node:12.18-alpine as prod

ENV NODE_ENV production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 5000

CMD ["npm", "start"]

FROM node:12.18-alpine as dev-client

WORKDIR /usr/src/app/client
COPY /client/ .
RUN npm install
EXPOSE 3000

CMD ["npm", "run", "client"]

FROM node:12.18-alpine as dev-server

ENV NODE_ENV development
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
EXPOSE 5000

CMD ["npm", "run", "server"]