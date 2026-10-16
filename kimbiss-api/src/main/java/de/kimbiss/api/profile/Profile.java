package de.kimbiss.api.profile;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** One per user: the setup answers and the daily targets, sent as is. */
@Entity
@Table(name = "profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public final class Profile {
  @Id
  @JsonIgnore
  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;
  private String sex;
  private int birthYear;
  private int heightCm;
  private double startWeightKg;
  private double goalWeightKg;
  private String activity;
  private double weeklyChangeKg;
  private int kcalTarget;
  private int proteinTarget;
  private int carbsTarget;
  private int fatTarget;

  public static Profile of(UUID userId, ProfileInput input) {
    var profile = new Profile();
    profile.userId = userId;
    profile.apply(input);
    return profile;
  }

  public Profile apply(ProfileInput input) {
    sex = input.sex();
    birthYear = input.birthYear();
    heightCm = input.heightCm();
    startWeightKg = input.startWeightKg();
    goalWeightKg = input.goalWeightKg();
    activity = input.activity();
    weeklyChangeKg = input.weeklyChangeKg();
    kcalTarget = input.kcalTarget();
    proteinTarget = input.proteinTarget();
    carbsTarget = input.carbsTarget();
    fatTarget = input.fatTarget();
    return this;
  }
}
