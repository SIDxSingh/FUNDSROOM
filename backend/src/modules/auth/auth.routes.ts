import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { loginSchema } from './auth.schema';
import { loginService } from './auth.service';

const router = Router();

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginService(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

export default router;
