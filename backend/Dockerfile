# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app


# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install

# Copy frontend and build it
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build
WORKDIR /app

# Copy backend application files
COPY backend .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/index.js"]
