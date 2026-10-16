package de.kimbiss.api.api.profile;

import de.kimbiss.api.api.ApiException;
import de.kimbiss.api.api.security.AuthenticationFilter;
import de.kimbiss.api.profile.Profile;
import de.kimbiss.api.profile.ProfileInput;
import de.kimbiss.api.profile.ProfileRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** 404 {@code no_profile} tells the app to open the setup guide. */
@RestController
@RequiredArgsConstructor
public final class ProfileController {
  private final ProfileRepository profileRepository;

  @GetMapping("/profile")
  public Profile findProfile(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId
  ) {
    return profileRepository.findById(userId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "no_profile"));
  }

  @PutMapping("/profile")
  public Profile saveProfile(
    @RequestAttribute(AuthenticationFilter.USER_ID) UUID userId,
    @Valid @RequestBody ProfileInput input
  ) {
    var profile = profileRepository.findById(userId)
      .map(existing -> existing.apply(input))
      .orElseGet(() -> Profile.of(userId, input));
    return profileRepository.save(profile);
  }
}
