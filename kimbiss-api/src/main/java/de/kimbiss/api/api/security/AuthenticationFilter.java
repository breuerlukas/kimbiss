package de.kimbiss.api.api.security;

import de.kimbiss.api.user.session.SessionTokens;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Every route except {@code /auth/} and {@code /health} needs {@code Authorization: Bearer <token>}
 * of an open session. The caller's id lands in the {@link #USER_ID} request
 * attribute, so controllers take it as {@code @RequestAttribute}. 401 otherwise.
 */
@Component
@RequiredArgsConstructor
public final class AuthenticationFilter extends OncePerRequestFilter {
  public static final String USER_ID = "user_id";
  private static final String PREFIX = "Bearer ";

  private final SessionTokens sessionTokens;

  @Override
  protected void doFilterInternal(
    HttpServletRequest request, HttpServletResponse response, FilterChain chain
  ) throws ServletException, IOException {
    var userId = sessionTokens.findUserId(token(request));
    if (userId.isEmpty()) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }
    request.setAttribute(USER_ID, userId.get());
    chain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    var path = request.getServletPath();
    return path.startsWith("/auth/") || path.equals("/health");
  }

  /** The bearer token, or an empty string that matches no session. */
  public static String token(HttpServletRequest request) {
    var header = request.getHeader("Authorization");
    if (header == null || !header.startsWith(PREFIX)) {
      return "";
    }
    return header.substring(PREFIX.length());
  }
}
