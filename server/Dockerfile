FROM node:20-alpine

WORKDIR /app

# Copy the monorepo root package files
COPY package*.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY client/package.json ./client/

# Install dependencies workspaces
RUN npm install

# Copy application code
COPY shared/ ./shared/
COPY server/ ./server/

# Build the server (and shared if needed)
WORKDIR /app/server
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
