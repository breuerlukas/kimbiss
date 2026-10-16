package de.kimbiss.api.user;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

final class SignInThrottleTest {
  private final SignInThrottle throttle = new SignInThrottle();

  @Test
  void locksAfterFiveFailuresAndOnlyThatName() {
    for (var attempt = 0; attempt < 4; attempt++) {
      throttle.fail("kim");
    }
    Assertions.assertFalse(throttle.locked("kim"));
    throttle.fail("kim");
    Assertions.assertTrue(throttle.locked("kim"));
    Assertions.assertFalse(throttle.locked("lukas"));
  }

  @Test
  void successClearsTheCount() {
    for (var attempt = 0; attempt < 4; attempt++) {
      throttle.fail("kim");
    }
    throttle.succeed("kim");
    throttle.fail("kim");
    Assertions.assertFalse(throttle.locked("kim"));
  }
}
