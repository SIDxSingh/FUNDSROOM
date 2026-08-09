import { prisma } from '../../config/db';
import { paginate, paginatedResponse } from '../../utils/pagination';
import { CreateProductInput, UpdateProductInput, StockMovementInput, CategoryInput } from './products.schema';
import { Prisma } from '@prisma/client';

// ─── Products ───────────────────────────────────────────────────────────────

export async function getProducts(query: {
  page: string;
  limit: string;
  search?: string;
  categoryId?: string;
  lowStock?: string;
}) {
  const page = parseInt(query.page, 10);
  const limit = parseInt(query.limit, 10);
  const { skip, take } = paginate(page, limit);

  const where: Prisma.ProductWhereInput = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.lowStock === 'true') {
    where.AND = [
      { currentStock: { lte: prisma.product.fields.minStockAlert } },
    ] as Prisma.ProductWhereInput['AND'];
    // Simpler approach: filter in-memory after fetch OR use raw query
    // We'll use a different strategy — fetch all low stock
    const lowStockData = await prisma.product.findMany({
      where: {
        ...where,
        AND: undefined,
      },
      include: { category: true },
      orderBy: { currentStock: 'asc' },
    });
    const filtered = lowStockData.filter(p => p.currentStock <= p.minStockAlert);
    return paginatedResponse(filtered.slice(skip, skip + take), filtered.length, page, limit);
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { category: true, createdBy: { select: { name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { currentStock: 'asc' },
  });
  return products.filter(p => p.currentStock <= p.minStockAlert);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: { select: { name: true } },
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
  return product;
}

export async function createProduct(data: CreateProductInput, createdById: string) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw Object.assign(new Error('SKU already exists'), { status: 409 });
  return prisma.product.create({
    data: { ...data, createdById },
    include: { category: true },
  });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('Product not found'), { status: 404 });
  if (data.sku && data.sku !== exists.sku) {
    const skuExists = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (skuExists) throw Object.assign(new Error('SKU already exists'), { status: 409 });
  }
  return prisma.product.update({ where: { id }, data, include: { category: true } });
}

export async function deleteProduct(id: string) {
  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('Product not found'), { status: 404 });
  return prisma.product.delete({ where: { id } });
}

// ─── Stock Movements ─────────────────────────────────────────────────────────

export async function createStockMovement(data: StockMovementInput, createdById: string) {
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });

  if (data.movementType === 'OUT') {
    if (product.currentStock < data.quantityChanged) {
      throw Object.assign(
        new Error(`Insufficient stock. Available: ${product.currentStock}, Requested: ${data.quantityChanged}`),
        { status: 409 }
      );
    }
  }

  const newStock =
    data.movementType === 'IN'
      ? product.currentStock + data.quantityChanged
      : product.currentStock - data.quantityChanged;

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId: data.productId,
        quantityChanged: data.quantityChanged,
        movementType: data.movementType,
        reason: data.reason,
        createdById,
      },
      include: { createdBy: { select: { name: true } }, product: { select: { name: true, sku: true } } },
    }),
    prisma.product.update({
      where: { id: data.productId },
      data: { currentStock: newStock },
    }),
  ]);

  return movement;
}

export async function getStockMovements(query: {
  page: string;
  limit: string;
  productId?: string;
  movementType?: 'IN' | 'OUT';
}) {
  const page = parseInt(query.page, 10);
  const limit = parseInt(query.limit, 10);
  const { skip, take } = paginate(page, limit);

  const where: Prisma.StockMovementWhereInput = {};
  if (query.productId) where.productId = query.productId;
  if (query.movementType) where.movementType = query.movementType;

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(data: CategoryInput) {
  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) throw Object.assign(new Error('Category already exists'), { status: 409 });
  return prisma.category.create({ data });
}
