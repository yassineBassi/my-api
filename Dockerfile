FROM node:25 AS builder

WORKDIR /app

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

FROM node:25

WORKDIR /app

COPY package*.json .
RUN npm ci

COPY --from=builder /app/dist .

EXPOSE 3000

CMD ["node", "dist/main.js"]
