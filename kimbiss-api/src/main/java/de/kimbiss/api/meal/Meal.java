package de.kimbiss.api.meal;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * One eaten meal with its totals; the app sums them per day. A meal from a
 * photo also keeps the foods the estimate listed and whether its photo is
 * stored ({@link MealPhoto}).
 */
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
  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "meal_items", joinColumns = @JoinColumn(name = "meal_id"))
  @OrderColumn(name = "position")
  private List<MealItem> items = new ArrayList<>();
  /** A column default, so rows saved before photos were kept read as false. */
  @Column(name = "has_photo", updatable = false,
    columnDefinition = "boolean not null default false")
  private boolean hasPhoto;

  public static Meal of(UUID userId, MealInput input, boolean hasPhoto) {
    var meal = new Meal();
    meal.id = UUID.randomUUID();
    meal.userId = userId;
    meal.hasPhoto = hasPhoto;
    return meal.apply(input);
  }

  public UUID id() {
    return id;
  }

  public Meal apply(MealInput input) {
    eatenAt = input.eatenAt();
    name = input.name();
    kcal = input.kcal();
    protein = input.protein();
    carbs = input.carbs();
    fat = input.fat();
    items.clear();
    if (input.items() != null) {
      items.addAll(input.items());
    }
    return this;
  }
}
