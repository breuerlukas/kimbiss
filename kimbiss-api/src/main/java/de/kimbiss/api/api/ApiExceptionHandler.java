package de.kimbiss.api.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/** Answers an {@link ApiException} as {@code {"error": "<code>"}}. */
@RestControllerAdvice
public final class ApiExceptionHandler {
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, String>> refuse(ApiException exception) {
    return ResponseEntity.status(exception.status())
      .body(Map.of("error", exception.code()));
  }
}
