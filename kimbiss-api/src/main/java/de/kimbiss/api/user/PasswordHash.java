package de.kimbiss.api.user;

import org.springframework.stereotype.Component;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * PBKDF2-HMAC-SHA256 from the JDK, at the OWASP iteration count. Stored as
 * {@code iterations:salt:hash} so the count can rise later without breaking
 * existing accounts.
 */
@Component
public final class PasswordHash {
  private static final int ITERATIONS = 600_000;
  private static final int KEY_BITS = 256;

  private final SecureRandom random = new SecureRandom();

  public String hash(String password) {
    var salt = new byte[16];
    random.nextBytes(salt);
    return ITERATIONS + ":" + encode(salt) + ":"
      + encode(derive(password, salt, ITERATIONS));
  }

  /** Constant-time comparison, so timing tells nothing about the hash. */
  public boolean matches(String password, String stored) {
    var parts = stored.split(":");
    var expected = Base64.getDecoder().decode(parts[2]);
    var actual = derive(password, Base64.getDecoder().decode(parts[1]),
      Integer.parseInt(parts[0]));
    return MessageDigest.isEqual(expected, actual);
  }

  private byte[] derive(String password, byte[] salt, int iterations) {
    var spec = new PBEKeySpec(password.toCharArray(), salt, iterations, KEY_BITS);
    try {
      return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        .generateSecret(spec).getEncoded();
    } catch (GeneralSecurityException exception) {
      throw new IllegalStateException(exception);
    } finally {
      spec.clearPassword();
    }
  }

  private String encode(byte[] bytes) {
    return Base64.getEncoder().encodeToString(bytes);
  }
}
