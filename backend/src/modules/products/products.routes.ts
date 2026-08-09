import { Router, Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthRequest } from '../../middleware/auth.middleware';
import { validate, validateQuery } from '../../middleware/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  stockMovementSchema,
  stockMovementQuerySchema,
  categorySchema,
} from './products.schema';
import * as service from './products.service';

const router = Router();
router.use(authenticate);

// ─── Categories ─────────────────────────────────────────────────────────────
router.get('/categories', async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await service.getCategories();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/categories', requireRole('admin', 'warehouse'), validate(categorySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.createCategory(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Stock Movements ─────────────────────────────────────────────────────────
router.get('/stock-movements', validateQuery(stockMovementQuerySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.getStockMovements(req.query as any);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/stock-movements', requireRole('admin', 'warehouse'), validate(stockMovementSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.createStockMovement(req.body, req.user!.userId);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Low Stock ───────────────────────────────────────────────────────────────
router.get('/low-stock', async (_req, res: Response, next: NextFunction) => {
  try {
    const data = await service.getLowStockProducts();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Products ────────────────────────────────────────────────────────────────
router.get('/', validateQuery(productQuerySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.getProducts(req.query as any);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.getProductById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/', requireRole('admin', 'warehouse'), validate(createProductSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.createProduct(req.body, req.user!.userId);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('admin', 'warehouse'), validate(updateProductSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await service.updateProduct(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
});

export default router;
