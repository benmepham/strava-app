FROM node:16

RUN mkdir -p /home/node/app/node_modules

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

RUN apt-get -q update && apt-get -qy install netcat

COPY . .

EXPOSE 3000

CMD [ "node", "./bin/www" ]