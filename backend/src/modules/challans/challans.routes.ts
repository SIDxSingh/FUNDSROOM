import { Router, Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth.middleware';
import { validate, validateQuery } from '../../middleware/validate.middleware';
import {
  createChallanSchema,
  updateChallanSchema,
  challanQuerySchema,
} from './challans.schema';
import * as service from './challans.service';

const router = Router();
router.use(authenticate);

router.get('/', validateQuery(challanQuerySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.getChallans(req.query as any);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getChallanById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post(
  '/',
  requireRole('admin', 'sales'),
  validate(createChallanSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await service.createChallan(req.body, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }
);

router.put(
  '/:id',
  requireRole('admin', 'sales'),
  validate(updateChallanSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await service.updateChallan(req.params.id, req.body, req.user!.userId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

router.patch(
  '/:id/confirm',
  requireRole('admin', 'sales'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await service.confirmChallan(req.params.id, req.user!.userId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

router.patch(
  '/:id/cancel',
  requireRole('admin', 'sales'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await service.cancelChallan(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

export default router;
