package de.kimbiss.api.api.auth;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Sign-in and sign-up body; {@code inviteCode} only matters for sign-up. */
public record Credentials(
  @NotNull @Pattern(regexp = "[A-Za-z0-9_.-]{3,32}") String name,
  @NotNull @Size(min = 8, max = 128) String password,
  String inviteCode
) {
}
