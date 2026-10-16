package de.kimbiss.api.api.auth;

import de.kimbiss.api.api.ApiException;
import de.kimbiss.api.api.security.AuthenticationFilter;
import de.kimbiss.api.user.PasswordHash;
import de.kimbiss.api.user.SignInThrottle;
import de.kimbiss.api.user.User;
import de.kimbiss.api.user.UserRepository;
import de.kimbiss.api.user.session.SessionTokens;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.UUID;

/**
 * Accounts and sessions. Sign-up is invite only: the code comes from
 * {@code KIMBISS_INVITE_CODE}, and without one nobody can sign up, so a public
 * server never spends its estimates on strangers.
 */
@RestController
@RequiredArgsConstructor
public final class AuthenticationController {
  private final UserRepository userRepository;
  private final PasswordHash passwordHash;
  private final SignInThrottle signInThrottle;
  private final SessionTokens sessionTokens;
  @Value("${kimbiss.invite-code}")
  private String inviteCode;

  @PostMapping("/auth/signup")
  public Map<String, String> signUp(@Valid @RequestBody Credentials credentials) {
    if (!inviteMatches(credentials.inviteCode())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "invalid_invite_code");
    }
    if (userRepository.findByName(credentials.name()).isPresent()) {
      throw new ApiException(HttpStatus.CONFLICT, "name_taken");
    }
    var user = userRepository.save(User.create(UUID.randomUUID(),
      credentials.name(), passwordHash.hash(credentials.password()),
      System.currentTimeMillis()));
    return Map.of("token", sessionTokens.open(user.id()));
  }

  /** The same answer for an unknown name and a wrong password. */
  @PostMapping("/auth/signin")
  public Map<String, String> signIn(@Valid @RequestBody Credentials credentials) {
    if (signInThrottle.locked(credentials.name())) {
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "too_many_attempts");
    }
    var user = userRepository.findByName(credentials.name())
      .filter(found -> passwordHash.matches(credentials.password(), found.password()))
      .orElseThrow(() -> rejectSignIn(credentials.name()));
    signInThrottle.succeed(credentials.name());
    return Map.of("token", sessionTokens.open(user.id()));
  }

  @DeleteMapping("/session")
  public void signOut(HttpServletRequest request) {
    sessionTokens.close(AuthenticationFilter.token(request));
  }

  private ApiException rejectSignIn(String name) {
    signInThrottle.fail(name);
    return new ApiException(HttpStatus.UNAUTHORIZED, "wrong_credentials");
  }

  /** Constant time, and an unset code matches nothing. */
  private boolean inviteMatches(String given) {
    return !inviteCode.isBlank() && given != null && MessageDigest.isEqual(
      inviteCode.getBytes(StandardCharsets.UTF_8),
      given.getBytes(StandardCharsets.UTF_8));
  }
}
