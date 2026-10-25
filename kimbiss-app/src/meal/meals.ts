import { api, apiImage } from "../api/client.ts";

export type EstimateItem = {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** `items` are the foods of a photo estimate; `photo` the base64 JPEG, sent only on the first save. */
export type MealInput = {
  name: string;
  eaten_at: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  items: EstimateItem[];
  photo?: string;
};

export type Meal = Omit<MealInput, "photo"> & { id: string; has_photo: boolean };

/** Where a running estimate is: `looking`, `searching` (the query as detail) or `estimating` (a food's name). */
export type EstimateStep = { step?: string; detail?: string };

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

export function findEstimateStep(): Promise<EstimateStep> {
  return api("GET", "/meals/estimate/progress");
}

/** The saved meal's photo as an object URL; the caller revokes it. */
export function findMealPhoto(id: string): Promise<string> {
  return apiImage(`/meals/${id}/photo`);
}
