FROM node:20-slim

WORKDIR /app

# Dependencias del servidor
COPY package*.json ./
RUN npm install --omit=dev

# Dependencias y build del cliente
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

# Copiar el resto del servidor
COPY server ./server

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server/index.js"]
