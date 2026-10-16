package de.kimbiss.api.meal;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** One eaten meal with its totals; the app sums them per day. */
@Entity
@Table(name = "meals", indexes = @Index(columnList = "user_id, eaten_at"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public final class Meal {
  @Id
  private UUID id;
  @JsonIgnore
  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;
  @Column(name = "eaten_at", nullable = false)
  private long eatenAt;
  private String name;
  private double kcal;
  private double protein;
  private double carbs;
  private double fat;

  public static Meal of(UUID userId, MealInput input) {
    var meal = new Meal();
    meal.id = UUID.randomUUID();
    meal.userId = userId;
    return meal.apply(input);
  }

  public Meal apply(MealInput input) {
    eatenAt = input.eatenAt();
    name = input.name();
    kcal = input.kcal();
    protein = input.protein();
    carbs = input.carbs();
    fat = input.fat();
    return this;
  }
}
