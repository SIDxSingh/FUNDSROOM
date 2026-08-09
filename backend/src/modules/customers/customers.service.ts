import { prisma } from '../../config/db';
import { paginate, paginatedResponse } from '../../utils/pagination';
import { CreateCustomerInput, UpdateCustomerInput, FollowUpInput } from './customers.schema';
import { Prisma } from '@prisma/client';

export async function getCustomers(query: {
  page: string;
  limit: string;
  search?: string;
  status?: 'lead' | 'active' | 'inactive';
  customerType?: 'retail' | 'wholesale' | 'distributor';
}) {
  const page = parseInt(query.page, 10);
  const limit = parseInt(query.limit, 10);
  const { skip, take } = paginate(page, limit);

  const where: Prisma.CustomerWhereInput = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { mobile: { contains: query.search } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { businessName: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status;
  if (query.customerType) where.customerType = query.customerType;

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  return customer;
}

export async function createCustomer(data: CreateCustomerInput, createdById: string) {
  return prisma.customer.create({
    data: {
      ...data,
      email: data.email || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      createdById,
    },
  });
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const exists = await prisma.customer.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('Customer not found'), { status: 404 });
  return prisma.customer.update({
    where: { id },
    data: {
      ...data,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    },
  });
}

export async function deleteCustomer(id: string) {
  const exists = await prisma.customer.findUnique({ where: { id } });
  if (!exists) throw Object.assign(new Error('Customer not found'), { status: 404 });
  return prisma.customer.delete({ where: { id } });
}

export async function addFollowUp(customerId: string, data: FollowUpInput, createdById: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  return prisma.customerFollowUp.create({
    data: { customerId, note: data.note, createdById },
    include: { createdBy: { select: { name: true } } },
  });
}

export async function getFollowUps(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  return prisma.customerFollowUp.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true } } },
  });
}
