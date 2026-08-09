import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error(`[ERROR] ${status} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    message,
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}
