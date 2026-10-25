package de.kimbiss.api.meal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * A meal as the user saves it; {@code eatenAt} is epoch milliseconds. A meal
 * from a photo also brings its foods and, when first saved, the base64 JPEG;
 * both may be missing.
 */
public record MealInput(
  @NotBlank @Size(max = 120) String name,
  @Positive long eatenAt,
  @DecimalMin("0") @DecimalMax("10000") double kcal,
  @DecimalMin("0") @DecimalMax("1000") double protein,
  @DecimalMin("0") @DecimalMax("1000") double carbs,
  @DecimalMin("0") @DecimalMax("1000") double fat,
  @Valid @Size(max = 40) List<MealItem> items,
  String photo
) {
}
