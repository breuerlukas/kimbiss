package de.kimbiss.api.api;

import lombok.Getter;
import lombok.experimental.Accessors;
import org.springframework.http.HttpStatus;

/**
 * A refusal the app can show: {@code code} is a stable snake_case key the app
 * translates, never a sentence.
 */
@Getter
@Accessors(fluent = true)
public final class ApiException extends RuntimeException {
  private final HttpStatus status;
  private final String code;

  public ApiException(HttpStatus status, String code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}
