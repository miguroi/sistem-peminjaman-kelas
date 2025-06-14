FROM nginx:1.27-alpine

# Copy all frontend files to nginx html directory
COPY . /usr/share/nginx/html/

# Copy simple nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
