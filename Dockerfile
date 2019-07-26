FROM node:10
WORKDIR /usr/app/npm
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8080
CMD [ "npm", "run", "start" ]