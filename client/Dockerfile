# Use a specific Node version for better compatibility
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and .npmrc
COPY package.json .npmrc ./

# Install dependencies with legacy-peer-deps flag
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build app with legacy-peer-deps flag
RUN npm run build

# Install serve to serve static files
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start server
CMD ["serve", "-s", "build", "-l", "3000"]