package de.kimbiss.api.meal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MealRepository extends JpaRepository<Meal, UUID> {
  List<Meal> findByUserIdAndEatenAtBetweenOrderByEatenAt(
    UUID userId, long from, long to);

  Optional<Meal> findByIdAndUserId(UUID id, UUID userId);
}
