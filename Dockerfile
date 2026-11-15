FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build:servidor

FROM node:22-alpine
WORKDIR /app
COPY servidor ./servidor
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["node", "servidor/index.js"]
