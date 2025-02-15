FROM node:22.13

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

EXPOSE 80

CMD ["npm", "run", "start"]
# CMD ["npx", "next", "dev", "--turbopack", "-p 80"]

