import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const users = [
    { name: 'Admin User', email: 'admin@erp.com', password: 'Admin@123', role: 'admin' as const },
    { name: 'Sales User', email: 'sales@erp.com', password: 'Sales@123', role: 'sales' as const },
    { name: 'Warehouse User', email: 'warehouse@erp.com', password: 'Ware@123', role: 'warehouse' as const },
    { name: 'Accounts User', email: 'accounts@erp.com', password: 'Acct@123', role: 'accounts' as const },
  ];

  const createdUsers: Record<string, { id: string }> = {};
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
    createdUsers[u.role] = { id: user.id };
    console.log(`✅ User ${u.email} ready`);
  }

  // Create categories
  const categoryNames = ['Electronics', 'Clothing', 'Food & Beverages', 'Hardware', 'Stationery'];
  const categories: Record<string, { id: string }> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = { id: cat.id };
  }
  console.log('✅ Categories ready');

  // Create products
  const adminId = createdUsers['admin'].id;
  const warehouseId = createdUsers['warehouse'].id;

  const products = [
    { name: 'USB-C Hub 7-in-1', sku: 'ELEC-001', categoryId: categories['Electronics'].id, unitPrice: 1299.00, currentStock: 50, minStockAlert: 10, location: 'Rack A-1' },
    { name: 'Wireless Mouse', sku: 'ELEC-002', categoryId: categories['Electronics'].id, unitPrice: 899.00, currentStock: 8, minStockAlert: 15, location: 'Rack A-2' },
    { name: 'Men Cotton Shirt', sku: 'CLO-001', categoryId: categories['Clothing'].id, unitPrice: 499.00, currentStock: 120, minStockAlert: 20, location: 'Rack B-1' },
    { name: 'Packaged Biscuits (Box)', sku: 'FOOD-001', categoryId: categories['Food & Beverages'].id, unitPrice: 240.00, currentStock: 300, minStockAlert: 50, location: 'Rack C-1' },
    { name: 'A4 Paper Ream', sku: 'STAT-001', categoryId: categories['Stationery'].id, unitPrice: 320.00, currentStock: 5, minStockAlert: 20, location: 'Rack E-1' },
    { name: 'Power Drill 750W', sku: 'HW-001', categoryId: categories['Hardware'].id, unitPrice: 2499.00, currentStock: 25, minStockAlert: 5, location: 'Rack D-1' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, unitPrice: p.unitPrice, createdById: adminId },
    });
  }
  console.log('✅ Products ready');

  // Create sample customers
  const salesId = createdUsers['sales'].id;
  const sampleCustomers = [
    {
      name: 'Rajesh Kumar',
      mobile: '9876543210',
      email: 'rajesh@example.com',
      businessName: 'Kumar Traders',
      gstNumber: '27AABCU9603R1ZX',
      customerType: 'wholesale' as const,
      address: '12 MG Road, Mumbai, Maharashtra',
      status: 'active' as const,
      createdById: salesId,
    },
    {
      name: 'Priya Sharma',
      mobile: '9123456780',
      email: 'priya@example.com',
      businessName: 'Sharma Distributors',
      customerType: 'distributor' as const,
      address: '45 Brigade Road, Bangalore, Karnataka',
      status: 'active' as const,
      createdById: salesId,
    },
    {
      name: 'Amit Verma',
      mobile: '8888777766',
      email: 'amit@example.com',
      customerType: 'retail' as const,
      address: '7 Connaught Place, New Delhi',
      status: 'lead' as const,
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Interested in electronics. Called twice.',
      createdById: salesId,
    },
  ];

  for (const c of sampleCustomers) {
    const existing = await prisma.customer.findFirst({ where: { mobile: c.mobile } });
    if (!existing) await prisma.customer.create({ data: c });
  }
  console.log('✅ Customers ready');

  // Stock movements for context
  const elec001 = await prisma.product.findUnique({ where: { sku: 'ELEC-001' } });
  if (elec001) {
    const existingMov = await prisma.stockMovement.findFirst({ where: { productId: elec001.id } });
    if (!existingMov) {
      await prisma.stockMovement.create({
        data: {
          productId: elec001.id,
          quantityChanged: 50,
          movementType: 'IN',
          reason: 'Initial stock entry',
          createdById: warehouseId,
        },
      });
    }
  }
  console.log('✅ Stock movements ready');

  console.log('\n🎉 Seed complete!');
  console.log('\nTest credentials:');
  console.log('  Admin:     admin@erp.com     / Admin@123');
  console.log('  Sales:     sales@erp.com     / Sales@123');
  console.log('  Warehouse: warehouse@erp.com / Ware@123');
  console.log('  Accounts:  accounts@erp.com  / Acct@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
