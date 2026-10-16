package de.kimbiss.api.user;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/** Salted, so equal passwords never give equal rows; only the right one matches. */
final class PasswordHashTest {
  private final PasswordHash passwordHash = new PasswordHash();

  @Test
  void acceptsOnlyTheRightPassword() {
    var stored = passwordHash.hash("correct horse");
    Assertions.assertFalse(stored.contains("correct horse"));
    Assertions.assertTrue(passwordHash.matches("correct horse", stored));
    Assertions.assertFalse(passwordHash.matches("correct horsE", stored));
  }

  @Test
  void saltsEveryHash() {
    Assertions.assertNotEquals(passwordHash.hash("same"), passwordHash.hash("same"));
  }
}
