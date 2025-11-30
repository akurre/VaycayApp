# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx/nginx.conf /etc/nginx/templates/default.conf.template

# Railway provides PORT environment variable
ENV PORT=80

# Nginx will automatically use envsubst on templates
# and output to /etc/nginx/conf.d/default.conf
EXPOSE $PORT

# Start nginx (it will process templates automatically)
CMD ["nginx", "-g", "daemon off;"]
