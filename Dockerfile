FROM node:slim AS builder

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Public runtime config (exposed to browser via NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_ONLYOFFICE_URL
ENV NEXT_PUBLIC_ONLYOFFICE_URL=$NEXT_PUBLIC_ONLYOFFICE_URL

ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_FILES_URL
ENV NEXT_PUBLIC_FILES_URL=$NEXT_PUBLIC_FILES_URL

# Server-side secrets (never expose to frontend!)
ARG ONLYOFFICE_JWT_SECRET
ENV ONLYOFFICE_JWT_SECRET=$ONLYOFFICE_JWT_SECRET

ARG ONLYOFFICE_ACCESSIBLE_HOSTNAME
ENV ONLYOFFICE_ACCESSIBLE_HOSTNAME=$ONLYOFFICE_ACCESSIBLE_HOSTNAME

ARG PROXY_SECRET
ENV PROXY_SECRET=$PROXY_SECRET

# Copy the rest of the application files
COPY . .

# Build the Next.js project
RUN npm run build

# Use a lightweight image for production
FROM node:slim AS runner

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Run the Next.js app with npm start
CMD ["npm", "run", "start"]
