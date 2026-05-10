import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Check for ZodError by shape, not instanceof (avoids the import)
  if (
    err !== null &&
    typeof err === 'object' &&
    'errors' in err &&
    Array.isArray((err as any).errors)
  ) {
    return res.status(400).json({
      error: 'Invalid sync payload',
      issues: (err as any).errors.map((e: any) => ({
        path:    e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }

  res.status(500).json({ error: 'Unknown server error' });
};