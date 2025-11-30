# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for Vite environment variables
ARG VITE_GRAPHQL_URL
ARG VITE_API_URL
ARG NODE_ENV=production

# Make them available as environment variables during build
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=$NODE_ENV

# Build the app (Vite will use the ENV vars above)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf.template

# Create entrypoint script to substitute PORT at runtime
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'PORT=${PORT:-80}' >> /docker-entrypoint.sh && \
    echo 'sed "s/__PORT__/$PORT/g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port (Railway will use $PORT env var)
EXPOSE ${PORT:-80}

# Use entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
