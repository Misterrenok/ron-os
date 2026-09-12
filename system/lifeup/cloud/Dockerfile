FROM node:20-alpine
WORKDIR /app
COPY system/lifeup/cloud/package.json system/lifeup/cloud/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY system/lifeup/cloud/schema.sql ./schema.sql
COPY system/lifeup/cloud/migrations ./migrations
COPY system/lifeup/cloud/src ./src
COPY system/lifeup/cloud/public ./public
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/server-v2.mjs"]
