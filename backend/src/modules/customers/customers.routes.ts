import { Router, Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth.middleware';
import { validate, validateQuery } from '../../middleware/validate.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  followUpSchema,
  customerQuerySchema,
} from './customers.schema';
import * as service from './customers.service';

const router = Router();
router.use(authenticate);

router.get('/', validateQuery(customerQuerySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.getCustomers(req.query as any);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getCustomerById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post(
  '/',
  requireRole('admin', 'sales'),
  validate(createCustomerSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await service.createCustomer(req.body, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }
);

router.put(
  '/:id',
  requireRole('admin', 'sales'),
  validate(updateCustomerSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await service.updateCustomer(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
);

router.delete(
  '/:id',
  requireRole('admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await service.deleteCustomer(req.params.id);
      res.json({ success: true, message: 'Customer deleted' });
    } catch (err) { next(err); }
  }
);

router.post(
  '/:id/followups',
  requireRole('admin', 'sales'),
  validate(followUpSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await service.addFollowUp(req.params.id, req.body, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }
);

router.get('/:id/followups', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getFollowUps(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
