const DEFAULT_AI_ENDPOINT_TIMEOUT_MS = 45000;

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (
    error instanceof Error && error.name === "AbortError"
  );
}

export async function fetchAiEndpoint(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_AI_ENDPOINT_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const originalSignal = init.signal;

  const abortFromOriginalSignal = () => controller.abort();
  if (originalSignal?.aborted) {
    controller.abort();
  } else {
    originalSignal?.addEventListener("abort", abortFromOriginalSignal, { once: true });
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error("AI request timed out. Try again in a moment.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    originalSignal?.removeEventListener("abort", abortFromOriginalSignal);
  }
}
