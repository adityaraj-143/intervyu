FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# We can run directly from this image since Bun doesn't require a separate build step 
# for TypeScript (it runs TS natively), but if we want to shrink the image, 
# we could use a lighter runner. For Bun, the oven/bun image is already good.

FROM oven/bun:1-slim AS runner

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 8000

# Default command for the backend API
CMD ["bun", "run", "start"]
