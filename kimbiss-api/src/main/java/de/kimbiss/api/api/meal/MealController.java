package de.kimbiss.api.api.meal;

import de.kimbiss.api.api.ApiException;
import de.kimbiss.api.api.security.AuthenticationFilter;
import de.kimbiss.api.meal.Meal;
import de.kimbiss.api.meal.MealInput;
import de.kimbiss.api.meal.MealPhoto;
import de.kimbiss.api.meal.MealPhotoRepository;
import de.kimbiss.api.meal.MealRepository;
import de.kimbiss.api.meal.estimate.MealImage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The meal diary. {@code from}/{@code to} are epoch milliseconds the app picks
 * in its own time zone, so "today" is the user's day, not the server's. A meal
 * of someone else answers 404 just like one that does not exist. A meal's
 * photo comes with its first save and never changes.
 */
@RestController
@RequiredArgsConstructor
public final class MealController {
  private final MealRepository mealRepository;
  private final MealPhotoRepository photoRepository;

  @GetMapping("/meals")
  public List<Meal> findMeals(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @RequestParam long from, @RequestParam long to
  ) {
    return mealRepository.findByUserIdAndEatenAtBetweenOrderByEatenAt(
      userId, from, to);
  }

  @PostMapping("/meals")
  public Meal addMeal(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @Valid @RequestBody MealInput input
  ) {
    var photo = input.photo() == null ? null : MealImage.fromBase64(input.photo());
    if (photo != null && !photo.valid()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_image");
    }
    var meal = Meal.of(userId, input, photo != null);
    if (photo != null) {
      photoRepository.save(MealPhoto.of(meal.id(), userId, photo.bytes()));
    }
    return mealRepository.save(meal);
  }

  @GetMapping("/meals/{id}/photo")
  public ResponseEntity<byte[]> findPhoto(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @PathVariable UUID id
  ) {
    var photo = photoRepository.findByIdAndUserId(id, userId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "no_photo"));
    return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(photo.jpeg());
  }

  @PutMapping("/meals/{id}")
  public Meal changeMeal(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @PathVariable UUID id, @Valid @RequestBody MealInput input
  ) {
    return mealRepository.save(findOwnMeal(id, userId).apply(input));
  }

  @DeleteMapping("/meals/{id}")
  public void deleteMeal(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @PathVariable UUID id
  ) {
    mealRepository.delete(findOwnMeal(id, userId));
    photoRepository.deleteById(id);
  }

  private Meal findOwnMeal(UUID id, UUID userId) {
    return mealRepository.findByIdAndUserId(id, userId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "no_meal"));
  }
}
