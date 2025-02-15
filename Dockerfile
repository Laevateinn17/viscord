FROM node:22.13

WORKDIR /app

COPY package*.json .

ARG BACKEND_API_URL

ENV NEXT_PUBLIC_API_URL=${BACKEND_API_URL}

RUN npm install

COPY . .

RUN npm run build

EXPOSE 80

CMD ["npm", "run", "start"]
# CMD ["npx", "next", "dev", "--turbopack", "-p 80"]

