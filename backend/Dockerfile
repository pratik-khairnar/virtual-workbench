FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY src/ ./src/
COPY schemas/ ./schemas/

RUN mkdir -p /app/data/images /app/data/catalog

ENV PORT=3001
ENV DB_PATH=/app/data/workbench.db
ENV IMAGE_STORAGE_PATH=/app/data/images
ENV CATALOG_MANIFEST_PATH=/app/data/catalog

EXPOSE 3001

CMD ["node", "src/server.js"]
