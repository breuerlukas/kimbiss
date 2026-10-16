package de.kimbiss.api.api.meal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** A base64 JPEG and the language the food names should come back in. */
public record EstimateRequest(
  @NotNull String image,
  @NotNull @Pattern(regexp = "de|en") String language
) {
}
