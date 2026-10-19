package de.kimbiss.api.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** For the container healthcheck: answers once Spring is up, without sign-in. */
@RestController
public final class HealthController {
  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "ok");
  }
}
