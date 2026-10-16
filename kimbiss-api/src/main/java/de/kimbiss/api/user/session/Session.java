package de.kimbiss.api.user.session;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.UUID;

/**
 * One signed-in device. Only the SHA-256 of the token is stored, so a leaked
 * database does not hand out working sessions. Deleting the row signs out.
 */
@Entity
@Table(name = "sessions")
@Getter
@Accessors(fluent = true)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(staticName = "create")
public final class Session {
  @Id
  @Column(name = "token_hash", nullable = false, updatable = false)
  private String tokenHash;
  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;
  @Column(name = "created_at", nullable = false, updatable = false)
  private long createdAt;
}
