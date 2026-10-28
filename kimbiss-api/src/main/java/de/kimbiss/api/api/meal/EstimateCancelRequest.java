package de.kimbiss.api.api.meal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The app's id of the run to call off, as its estimate request carried it. */
public record EstimateCancelRequest(@NotNull @Size(max = 64) String runId) {
}
