package de.kimbiss.api.weight;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeightEntryRepository extends JpaRepository<WeightEntry, UUID> {
  List<WeightEntry> findByUserIdOrderByMeasuredAt(UUID userId);

  Optional<WeightEntry> findByIdAndUserId(UUID id, UUID userId);
}
