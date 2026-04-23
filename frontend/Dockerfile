FROM node:20-alpine

WORKDIR /app

# Copy the monorepo root package files
COPY package*.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY client/package.json ./client/

# Install dependencies
RUN npm install

# Copy application code
COPY shared/ ./shared/
COPY client/ ./client/

# Build the client
WORKDIR /app/client
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
