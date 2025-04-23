# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Create uploads directories
RUN mkdir -p uploads/events uploads/news uploads/equipment uploads/promotions uploads/residents uploads/spaces

# Set permissions for uploads directories
RUN chmod -R 777 uploads

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["node", "app.js"]