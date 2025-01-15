# Use the official Node.js image as a base
# Choose the LTS version for better compatibility and stability
FROM node:20-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Install dependencies and build the application
FROM base AS dependencies
# Copy only package.json and package-lock.json to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Prepare the production image
FROM base AS production
# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy the build output and other necessary files
COPY --from=dependencies /app/.next ./.next
COPY --from=dependencies /app/public ./public
COPY --from=dependencies /app/next.config.ts ./next.config.ts

# Expose the port that the app will run on
EXPOSE 3000

# Set environment variable to use production mode
ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]
