# Use a minimal nginx image to serve static files
FROM nginx:alpine

# Copy our built files directly to nginx
COPY build/ /usr/share/nginx/html/

# Copy custom nginx config
COPY nginx.conf.railway /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]