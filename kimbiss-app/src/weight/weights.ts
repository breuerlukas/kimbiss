import { api } from "../api/client.ts";

export type WeightEntry = { id: string; measured_at: number; kg: number };

export function findWeights(): Promise<WeightEntry[]> {
  return api("GET", "/weights");
}

export function addWeight(kg: number, measuredAt = Date.now()): Promise<WeightEntry> {
  return api("POST", "/weights", { kg, measured_at: measuredAt });
}

export function deleteWeight(id: string): Promise<void> {
  return api("DELETE", `/weights/${id}`);
}

/**
 * How far from the start weight toward the goal `kg` is, 0 to 1, for gaining
 * and losing alike. A goal equal to the start counts as reached.
 */
export function goalProgress(startKg: number, goalKg: number, kg: number): number {
  return goalKg === startKg ? 1 : Math.min(1, Math.max(0, (kg - startKg) / (goalKg - startKg)));
}
