# ============================================
# Multi-stage Docker build cho Spring Boot
# Stage 1: Build với Maven
# Stage 2: Run với JRE nhẹ (slim)
# ============================================

# --- Stage 1: Build ---
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build
COPY backend/pom.xml .
# Download dependencies trước → cache layer Docker (không build lại nếu pom.xml không đổi)
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Runtime ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Security: chạy app bằng non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Switch to non-root user
USER appuser

# JVM tuning cho container: giới hạn memory, bật container awareness
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
