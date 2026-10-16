package de.kimbiss.api.weight;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "weights")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public final class WeightEntry {
  @Id
  private UUID id;
  @JsonIgnore
  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;
  @Column(name = "measured_at", nullable = false)
  private long measuredAt;
  private double kg;

  public static WeightEntry of(UUID userId, WeightInput input) {
    var entry = new WeightEntry();
    entry.id = UUID.randomUUID();
    entry.userId = userId;
    entry.measuredAt = input.measuredAt();
    entry.kg = input.kg();
    return entry;
  }
}
