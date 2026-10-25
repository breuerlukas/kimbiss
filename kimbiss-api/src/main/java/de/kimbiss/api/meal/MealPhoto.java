package de.kimbiss.api.meal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * The photo a meal was estimated from, under the meal's own id. A table of its
 * own, so listing a day's meals never loads the JPEGs.
 */
@Entity
@Table(name = "meal_photos")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public final class MealPhoto {
  @Id
  private UUID id;
  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;
  @Column(nullable = false)
  private byte[] jpeg;

  public static MealPhoto of(UUID mealId, UUID userId, byte[] jpeg) {
    var photo = new MealPhoto();
    photo.id = mealId;
    photo.userId = userId;
    photo.jpeg = jpeg;
    return photo;
  }

  public byte[] jpeg() {
    return jpeg;
  }
}
