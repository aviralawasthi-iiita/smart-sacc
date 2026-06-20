# Use a lightweight Node alpine image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and lock files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Expose port 8000
EXPOSE 8000

# Default start command for production or standard execution
CMD ["npm", "start"]
