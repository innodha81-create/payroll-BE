import { Request, Response, NextFunction } from 'express';

export function validateAddCountry(req: Request, res: Response, next: NextFunction): void {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Please provide a valid country name.'
    });
    return;
  }

  next();
}

export function validateCountryId(req: Request, res: Response, next: NextFunction): void {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Country ID is required.'
    });
    return;
  }

  next();
}
