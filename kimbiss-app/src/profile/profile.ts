import { api } from "../api/client.ts";
import type { Activity, Sex } from "../setup/targets.ts";

/** Mirrors the api's profile JSON (snake_case). */
export type Profile = {
  sex: Sex;
  birth_year: number;
  height_cm: number;
  start_weight_kg: number;
  goal_weight_kg: number;
  activity: Activity;
  weekly_change_kg: number;
  kcal_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
};

/** The profile, or null when the setup guide has not run yet. */
export function findProfile(): Promise<Profile | null> {
  return api<Profile>("GET", "/profile").catch((error) => {
    if (error.code === "no_profile") {
      return null;
    }
    throw error;
  });
}

export function saveProfile(profile: Profile): Promise<Profile> {
  return api<Profile>("PUT", "/profile", profile);
}
