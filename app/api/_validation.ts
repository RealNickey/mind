import { NextResponse } from 'next/server';
import type { z } from 'zod';

type ParseJsonBodyOptions = {
  invalidJsonMessage?: string;
  invalidBodyMessage?: string;
  includeValidationDetails?: boolean;
};

type ParseJsonBodyResult<TSchema extends z.ZodTypeAny> =
  | { success: true; data: z.infer<TSchema> }
  | { success: false; response: NextResponse };

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema,
  options?: ParseJsonBodyOptions
): Promise<ParseJsonBodyResult<TSchema>> {
  let rawBody: unknown;

  try {
    rawBody = await req.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: options?.invalidJsonMessage ?? 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }

  const parseResult = schema.safeParse(rawBody);
  if (!parseResult.success) {
    const errorPayload: {
      error: string;
      details?: ReturnType<typeof parseResult.error.flatten>;
    } = {
      error: options?.invalidBodyMessage ?? 'Invalid payload',
    };

    if (options?.includeValidationDetails !== false) {
      errorPayload.details = parseResult.error.flatten();
    }

    return {
      success: false,
      response: NextResponse.json(errorPayload, { status: 400 }),
    };
  }

  return { success: true, data: parseResult.data };
}
