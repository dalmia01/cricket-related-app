FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source and build
COPY . .
RUN npm run build || true

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
