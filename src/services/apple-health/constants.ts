export const QUANTITY_TYPES = {
  heart_rate: "HKQuantityTypeIdentifierHeartRate",
  resting_heart_rate: "HKQuantityTypeIdentifierRestingHeartRate",
  walking_heart_rate_average: "HKQuantityTypeIdentifierWalkingHeartRateAverage",
  heart_rate_variability_sdnn: "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
  oxygen_saturation: "HKQuantityTypeIdentifierOxygenSaturation",
  vo2max: "HKQuantityTypeIdentifierVO2Max",
  step_count: "HKQuantityTypeIdentifierStepCount",
} as const;

export type QuantityOutputName = keyof typeof QUANTITY_TYPES;
export type SpecialOutputName = "sleep_analysis" | "workouts";
export type SupportedOutputType = QuantityOutputName | SpecialOutputName;

export const SPECIAL_TYPES = ["sleep_analysis", "workouts"] as const;

export const SUPPORTED_TYPES = [
  ...Object.keys(QUANTITY_TYPES),
  ...SPECIAL_TYPES,
] as SupportedOutputType[];

export const SLEEP_STAGE_MAP: Record<string, string> = {
  HKCategoryValueSleepAnalysisInBed: "in_bed",
  HKCategoryValueSleepAnalysisAsleep: "asleep",
  HKCategoryValueSleepAnalysisAsleepCore: "asleep_core",
  HKCategoryValueSleepAnalysisAsleepDeep: "asleep_deep",
  HKCategoryValueSleepAnalysisAsleepREM: "asleep_rem",
  HKCategoryValueSleepAnalysisAwake: "awake",
};

export const WORKOUT_TYPE_MAP: Record<string, string> = {
  HKWorkoutActivityTypeWalking: "walking",
  HKWorkoutActivityTypeRunning: "running",
  HKWorkoutActivityTypeCycling: "cycling",
  HKWorkoutActivityTypeHiking: "hiking",
};

export const OUTPUT_HEADERS: Record<SupportedOutputType, readonly string[]> = {
  heart_rate: ["source_name", "start_date", "end_date", "value", "unit"],
  resting_heart_rate: ["source_name", "start_date", "end_date", "value", "unit"],
  walking_heart_rate_average: [
    "source_name",
    "start_date",
    "end_date",
    "value",
    "unit",
  ],
  heart_rate_variability_sdnn: [
    "source_name",
    "start_date",
    "end_date",
    "value",
    "unit",
  ],
  oxygen_saturation: ["source_name", "start_date", "end_date", "value", "unit"],
  vo2max: ["source_name", "start_date", "end_date", "value", "unit"],
  step_count: ["source_name", "start_date", "end_date", "value", "unit"],
  sleep_analysis: [
    "source_name",
    "start_date",
    "end_date",
    "sleep_stage",
    "duration_minutes",
  ],
  workouts: [
    "source_name",
    "start_date",
    "end_date",
    "workout_type",
    "duration_minutes",
    "total_energy_kcal",
    "total_distance_km",
  ],
};

export const QUANTITY_TYPE_BY_IDENTIFIER = Object.fromEntries(
  Object.entries(QUANTITY_TYPES).map(([outputName, identifier]) => [
    identifier,
    outputName,
  ]),
) as Record<string, QuantityOutputName>;

export const DATE_FORMAT =
  /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) ([+-]\d{4})$/;
