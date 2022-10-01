FROM node:16

ARG VERSION
ENV VERSION_ENV=$VERSION

RUN mkdir -p /home/node/app/node_modules

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci 
# --omit=dev
# If you are building your code for production
# RUN npm ci --only=production # --omit=dev?

COPY . .

EXPOSE 3000

CMD [ "node", "./bin/www" ]