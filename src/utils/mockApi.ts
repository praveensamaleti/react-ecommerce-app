export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDelay<T>(
  fn: () => T,
  ms = 450
): Promise<ApiResult<T>> {
  try {
    await sleep(ms);
    return { ok: true, data: fn() };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}

