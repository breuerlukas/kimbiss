package de.kimbiss.api.user;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Locks an account name for {@link #LOCK_MILLIS} after {@link #MAX_FAILURES}
 * wrong passwords in a row, so a password cannot be guessed online.
 * ponytail: in memory, resets on restart; persist it if the api ever runs twice.
 */
@Component
public final class SignInThrottle {
  private static final int MAX_FAILURES = 5;
  private static final long LOCK_MILLIS = 15 * 60 * 1000;

  private final Map<String, Failures> failures = new ConcurrentHashMap<>();

  public boolean locked(String name) {
    var current = failures.get(name);
    return current != null && current.count() >= MAX_FAILURES
      && System.currentTimeMillis() - current.lastAt() < LOCK_MILLIS;
  }

  public void fail(String name) {
    failures.merge(name, new Failures(1, System.currentTimeMillis()),
      (previous, _) -> previous.next());
  }

  public void succeed(String name) {
    failures.remove(name);
  }

  /** Failures since the last success; a lock that ran out starts over at one. */
  private record Failures(int count, long lastAt) {
    Failures next() {
      var now = System.currentTimeMillis();
      return now - lastAt >= LOCK_MILLIS ? new Failures(1, now)
        : new Failures(count + 1, now);
    }
  }
}
