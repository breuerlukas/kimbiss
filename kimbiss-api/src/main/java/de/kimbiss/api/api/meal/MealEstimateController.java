package de.kimbiss.api.api.meal;

import de.kimbiss.api.api.ApiException;
import de.kimbiss.api.api.security.AuthenticationFilter;
import de.kimbiss.api.meal.estimate.EstimateQuota;
import de.kimbiss.api.meal.estimate.MealEstimate;
import de.kimbiss.api.meal.estimate.MealEstimateProgress;
import de.kimbiss.api.meal.estimate.MealEstimateStep;
import de.kimbiss.api.meal.estimate.MealImage;
import de.kimbiss.api.meal.estimate.MealPhotoEstimator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Estimates a meal from a photo. Nothing is stored here: the app shows the
 * guess, the user corrects it and saves it, photo and foods included, as a
 * normal meal.
 */
@RestController
@RequiredArgsConstructor
public final class MealEstimateController {
  private static final Logger LOGGER =
    LoggerFactory.getLogger(MealEstimateController.class);

  private final MealPhotoEstimator estimator;
  private final EstimateQuota quota;
  private final MealEstimateProgress progress;

  @PostMapping("/meals/estimate")
  public CompletableFuture<Map<String, Object>> estimateMeal(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @Valid @RequestBody EstimateRequest request
  ) {
    var image = MealImage.fromBase64(request.image());
    if (!image.valid()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_image");
    }
    if (!quota.take(userId)) {
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "estimate_limit");
    }
    progress.report(userId, MealEstimateStep.looking());
    return estimator.estimate(image, request.language(),
        step -> progress.report(userId, step))
      .whenComplete((estimate, failure) -> progress.finish(userId))
      .thenApply(MealEstimate::information)
      .exceptionally(this::estimateFailed);
  }

  /**
   * The step the user's running estimate is at ({@code step}, {@code detail}),
   * polled by the app while it waits; empty when none runs.
   */
  @GetMapping("/meals/estimate/progress")
  public Map<String, Object> estimateProgress(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId
  ) {
    return progress.current(userId).map(MealEstimateStep::information)
      .orElse(Map.of());
  }

  /** The app can only say it failed, so the reason goes to the server log. */
  private Map<String, Object> estimateFailed(Throwable failure) {
    LOGGER.error("Meal photo estimate failed", failure);
    throw new ApiException(HttpStatus.BAD_GATEWAY, "estimate_unavailable");
  }
}
