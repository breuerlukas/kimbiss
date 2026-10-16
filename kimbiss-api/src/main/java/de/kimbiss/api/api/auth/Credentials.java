package de.kimbiss.api.api.auth;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Sign-in and sign-up body; {@code inviteCode} only matters for sign-up. A
 * name is 3 to 32 letters (any language), digits, spaces, {@code _ . -}, and
 * neither starts nor ends with a space, so "Kim Klarenbach" works.
 */
public record Credentials(
  @NotNull @Pattern(regexp = "[\\p{L}\\p{N}_.-][\\p{L}\\p{N} _.-]{1,30}[\\p{L}\\p{N}_.-]") String name,
  @NotNull @Size(min = 8, max = 128) String password,
  String inviteCode
) {
}
