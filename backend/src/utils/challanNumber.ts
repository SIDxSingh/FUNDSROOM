import { prisma } from '../config/db';

export async function generateChallanNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `CH-${year}${month}`;

  // Count challans this month
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.challan.count({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${seq}`;
}
