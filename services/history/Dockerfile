FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

#RUN npm run build

EXPOSE 4005

CMD ["node", "index.js"]
