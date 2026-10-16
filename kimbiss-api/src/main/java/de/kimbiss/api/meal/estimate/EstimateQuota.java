package de.kimbiss.api.meal.estimate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * At most {@code kimbiss.estimates-per-day} photo estimates per user and server
 * day, so even a stolen session cannot burn the Claude subscription.
 * ponytail: in memory, resets on restart; persist it if the api ever runs twice.
 */
@Component
public final class EstimateQuota {
  private final int perDay;
  private final Map<UUID, Usage> usages = new ConcurrentHashMap<>();

  public EstimateQuota(@Value("${kimbiss.estimates-per-day}") int perDay) {
    this.perDay = perDay;
  }

  /** Counts one estimate; false (and nothing counted) once today's are used. */
  public boolean take(UUID userId) {
    var today = LocalDate.now();
    var usage = usages.compute(userId, (_, previous) ->
      previous == null || !previous.day().equals(today) ? new Usage(today, 1)
        : new Usage(today, previous.count() + 1));
    return usage.count() <= perDay;
  }

  private record Usage(LocalDate day, int count) {
  }
}
