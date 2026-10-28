package de.kimbiss.api.api.meal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * A base64 JPEG, the language the food names should come back in and the app's
 * id for the run, by which it can call the run off (null from an older app).
 */
public record EstimateRequest(
  @NotNull String image,
  @NotNull @Pattern(regexp = "de|en") String language,
  @Size(max = 64) String runId
) {
}
