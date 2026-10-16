package de.kimbiss.api.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Answers an {@link ApiException} as {@code {"error": "<code>"}}, and a body
 * that fails validation as {@code invalid_<field>} (for example
 * {@code invalid_name}), so the app can say which input to fix.
 */
@RestControllerAdvice
public final class ApiExceptionHandler {
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, String>> refuse(ApiException exception) {
    return ResponseEntity.status(exception.status())
      .body(Map.of("error", exception.code()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> rejectInput(
    MethodArgumentNotValidException exception
  ) {
    var field = exception.getBindingResult().getFieldError();
    var code = field == null ? "invalid_input"
      : "invalid_" + field.getField().replaceAll("([A-Z])", "_$1").toLowerCase();
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", code));
  }
}
