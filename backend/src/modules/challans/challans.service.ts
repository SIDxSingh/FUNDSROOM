import { prisma } from '../../config/db';
import { paginate, paginatedResponse } from '../../utils/pagination';
import { generateChallanNumber } from '../../utils/challanNumber';
import { CreateChallanInput, UpdateChallanInput } from './challans.schema';
import { Prisma } from '@prisma/client';

const challanInclude = {
  customer: { select: { id: true, name: true, mobile: true, businessName: true } },
  createdBy: { select: { name: true } },
  items: {
    include: { product: { select: { id: true, name: true, sku: true } } },
  },
};

export async function getChallans(query: {
  page: string;
  limit: string;
  status?: 'draft' | 'confirmed' | 'cancelled';
  customerId?: string;
  search?: string;
}) {
  const page = parseInt(query.page, 10);
  const limit = parseInt(query.limit, 10);
  const { skip, take } = paginate(page, limit);

  const where: Prisma.ChallanWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.customerId) where.customerId = query.customerId;
  if (query.search) {
    where.OR = [
      { challanNumber: { contains: query.search, mode: 'insensitive' } },
      { customer: { name: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.challan.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: challanInclude,
    }),
    prisma.challan.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: challanInclude,
  });
  if (!challan) throw Object.assign(new Error('Challan not found'), { status: 404 });
  return challan;
}

export async function createChallan(data: CreateChallanInput, createdById: string) {
  // 1. Validate customer
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });

  // 2. Validate & fetch products
  const productIds = data.items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    throw Object.assign(new Error('One or more products not found'), { status: 404 });
  }

  const productMap = new Map(products.map(p => [p.id, p]));

  // 3. If confirming immediately, check stock
  if (data.status === 'confirmed') {
    const stockErrors: string[] = [];
    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      if (product.currentStock < item.quantity) {
        stockErrors.push(`${product.name} (${product.sku}): available ${product.currentStock}, requested ${item.quantity}`);
      }
    }
    if (stockErrors.length > 0) {
      throw Object.assign(new Error(`Insufficient stock:\n${stockErrors.join('\n')}`), { status: 409 });
    }
  }

  // 4. Build item data with snapshots
  let totalQuantity = 0;
  let totalAmount = new Prisma.Decimal(0);

  const itemsData = data.items.map(item => {
    const product = productMap.get(item.productId)!;
    const amount = product.unitPrice.mul(item.quantity);
    totalQuantity += item.quantity;
    totalAmount = totalAmount.add(amount);
    return {
      productId: item.productId,
      productSnapshot: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.unitPrice.toNumber(),
      },
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      amount,
    };
  });

  // 5. Generate challan number
  const challanNumber = await generateChallanNumber();

  // 6. Customer snapshot
  const customerSnapshot = {
    id: customer.id,
    name: customer.name,
    mobile: customer.mobile,
    email: customer.email,
    businessName: customer.businessName,
    gstNumber: customer.gstNumber,
    address: customer.address,
  };

  // 7. Create in transaction
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        customerSnapshot,
        status: data.status || 'draft',
        totalQuantity,
        totalAmount,
        createdById,
        items: { create: itemsData },
      },
      include: challanInclude,
    });

    // If confirmed, deduct stock and create movements
    if (data.status === 'confirmed') {
      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: 'OUT',
            reason: `Challan ${challanNumber}`,
            createdById,
          },
        });
      }
    }

    return challan;
  });
}

export async function updateChallan(id: string, data: UpdateChallanInput, userId: string) {
  const challan = await prisma.challan.findUnique({ where: { id }, include: { items: true } });
  if (!challan) throw Object.assign(new Error('Challan not found'), { status: 404 });
  if (challan.status !== 'draft') {
    throw Object.assign(new Error('Only draft challans can be edited'), { status: 409 });
  }

  let customerId = challan.customerId;
  let customerSnapshot = challan.customerSnapshot;
  if (data.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
    customerId = customer.id;
    customerSnapshot = {
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber,
      address: customer.address,
    };
  }

  if (!data.items) {
    return prisma.challan.update({
      where: { id },
      data: { customerId, customerSnapshot: customerSnapshot as any },
      include: challanInclude,
    });
  }

  const productIds = data.items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map(p => [p.id, p]));

  let totalQuantity = 0;
  let totalAmount = new Prisma.Decimal(0);
  const itemsData = data.items.map(item => {
    const product = productMap.get(item.productId)!;
    const amount = product.unitPrice.mul(item.quantity);
    totalQuantity += item.quantity;
    totalAmount = totalAmount.add(amount);
    return {
      productId: item.productId,
      productSnapshot: { id: product.id, name: product.name, sku: product.sku, unitPrice: product.unitPrice.toNumber() },
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      amount,
    };
  });

  return prisma.$transaction(async (tx) => {
    await tx.challanItem.deleteMany({ where: { challanId: id } });
    return tx.challan.update({
      where: { id },
      data: {
        customerId,
        customerSnapshot: customerSnapshot as any,
        totalQuantity,
        totalAmount,
        items: { create: itemsData },
      },
      include: challanInclude,
    });
  });
}

export async function confirmChallan(id: string, userId: string) {
  const challan = await prisma.challan.findUnique({ where: { id }, include: { items: true } });
  if (!challan) throw Object.assign(new Error('Challan not found'), { status: 404 });
  if (challan.status !== 'draft') {
    throw Object.assign(new Error(`Challan is already ${challan.status}`), { status: 409 });
  }

  // Check stock for all items
  const productIds = challan.items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map(p => [p.id, p]));

  const stockErrors: string[] = [];
  for (const item of challan.items) {
    const product = productMap.get(item.productId);
    if (!product) { stockErrors.push(`Product ${item.productId} not found`); continue; }
    if (product.currentStock < item.quantity) {
      stockErrors.push(`${product.name} (${product.sku}): available ${product.currentStock}, requested ${item.quantity}`);
    }
  }
  if (stockErrors.length > 0) {
    throw Object.assign(new Error(`Insufficient stock:\n${stockErrors.join('\n')}`), { status: 409 });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.challan.update({
      where: { id },
      data: { status: 'confirmed' },
      include: challanInclude,
    });

    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantityChanged: item.quantity,
          movementType: 'OUT',
          reason: `Challan ${challan.challanNumber}`,
          createdById: userId,
        },
      });
    }

    return updated;
  });
}

export async function cancelChallan(id: string) {
  const challan = await prisma.challan.findUnique({ where: { id } });
  if (!challan) throw Object.assign(new Error('Challan not found'), { status: 404 });
  if (challan.status === 'cancelled') {
    throw Object.assign(new Error('Challan is already cancelled'), { status: 409 });
  }
  return prisma.challan.update({
    where: { id },
    data: { status: 'cancelled' },
    include: challanInclude,
  });
}
