# Stage 1: Build the React application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and lock files
COPY package.json package-lock.json* bun.lockb* ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Accept VITE_API_BASE_URL as a build argument
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 to the Docker host
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
