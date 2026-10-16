package de.kimbiss.api.user.session;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Opaque bearer tokens: 32 random bytes the client keeps, looked up by their
 * hash. No signing key to configure and every device can be revoked alone.
 */
@Component
@RequiredArgsConstructor
public final class SessionTokens {
  private final SessionRepository sessionRepository;
  private final SecureRandom random = new SecureRandom();

  /** Opens a session and returns the token, which is shown exactly once. */
  public String open(UUID userId) {
    var bytes = new byte[32];
    random.nextBytes(bytes);
    var token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    sessionRepository.save(Session.create(hash(token), userId,
      System.currentTimeMillis()));
    return token;
  }

  public Optional<UUID> findUserId(String token) {
    return sessionRepository.findById(hash(token)).map(Session::userId);
  }

  public void close(String token) {
    sessionRepository.deleteById(hash(token));
  }

  private String hash(String token) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
        .digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException(exception);
    }
  }
}
