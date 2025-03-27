# Use the official Node.js image as the base image
FROM node:23.10 as package

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY yarn.lock ./

# Install the application dependencies
RUN yarn install

# Use the official Node.js image as the base image
FROM node:23.10-alpine as builder

# Set the working directory inside the container
WORKDIR /app

COPY --from=package /app /app/
# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN yarn run build
RUN npx prisma generate

# Use the official Node.js image as the base image
FROM node:23.10-alpine
# Set the working directory inside the container
WORKDIR /app
COPY --from=builder /app/dist /app/dist/
COPY --from=builder /app/node_modules /app/node_modules/

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]
