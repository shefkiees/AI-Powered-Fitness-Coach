/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require("zod");

function optionalTrimmedString(maxLength) {
  return z.preprocess(
    (value) => {
      if (value === undefined || value === null) return undefined;
      const text = String(value).trim();
      return text === "" ? undefined : text;
    },
    z.string().max(maxLength).optional(),
  );
}

function optionalNumber(min, max) {
  return z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return value;
    },
    z.coerce.number().finite().min(min).max(max).optional(),
  );
}

function optionalStringArray(maxItems = 10, maxItemLength = 40) {
  return z.preprocess(
    (value) => {
      if (!Array.isArray(value)) return undefined;
      return value
        .map((item) => String(item).trim())
        .filter(Boolean);
    },
    z.array(z.string().max(maxItemLength)).max(maxItems).optional(),
  );
}

const profileInputSchema = z
  .object({
    age: optionalNumber(13, 120),
    weight_kg: optionalNumber(20, 500),
    weight: optionalNumber(20, 500),
    height_cm: optionalNumber(80, 280),
    height: optionalNumber(80, 280),
    gender: optionalTrimmedString(40),
    goal: optionalTrimmedString(80),
    fitness_level: optionalTrimmedString(40),
    level: optionalTrimmedString(40),
    activity_level: optionalTrimmedString(40),
    workout_days_per_week: optionalNumber(1, 7),
    dietary_preference: optionalTrimmedString(80),
    injuries: optionalTrimmedString(500),
    preferred_workout_days: optionalStringArray(7, 20),
    equipment_available: optionalStringArray(20, 60),
  })
  .strip();

const fitnessProfileRequestSchema = profileInputSchema;

const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1, "Message cannot be empty.").max(1600, "Keep your coach message under 1600 characters."),
  })
  .strip();

const workoutPlanRequestSchema = z
  .object({
    profile: profileInputSchema.optional(),
  })
  .strip();

const nutritionEstimateRequestSchema = z
  .object({
    input: z.string().trim().min(1, "Food or drink text is required.").max(500, "Keep the food log under 500 characters."),
  })
  .strip();

function formatZodError(error) {
  const flattened = z.flattenError(error);
  const messages = [
    ...flattened.formErrors,
    ...Object.values(flattened.fieldErrors).flat().filter(Boolean),
  ];
  return messages[0] || "Invalid request body.";
}

module.exports = {
  chatRequestSchema,
  fitnessProfileRequestSchema,
  formatZodError,
  nutritionEstimateRequestSchema,
  profileInputSchema,
  workoutPlanRequestSchema,
};
