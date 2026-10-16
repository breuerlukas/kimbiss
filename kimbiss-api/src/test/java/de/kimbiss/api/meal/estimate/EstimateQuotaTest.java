package de.kimbiss.api.meal.estimate;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.UUID;

final class EstimateQuotaTest {
  @Test
  void refusesPastTheDailyLimitPerUser() {
    var quota = new EstimateQuota(2);
    var kim = UUID.randomUUID();
    Assertions.assertTrue(quota.take(kim));
    Assertions.assertTrue(quota.take(kim));
    Assertions.assertFalse(quota.take(kim));
    Assertions.assertTrue(quota.take(UUID.randomUUID()));
  }
}
