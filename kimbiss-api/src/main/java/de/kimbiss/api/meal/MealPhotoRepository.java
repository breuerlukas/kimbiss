package de.kimbiss.api.meal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MealPhotoRepository extends JpaRepository<MealPhoto, UUID> {
  Optional<MealPhoto> findByIdAndUserId(UUID id, UUID userId);
}
