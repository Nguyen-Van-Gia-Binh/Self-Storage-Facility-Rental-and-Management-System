# Stage 1: Build application bằng Maven & Java 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy mã nguồn backend từ thư mục backend/
COPY backend/pom.xml .
COPY backend/src ./src

# Build file JAR (bỏ qua unit tests để build nhanh nhất)
RUN mvn clean package -DskipTests

# Stage 2: Runtime image siêu nhẹ với OpenJDK 17
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy file jar đã build từ Stage 1
COPY --from=build /app/target/*.jar app.jar

# Expose cổng mặc định
EXPOSE 8080

# Chạy ứng dụng, tự động nhận biến cổng $PORT của Render
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
