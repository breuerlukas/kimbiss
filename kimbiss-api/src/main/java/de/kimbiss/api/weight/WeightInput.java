package de.kimbiss.api.weight;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;

/** A weighing; {@code measuredAt} is epoch milliseconds. */
public record WeightInput(
  @Positive long measuredAt,
  @DecimalMin("30") @DecimalMax("300") double kg
) {
}
