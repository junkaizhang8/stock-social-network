# Build the app
FROM node:22-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci --silent

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]