import { api } from "../api/client.ts";

export type MealInput = {
  name: string;
  eaten_at: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Meal = MealInput & { id: string };

export type EstimateItem = {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Estimate = EstimateItem & { items: EstimateItem[] };

/** Meals of the local day that `day` falls on, oldest first. */
export function findMeals(day: Date): Promise<Meal[]> {
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const to = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return api<Meal[]>("GET", `/meals?from=${from.getTime()}&to=${to.getTime() - 1}`);
}

export function saveMeal(input: MealInput, id?: string): Promise<Meal> {
  return id ? api("PUT", `/meals/${id}`, input) : api("POST", "/meals", input);
}

export function deleteMeal(id: string): Promise<void> {
  return api("DELETE", `/meals/${id}`);
}

export function estimateMeal(image: string, language: string): Promise<Estimate> {
  return api("POST", "/meals/estimate", { image, language });
}
