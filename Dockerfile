FROM node:alpine
WORKDIR /usr/src/app
COPY package.json .
RUN yarn install
COPY . .

# to prod environment
CMD [ "yarn", "start" ]

# to dev environment
# CMD [ "yarn", "dev" ]