import OpenAI from "openai";

export type FitnessAiTask = "chat" | "workout" | "nutrition";

export type FitnessAiProvider = {
  name: "groq" | "openai";
  apiKey: string;
  baseURL?: string;
  model: string;
};

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

const GROQ_TASK_MODELS: Record<FitnessAiTask, string> = {
  chat: "GROQ_CHAT_MODEL",
  workout: "GROQ_WORKOUT_MODEL",
  nutrition: "GROQ_NUTRITION_MODEL",
};

const OPENAI_TASK_MODELS: Record<FitnessAiTask, string> = {
  chat: "OPENAI_CHAT_MODEL",
  workout: "OPENAI_WORKOUT_MODEL",
  nutrition: "OPENAI_NUTRITION_MODEL",
};

function cleanApiKey(value: string | undefined) {
  const apiKey = value?.trim();
  if (!apiKey) return null;
  const lower = apiKey.toLowerCase();
  if (
    lower.includes("your_") ||
    lower.includes("your-") ||
    apiKey === "sk-your-key" ||
    apiKey === "gsk-your-key"
  ) {
    return null;
  }
  return apiKey;
}

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getFitnessAiProvider(task: FitnessAiTask): FitnessAiProvider | null {
  const groqKey = cleanApiKey(process.env.GROQ_API_KEY);
  if (groqKey) {
    return {
      name: "groq",
      apiKey: groqKey,
      baseURL: GROQ_BASE_URL,
      model:
        envValue(GROQ_TASK_MODELS[task]) ||
        envValue("GROQ_MODEL") ||
        DEFAULT_GROQ_MODEL,
    };
  }

  const openAiKey = cleanApiKey(process.env.OPENAI_API_KEY);
  if (openAiKey) {
    return {
      name: "openai",
      apiKey: openAiKey,
      model:
        envValue(OPENAI_TASK_MODELS[task]) ||
        envValue("OPENAI_CHAT_MODEL") ||
        DEFAULT_OPENAI_MODEL,
    };
  }

  return null;
}

export function createFitnessAiClient(provider: FitnessAiProvider) {
  return new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });
}

export function getCompletionTokenOptions(provider: FitnessAiProvider, maxTokens: number) {
  if (provider.name === "groq" && provider.model.startsWith("openai/gpt-oss")) {
    return {
      max_completion_tokens: maxTokens,
      reasoning_effort: "low" as const,
    };
  }

  return { max_tokens: maxTokens };
}

export function aiProviderLabel(provider: Pick<FitnessAiProvider, "name"> | FitnessAiProvider["name"]) {
  const name = typeof provider === "string" ? provider : provider.name;
  return name === "groq" ? "Groq" : "OpenAI";
}

export function aiErrorStatus(error: unknown) {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : 502;
}

export function aiErrorMessage(error: unknown, provider: Pick<FitnessAiProvider, "name"> | FitnessAiProvider["name"]) {
  const status = aiErrorStatus(error);
  const label = aiProviderLabel(provider);
  if (status === 400) return `${label} rejected the AI request. Check the configured model.`;
  if (status === 413) return `${label} request was too large.`;
  if (status === 401) return `${label} API key is invalid or not authorized.`;
  if (status === 403) return `${label} API key does not have access to this model.`;
  if (status === 429) return `${label} rate limit or quota was reached. Try again later.`;
  if (status >= 500) return `${label} service is temporarily unavailable. Try again later.`;
  return error instanceof Error ? error.message : `${label} request failed.`;
}

export function shouldUseLocalAiFallback(status: number) {
  return status === 401 || status === 403 || status === 413 || status === 429 || status >= 500;
}
