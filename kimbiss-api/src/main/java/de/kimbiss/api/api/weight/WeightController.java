package de.kimbiss.api.api.weight;

import de.kimbiss.api.api.ApiException;
import de.kimbiss.api.api.security.AuthenticationFilter;
import de.kimbiss.api.weight.WeightEntry;
import de.kimbiss.api.weight.WeightEntryRepository;
import de.kimbiss.api.weight.WeightInput;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The weight log, oldest first.
 * ponytail: always the whole history, a few hundred rows at most; page it if
 * that ever grows.
 */
@RestController
@RequiredArgsConstructor
public final class WeightController {
  private final WeightEntryRepository weightEntryRepository;

  @GetMapping("/weights")
  public List<WeightEntry> findWeights(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId
  ) {
    return weightEntryRepository.findByUserIdOrderByMeasuredAt(userId);
  }

  @PostMapping("/weights")
  public WeightEntry addWeight(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @Valid @RequestBody WeightInput input
  ) {
    return weightEntryRepository.save(WeightEntry.of(userId, input));
  }

  @DeleteMapping("/weights/{id}")
  public void deleteWeight(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @PathVariable UUID id
  ) {
    weightEntryRepository.delete(weightEntryRepository.findByIdAndUserId(id, userId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "no_weight")));
  }
}
