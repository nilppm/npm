FROM node:10
RUN npm install pm2 -g && pm2 install ppm2-intercom
WORKDIR /usr/app/npm
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8080
CMD [ "npm", "run", "start" ]