FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source files
COPY . .

ENV NODE_ENV=production

# Expose port (Koyeb requires a port binding for health check)
EXPOSE 8080

# Run both health check server & background telegram autobot
CMD ["node", "scripts/telegram-autobot.mjs"]
