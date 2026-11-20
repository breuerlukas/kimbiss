import type { Meal } from "../meal/meals.ts";

export type DayTotals = { kcal: number; protein: number; carbs: number; fat: number };
export type Tone = "none" | "under" | "on" | "over";

/** The month's meals summed per day of the month: index 0 is the 1st. */
export function totalsByDay(meals: Meal[], month: Date): DayTotals[] {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const totals = Array.from({ length: days }, () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 }));
  for (const meal of meals) {
    const eaten = new Date(meal.eaten_at);
    if (eaten.getFullYear() === month.getFullYear() && eaten.getMonth() === month.getMonth()) {
      const day = totals[eaten.getDate() - 1];
      day.kcal += meal.kcal;
      day.protein += meal.protein;
      day.carbs += meal.carbs;
      day.fat += meal.fat;
    }
  }
  return totals;
}

/** Below 95 % of the target under, up to 105 % on it, above over; nothing eaten none. */
export function tone(kcal: number, target: number): Tone {
  if (kcal <= 0) {
    return "none";
  }
  const share = kcal / target;
  return share < 0.95 ? "under" : share <= 1.05 ? "on" : "over";
}

/**
 * Average kcal and days on target over the finished days with meals: days
 * before `today` (a later month counts none), today itself not yet.
 */
export function monthStats(totals: DayTotals[], month: Date, today: Date, target: number) {
  const finished = totals.filter((day, index) =>
    day.kcal > 0 && new Date(month.getFullYear(), month.getMonth(), index + 1) < startOfDay(today));
  const sum = finished.reduce((total, day) => total + day.kcal, 0);
  return {
    logged: finished.length,
    average: finished.length ? Math.round(sum / finished.length) : 0,
    onTarget: finished.filter((day) => tone(day.kcal, target) === "on").length,
  };
}

/** Blank cells before the 1st in a week from Monday to Sunday. */
export function leadingBlanks(month: Date): number {
  return (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
