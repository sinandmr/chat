FROM node:16-alpine

WORKDIR /usr/src/chat-app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

CMD [ "node", "build/main.js"]