# Use a specific Node version for better compatibility
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and .npmrc
COPY package.json .npmrc ./

# Install dependencies with legacy-peer-deps flag
RUN npm install --legacy-peer-deps

# Install specific versions of problematic dependencies
RUN npm install --legacy-peer-deps ajv@8.12.0 ajv-keywords@5.1.0

# Copy source code
COPY . .

# Clear node_modules and reinstall with specific package versions
RUN rm -rf node_modules && \
    npm install --legacy-peer-deps && \
    npm install --legacy-peer-deps ajv@8.12.0 ajv-keywords@5.1.0

# Build app with legacy-peer-deps flag
RUN npm run build

# Install serve to serve static files
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start server
CMD ["serve", "-s", "build", "-l", "3000"]