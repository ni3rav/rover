import { z } from "zod";

export const isTruthy = <T>(
  value: T | 0 | "" | false | null | undefined,
): value is T => Boolean(value);

export type Success<T> = {
  data: T;
  error: null;
};

export type Failure<E> = {
  data: null;
  error: E;
};

export type Result<T, E> = Success<T> | Failure<E>;

export async function tryCatch<T, E = unknown>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export function parseEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  env: Record<string, string | undefined>,
): z.infer<typeof schema> {
  const input: Record<string, string | undefined> = {};

  // Only pass keys the schema knows about so strict parsing is meaningful.
  for (const key of Object.keys(schema.shape)) {
    input[key] = env[key];
  }

  return schema.strict().parse(input);
}
