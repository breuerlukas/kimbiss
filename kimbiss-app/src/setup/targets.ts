export type Sex = "female" | "male";
export type Activity = "sedentary" | "light" | "moderate" | "active";

export type Answers = {
  sex: Sex;
  birthYear: number;
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  activity: Activity;
  weeklyChangeKg: number;
};

export type Targets = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  maintenanceKcal: number;
  /** Weeks until the goal weight at the suggested intake, null when holding. */
  weeks: number | null;
};

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};
export const PACES = [
  { id: "calm", kg: 0.25 },
  { id: "balanced", kg: 0.5 },
  { id: "brisk", kg: 0.75 },
];

export const KCAL_PER_KG = 7700;
const MIN_KCAL: Record<Sex, number> = { female: 1200, male: 1500 };
const PROTEIN_PER_KG = 1.8;
const FAT_SHARE = 0.3;
const HOLD_TOLERANCE_KG = 0.5;
const MIN_BMI = 18.5;

/** -1 to lose, 1 to gain, 0 when the goal is within half a kilo. */
export function direction(answers: Answers): number {
  const difference = answers.goalWeightKg - answers.startWeightKg;
  return Math.abs(difference) < HOLD_TOLERANCE_KG ? 0 : Math.sign(difference);
}

/** The lowest goal the guide accepts: a BMI of 18.5 at that height. */
export function lowestGoalKg(heightCm: number): number {
  return Math.ceil(MIN_BMI * (heightCm / 100) ** 2);
}

/**
 * Mifflin-St Jeor resting energy times the activity factor gives the
 * maintenance intake; the pace shifts it by 7700 kcal per kilo and week, never
 * below a safe floor. Protein follows the goal weight, fat is 30 % of the
 * energy and carbohydrates fill the rest.
 */
export function suggestTargets(answers: Answers, currentYear: number): Targets {
  const age = currentYear - answers.birthYear;
  const resting = 10 * answers.startWeightKg + 6.25 * answers.heightCm
    - 5 * age + (answers.sex === "male" ? 5 : -161);
  const maintenanceKcal = resting * ACTIVITY_FACTORS[answers.activity];
  const shift = direction(answers) * answers.weeklyChangeKg * KCAL_PER_KG / 7;
  const kcal = roundTo(Math.max(MIN_KCAL[answers.sex], maintenanceKcal + shift), 10);
  const protein = Math.round(PROTEIN_PER_KG * answers.goalWeightKg);
  const fat = Math.round(kcal * FAT_SHARE / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return {
    kcal, protein, carbs, fat,
    maintenanceKcal: Math.round(maintenanceKcal),
    weeks: weeksToGoal(answers, kcal - maintenanceKcal),
  };
}

function weeksToGoal(answers: Answers, dailyShift: number): number | null {
  const weeklyKg = Math.abs(dailyShift) * 7 / KCAL_PER_KG;
  if (direction(answers) === 0 || weeklyKg < 0.01) {
    return null;
  }
  return Math.ceil(Math.abs(answers.goalWeightKg - answers.startWeightKg) / weeklyKg);
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}
