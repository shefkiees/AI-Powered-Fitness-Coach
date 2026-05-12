/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  chatRequestSchema,
  fitnessProfileRequestSchema,
  nutritionEstimateRequestSchema,
  workoutPlanRequestSchema,
} = require("../lib/apiValidation.js");
const { isStrictBackendModeValue } = require("../lib/backendMode.js");
const {
  consumePersistentRateLimit,
  shouldUseLocalRateLimitFallback,
} = require("../lib/persistentRateLimit.js");
const { resetRateLimitStore } = require("../lib/rateLimit.js");

function createFakeRateLimitCluster() {
  const rows = new Map();

  function clientFor(userId) {
    return {
      async rpc(name, params) {
        assert.equal(name, "consume_ai_endpoint_rate_limit");

        const now = Date.now();
        const key = `${userId}:${params.p_endpoint}`;
        const current = rows.get(key);

        if (!current || current.windowStart + params.p_window_ms <= now) {
          const next = {
            requestCount: 1,
            windowStart: now,
          };
          rows.set(key, next);
          return {
            data: [{
              allowed: true,
              request_count: next.requestCount,
              retry_after_ms: 0,
              window_start: new Date(next.windowStart).toISOString(),
              limit: params.p_limit,
            }],
            error: null,
          };
        }

        if (current.requestCount >= params.p_limit) {
          return {
            data: [{
              allowed: false,
              request_count: current.requestCount,
              retry_after_ms: Math.max(0, current.windowStart + params.p_window_ms - now),
              window_start: new Date(current.windowStart).toISOString(),
              limit: params.p_limit,
            }],
            error: null,
          };
        }

        current.requestCount += 1;
        rows.set(key, current);

        return {
          data: [{
            allowed: true,
            request_count: current.requestCount,
            retry_after_ms: 0,
            window_start: new Date(current.windowStart).toISOString(),
            limit: params.p_limit,
          }],
          error: null,
        };
      },
    };
  }

  return { clientFor };
}

test("profile validation accepts a sane payload", () => {
  const parsed = fitnessProfileRequestSchema.parse({
    age: "28",
    weight: "82",
    height_cm: "180",
    goal: "build_muscle",
    workout_days_per_week: "4",
    equipment_available: ["Dumbbells", " Bench "],
  });

  assert.equal(parsed.age, 28);
  assert.equal(parsed.weight, 82);
  assert.equal(parsed.height_cm, 180);
  assert.equal(parsed.workout_days_per_week, 4);
  assert.deepEqual(parsed.equipment_available, ["Dumbbells", "Bench"]);
});

test("profile validation rejects impossible workout days", () => {
  const result = fitnessProfileRequestSchema.safeParse({
    workout_days_per_week: 9,
  });

  assert.equal(result.success, false);
});

test("chat validation trims and rejects empty messages", () => {
  const ok = chatRequestSchema.parse({ message: "  Need a workout today  " });
  const bad = chatRequestSchema.safeParse({ message: "   " });

  assert.equal(ok.message, "Need a workout today");
  assert.equal(bad.success, false);
});

test("workout-plan validation allows optional embedded profile", () => {
  const parsed = workoutPlanRequestSchema.parse({
    profile: {
      goal: "lose_weight",
      preferred_workout_days: ["Mon", "Wed", "Fri"],
    },
  });

  assert.equal(parsed.profile.goal, "lose_weight");
  assert.deepEqual(parsed.profile.preferred_workout_days, ["Mon", "Wed", "Fri"]);
});

test("nutrition validation enforces a required input string", () => {
  const ok = nutritionEstimateRequestSchema.parse({ input: "2 eggs and 1 banana" });
  const bad = nutritionEstimateRequestSchema.safeParse({ input: "" });

  assert.equal(ok.input, "2 eggs and 1 banana");
  assert.equal(bad.success, false);
});

test("strict backend mode recognizes true-like values", () => {
  assert.equal(isStrictBackendModeValue("true"), true);
  assert.equal(isStrictBackendModeValue("1"), true);
  assert.equal(isStrictBackendModeValue("on"), true);
  assert.equal(isStrictBackendModeValue("false"), false);
  assert.equal(isStrictBackendModeValue(undefined), false);
});

test("persistent limiter allows a request under the limit", async () => {
  const cluster = createFakeRateLimitCluster();
  const result = await consumePersistentRateLimit({
    supabase: cluster.clientFor("user-a"),
    userId: "user-a",
    endpoint: "api-chat",
    limit: 2,
    windowMs: 60000,
    allowLocalFallback: false,
  });

  assert.equal(result.ok, true);
  assert.equal(result.requestCount, 1);
});

test("persistent limiter blocks a request over the limit", async () => {
  const cluster = createFakeRateLimitCluster();
  const supabase = cluster.clientFor("user-a");

  await consumePersistentRateLimit({
    supabase,
    userId: "user-a",
    endpoint: "api-chat",
    limit: 1,
    windowMs: 60000,
    allowLocalFallback: false,
  });

  const blocked = await consumePersistentRateLimit({
    supabase,
    userId: "user-a",
    endpoint: "api-chat",
    limit: 1,
    windowMs: 60000,
    allowLocalFallback: false,
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfterMs > 0, true);
});

test("persistent limiter keeps separate limits per endpoint", async () => {
  const cluster = createFakeRateLimitCluster();
  const supabase = cluster.clientFor("user-a");

  await consumePersistentRateLimit({
    supabase,
    userId: "user-a",
    endpoint: "api-chat",
    limit: 1,
    windowMs: 60000,
    allowLocalFallback: false,
  });

  const otherEndpoint = await consumePersistentRateLimit({
    supabase,
    userId: "user-a",
    endpoint: "api-workout-plan-generate",
    limit: 1,
    windowMs: 60000,
    allowLocalFallback: false,
  });

  assert.equal(otherEndpoint.ok, true);
  assert.equal(otherEndpoint.requestCount, 1);
});

test("persistent limiter keeps separate limits per user", async () => {
  const cluster = createFakeRateLimitCluster();

  await consumePersistentRateLimit({
    supabase: cluster.clientFor("user-a"),
    userId: "user-a",
    endpoint: "api-chat",
    limit: 1,
    windowMs: 60000,
    allowLocalFallback: false,
  });

  const otherUser = await consumePersistentRateLimit({
    supabase: cluster.clientFor("user-b"),
    userId: "user-b",
    endpoint: "api-chat",
    limit: 1,
    windowMs: 60000,
    allowLocalFallback: false,
  });

  assert.equal(otherUser.ok, true);
  assert.equal(otherUser.requestCount, 1);
});

test("persistent limiter falls back locally when the database limiter is unavailable", async () => {
  resetRateLimitStore();

  const result = await consumePersistentRateLimit({
    supabase: {
      async rpc() {
        return {
          data: null,
          error: new Error("Function not found"),
        };
      },
    },
    userId: "user-a",
    endpoint: "api-coach-exercise-substitution",
    limit: 2,
    windowMs: 60000,
  });

  assert.equal(result.ok, true);
  assert.equal(result.source, "local");
  assert.equal(result.requestCount, 1);
});

test("local rate limit fallback can be disabled explicitly", () => {
  assert.equal(shouldUseLocalRateLimitFallback({ NODE_ENV: "production" }), true);
  assert.equal(
    shouldUseLocalRateLimitFallback({
      NODE_ENV: "production",
      AI_RATE_LIMIT_ALLOW_LOCAL_FALLBACK: "false",
    }),
    false,
  );
});
