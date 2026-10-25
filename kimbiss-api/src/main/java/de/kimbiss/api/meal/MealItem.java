package de.kimbiss.api.meal;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * One food of a saved meal as the photo estimate listed it, kept so the meal
 * can show its foods again later. The app sends it back unchanged on edit.
 */
@Embeddable
public record MealItem(
  @NotBlank @Size(max = 120) String name,
  @DecimalMin("0") @DecimalMax("5000") double grams,
  @DecimalMin("0") @DecimalMax("10000") double kcal,
  @DecimalMin("0") @DecimalMax("1000") double protein,
  @DecimalMin("0") @DecimalMax("1000") double carbs,
  @DecimalMin("0") @DecimalMax("1000") double fat
) {
}
