FROM node:13

# create dir
WORKDIR /srv/webapp

# get dependencies
COPY package*.json ./

# get source code
COPY src ./src

# copy static files
COPY public ./public

# get build files
COPY gulpfile.js ./
COPY ts*.json ./

# install dependencies
RUN yarn install --frozen-lockfile

# build app from source
RUN npx gulp build

# start the service
CMD [ "node", "dist/app.js" ]