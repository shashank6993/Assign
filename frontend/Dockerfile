FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV NEXT_PUBLIC_API_URL=https://assign-amg8.onrender.com

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
