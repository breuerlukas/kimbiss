package de.kimbiss.api.profile;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * What the setup guide asks plus the daily targets it proposed (and the user
 * may have changed). The app computes the targets; the api only stores them.
 */
public record ProfileInput(
  @NotNull @Pattern(regexp = "female|male") String sex,
  @Min(1900) @Max(2100) int birthYear,
  @Min(100) @Max(250) int heightCm,
  @DecimalMin("30") @DecimalMax("300") double startWeightKg,
  @DecimalMin("30") @DecimalMax("300") double goalWeightKg,
  @NotNull @Pattern(regexp = "sedentary|light|moderate|active") String activity,
  @DecimalMin("0") @DecimalMax("1") double weeklyChangeKg,
  @Min(800) @Max(6000) int kcalTarget,
  @Min(0) @Max(500) int proteinTarget,
  @Min(0) @Max(1000) int carbsTarget,
  @Min(0) @Max(400) int fatTarget
) {
}
