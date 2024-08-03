FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --silent

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
