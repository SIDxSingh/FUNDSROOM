import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/db';

const router = Router();
router.use(authenticate);

router.get('/stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      totalProducts,
      totalChallans,
      confirmedChallans,
      draftChallans,
      lowStockProducts,
      recentChallans,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.product.count(),
      prisma.challan.count(),
      prisma.challan.count({ where: { status: 'confirmed' } }),
      prisma.challan.count({ where: { status: 'draft' } }),
      prisma.product.findMany().then(products => products.filter(p => p.currentStock <= p.minStockAlert).length),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    const challanRevenue = await prisma.challan.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'confirmed' },
    });

    res.json({
      success: true,
      data: {
        customers: { total: totalCustomers, active: activeCustomers },
        products: { total: totalProducts, lowStock: lowStockProducts },
        challans: {
          total: totalChallans,
          confirmed: confirmedChallans,
          draft: draftChallans,
          revenue: challanRevenue._sum.totalAmount || 0,
        },
        recentChallans,
      },
    });
  } catch (err) { next(err); }
});

export default router;
