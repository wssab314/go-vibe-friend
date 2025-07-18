# Stage 1: Builder
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./
# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code
COPY . .

# Build the application
# -o /app/server: output binary to /app/server
# CGO_ENABLED=0: disable CGO for static linking
# GOOS=linux: build for linux OS
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# Stage 2: Final
FROM alpine:latest

WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/server .
# Copy migrations and other necessary assets if any
# COPY --from=builder /app/migrations ./migrations

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./server"]
