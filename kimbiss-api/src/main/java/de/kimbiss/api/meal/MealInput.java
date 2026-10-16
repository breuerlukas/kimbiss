package de.kimbiss.api.meal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** A meal as the user saves it; {@code eatenAt} is epoch milliseconds. */
public record MealInput(
  @NotBlank @Size(max = 120) String name,
  @Positive long eatenAt,
  @DecimalMin("0") @DecimalMax("10000") double kcal,
  @DecimalMin("0") @DecimalMax("1000") double protein,
  @DecimalMin("0") @DecimalMax("1000") double carbs,
  @DecimalMin("0") @DecimalMax("1000") double fat
) {
}
