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
