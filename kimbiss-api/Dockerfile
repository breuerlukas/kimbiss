FROM eclipse-temurin:25-jdk AS build
WORKDIR /build
COPY . .
RUN ./gradlew bootJar --no-daemon -q

FROM eclipse-temurin:25-jre
WORKDIR /api

# Headless Claude Code for the meal photo estimate. It signs in through
# CLAUDE_CODE_OAUTH_TOKEN (or ANTHROPIC_API_KEY) from the environment.
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && curl -fsSL https://claude.ai/install.sh | bash \
  && rm -rf /var/lib/apt/lists/*
ENV PATH="/root/.local/bin:${PATH}" DISABLE_AUTOUPDATER=1

COPY --from=build /build/build/libs/*.jar api.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "api.jar"]
