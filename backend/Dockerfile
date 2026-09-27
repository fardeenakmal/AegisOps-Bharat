# ==============================================================================
# Multi-Stage Production Dockerfile for AegisOps Spring Boot 3.3 Backend
# ==============================================================================

# --- Stage 1: Maven Build Stage ---
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Cache Maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy backend source code and build optimized fat jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Production JRE Runtime ---
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for container liveness and readiness healthchecks, create writable data folder
RUN apk add --no-cache curl && \
    addgroup -S aegisops && adduser -S aegisops -G aegisops && \
    mkdir -p /app/data && \
    chown -R aegisops:aegisops /app

# Switch to non-root secure execution user
USER aegisops:aegisops

# Copy built Spring Boot executable JAR
COPY --from=builder --chown=aegisops:aegisops /app/target/*.jar app.jar

# Expose Spring Boot web port
EXPOSE 4000

# Production container JVM tuning
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# Container liveness & readiness healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-4000}/actuator/health || curl -f http://localhost:${PORT:-4000}/api/system/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
