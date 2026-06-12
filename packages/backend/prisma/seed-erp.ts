// ============================================================
// ERPEX — Full ERP Seed Data
// Creates branches, contacts, items, invoices, bills, etc.
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ERP data...');

  // ─── Check if data already exists ─────────────────────────
  const existingContacts = await prisma.contact.count();
  if (existingContacts > 0) {
    console.log('Contacts already exist, skipping seed.');
    return;
  }

  // ─── Branches ─────────────────────────────────────────────
  const hq = await prisma.branch.create({ data: { name: 'Head Office', code: 'HQ', address: 'Mumbai, Maharashtra', phone: '+91-22-1234-5678' } });
  const branch2 = await prisma.branch.create({ data: { name: 'Delhi Branch', code: 'DEL', address: 'New Delhi', phone: '+91-11-9876-5432' } });
  console.log('✓ Branches created');

  // ─── Fetch accounts for mappings ──────────────────────────
  const accounts = await prisma.account.findMany();
  const acctMap = Object.fromEntries(accounts.map(a => [a.code, a]));

  // ─── Item Groups ──────────────────────────────────────────
  const electronicsGroup = await prisma.itemGroup.create({ data: { name: 'Electronics', description: 'Electronic products' } });
  const servicesGroup = await prisma.itemGroup.create({ data: { name: 'Professional Services', description: 'Consulting and services' } });
  const officeGroup = await prisma.itemGroup.create({ data: { name: 'Office Supplies', description: 'Stationery and supplies' } });
  console.log('✓ Item groups created');

  // ─── Items ────────────────────────────────────────────────
  const laptop = await prisma.item.create({
    data: {
      name: 'ThinkPad X1 Carbon Gen 12', sku: 'LPT-X1C-12', type: 'PRODUCT',
      description: 'Lenovo ThinkPad X1 Carbon 14" Laptop', unit: 'pcs',
      purchasePrice: 85000, sellingPrice: 112000, reorderLevel: 5,
      groupId: electronicsGroup.id,
      purchaseAccountId: acctMap['51000']?.id, salesAccountId: acctMap['41000']?.id,
      cogsAccountId: acctMap['51000']?.id, inventoryAccountId: acctMap['11400']?.id,
    },
  });

  const monitor = await prisma.item.create({
    data: {
      name: 'Dell UltraSharp 27" 4K Monitor', sku: 'MON-U27-4K', type: 'PRODUCT',
      description: 'Dell U2723QE USB-C Monitor', unit: 'pcs',
      purchasePrice: 32000, sellingPrice: 42000, reorderLevel: 3,
      groupId: electronicsGroup.id,
      purchaseAccountId: acctMap['51000']?.id, salesAccountId: acctMap['41000']?.id,
      cogsAccountId: acctMap['51000']?.id, inventoryAccountId: acctMap['11400']?.id,
    },
  });

  const consulting = await prisma.item.create({
    data: {
      name: 'IT Consulting - Senior', sku: 'SVC-CONSULT-SR', type: 'SERVICE',
      description: 'Senior IT consultant hourly rate', unit: 'hrs',
      purchasePrice: 0, sellingPrice: 5000,
      groupId: servicesGroup.id,
      salesAccountId: acctMap['41000']?.id,
    },
  });

  const printer = await prisma.item.create({
    data: {
      name: 'HP LaserJet Pro MFP', sku: 'PRN-HP-MFP', type: 'PRODUCT',
      description: 'HP LaserJet Pro MFP M428fdw', unit: 'pcs',
      purchasePrice: 28000, sellingPrice: 38500, reorderLevel: 2,
      groupId: electronicsGroup.id,
      purchaseAccountId: acctMap['51000']?.id, salesAccountId: acctMap['41000']?.id,
      cogsAccountId: acctMap['51000']?.id, inventoryAccountId: acctMap['11400']?.id,
    },
  });

  const stationery = await prisma.item.create({
    data: {
      name: 'Office Stationery Pack', sku: 'OFF-STAT-PK', type: 'PRODUCT',
      description: 'Assorted office supplies kit', unit: 'pcs',
      purchasePrice: 800, sellingPrice: 1200, reorderLevel: 20,
      groupId: officeGroup.id,
      purchaseAccountId: acctMap['51000']?.id, salesAccountId: acctMap['41000']?.id,
      cogsAccountId: acctMap['51000']?.id, inventoryAccountId: acctMap['11400']?.id,
    },
  });

  console.log('✓ Items created');

  // ─── Seed inventory for products ──────────────────────────
  const invDate = new Date('2026-04-15');
  await prisma.inventoryMovement.createMany({
    data: [
      { itemId: laptop.id, date: invDate, type: 'IN', qty: 20, unitCost: 85000, totalCost: 1700000, reference: 'Opening Stock', sourceType: 'ADJUSTMENT', remainingQty: 20 },
      { itemId: monitor.id, date: invDate, type: 'IN', qty: 30, unitCost: 32000, totalCost: 960000, reference: 'Opening Stock', sourceType: 'ADJUSTMENT', remainingQty: 30 },
      { itemId: printer.id, date: invDate, type: 'IN', qty: 10, unitCost: 28000, totalCost: 280000, reference: 'Opening Stock', sourceType: 'ADJUSTMENT', remainingQty: 10 },
      { itemId: stationery.id, date: invDate, type: 'IN', qty: 100, unitCost: 800, totalCost: 80000, reference: 'Opening Stock', sourceType: 'ADJUSTMENT', remainingQty: 100 },
    ],
  });
  console.log('✓ Opening inventory stocked');

  // ─── Contacts: Customers ──────────────────────────────────
  const cust1 = await prisma.contact.create({
    data: {
      name: 'Acme Technologies Pvt Ltd', type: 'CUSTOMER',
      email: 'accounts@acmetech.co.in', phone: '+91-98765-43210',
      companyName: 'Acme Technologies', taxId: '27AAACA1234A1Z5',
      creditTermDays: 30, branchId: hq.id,
      addresses: { create: [
        { type: 'BILLING', line1: '501, Trade Tower', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
        { type: 'SHIPPING', line1: '502, Trade Tower', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
      ]},
    },
  });

  const cust2 = await prisma.contact.create({
    data: {
      name: 'Global Solutions Ltd', type: 'CUSTOMER',
      email: 'finance@globalsol.com', phone: '+91-87654-32100',
      companyName: 'Global Solutions', taxId: '07AABCG5678B1Z3',
      creditTermDays: 45, branchId: branch2.id,
      addresses: { create: [
        { type: 'BILLING', line1: '12, Connaught Place', city: 'New Delhi', state: 'Delhi', postalCode: '110001', country: 'India' },
      ]},
    },
  });

  const cust3 = await prisma.contact.create({
    data: {
      name: 'Startup Innovations', type: 'CUSTOMER',
      email: 'hello@startupinno.io', phone: '+91-76543-21000',
      companyName: 'Startup Innovations LLP', taxId: '29AADCS9012C1Z7',
      creditTermDays: 15, branchId: hq.id,
    },
  });

  // ─── Contacts: Vendors ────────────────────────────────────
  const vendor1 = await prisma.contact.create({
    data: {
      name: 'TechDistributors India', type: 'VENDOR',
      email: 'orders@techdist.in', phone: '+91-11-2345-6789',
      companyName: 'TechDistributors India Pvt Ltd', taxId: '07AABCT3456D1Z1',
      creditTermDays: 30,
      addresses: { create: [
        { type: 'BILLING', line1: '88, Electronic City', city: 'Noida', state: 'Uttar Pradesh', postalCode: '201301', country: 'India' },
      ]},
    },
  });

  const vendor2 = await prisma.contact.create({
    data: {
      name: 'Office Mart Supplies', type: 'VENDOR',
      email: 'sales@officemart.in', phone: '+91-80-3456-7890',
      companyName: 'Office Mart Pvt Ltd', taxId: '29AAFCO7890E1Z4',
      creditTermDays: 15,
    },
  });

  console.log('✓ Contacts created');

  // ─── Estimates ────────────────────────────────────────────
  const est1 = await prisma.estimate.create({
    data: {
      number: 'EST-2026-0001', contactId: cust1.id,
      date: new Date('2026-05-10'), expiryDate: new Date('2026-06-10'),
      status: 'ACCEPTED', subtotal: 336000, taxTotal: 60480, discount: 0, total: 396480,
      lines: { create: [
        { itemId: laptop.id, description: 'ThinkPad X1 Carbon Gen 12', qty: 3, rate: 112000, taxAmount: 60480, amount: 396480, sortOrder: 0 },
      ]},
    },
  });

  await prisma.estimate.create({
    data: {
      number: 'EST-2026-0002', contactId: cust2.id,
      date: new Date('2026-06-01'), expiryDate: new Date('2026-07-01'),
      status: 'SENT', subtotal: 126000, taxTotal: 22680, discount: 0, total: 148680,
      notes: 'Volume discount available for orders above 10 units',
      lines: { create: [
        { itemId: monitor.id, description: 'Dell UltraSharp 27" 4K Monitor', qty: 3, rate: 42000, taxAmount: 22680, amount: 148680, sortOrder: 0 },
      ]},
    },
  });

  console.log('✓ Estimates created');

  // ─── Invoices (from accepted estimate) ────────────────────
  const inv1 = await prisma.invoice.create({
    data: {
      number: 'INV-2026-0001', contactId: cust1.id, estimateId: est1.id,
      branchId: hq.id,
      date: new Date('2026-05-20'), dueDate: new Date('2026-06-19'),
      status: 'SENT', subtotal: 336000, taxTotal: 60480, discount: 0,
      total: 396480, amountPaid: 0, amountDue: 396480,
      lines: { create: [
        { itemId: laptop.id, description: 'ThinkPad X1 Carbon Gen 12', qty: 3, rate: 112000, taxAmount: 60480, amount: 396480, sortOrder: 0 },
      ]},
    },
  });

  const inv2 = await prisma.invoice.create({
    data: {
      number: 'INV-2026-0002', contactId: cust3.id,
      date: new Date('2026-06-01'), dueDate: new Date('2026-06-16'),
      status: 'PARTIALLY_PAID', subtotal: 50000, taxTotal: 9000, discount: 0,
      total: 59000, amountPaid: 30000, amountDue: 29000,
      lines: { create: [
        { itemId: consulting.id, description: 'IT Consulting - Senior', qty: 10, rate: 5000, taxAmount: 9000, amount: 59000, sortOrder: 0 },
      ]},
    },
  });

  const inv3 = await prisma.invoice.create({
    data: {
      number: 'INV-2026-0003', contactId: cust2.id,
      date: new Date('2026-06-05'), dueDate: new Date('2026-07-20'),
      status: 'SENT', subtotal: 84000, taxTotal: 15120, discount: 0,
      total: 99120, amountPaid: 0, amountDue: 99120,
      lines: { create: [
        { itemId: monitor.id, description: 'Dell UltraSharp 27" 4K Monitor', qty: 2, rate: 42000, taxAmount: 15120, amount: 99120, sortOrder: 0 },
      ]},
    },
  });

  console.log('✓ Invoices created');

  // ─── Payments Received ────────────────────────────────────
  await prisma.paymentReceived.create({
    data: {
      number: 'PR-2026-0001', contactId: cust3.id,
      date: new Date('2026-06-08'), amount: 30000,
      paymentMethod: 'BANK_TRANSFER', referenceNo: 'NEFT-REF-88776',
      allocations: { create: [{ invoiceId: inv2.id, amount: 30000 }] },
    },
  });

  console.log('✓ Payments received created');

  // ─── Purchase Orders ──────────────────────────────────────
  const po1 = await prisma.purchaseOrder.create({
    data: {
      number: 'PO-2026-0001', contactId: vendor1.id,
      date: new Date('2026-05-01'), expectedDelivery: new Date('2026-05-15'),
      status: 'RECEIVED', subtotal: 510000, taxTotal: 91800, discount: 0, total: 601800,
      lines: { create: [
        { itemId: laptop.id, description: 'ThinkPad X1 Carbon Gen 12', qty: 5, rate: 85000, receivedQty: 5, taxAmount: 76500, amount: 501500, sortOrder: 0 },
        { itemId: stationery.id, description: 'Office Stationery Pack', qty: 50, rate: 800, receivedQty: 50, taxAmount: 7200, amount: 47200, sortOrder: 1 },
      ]},
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      number: 'PO-2026-0002', contactId: vendor1.id,
      date: new Date('2026-06-10'), expectedDelivery: new Date('2026-06-25'),
      status: 'ISSUED', subtotal: 320000, taxTotal: 57600, discount: 0, total: 377600,
      lines: { create: [
        { itemId: monitor.id, description: 'Dell UltraSharp 27" 4K Monitor', qty: 10, rate: 32000, taxAmount: 57600, amount: 377600, sortOrder: 0 },
      ]},
    },
  });

  console.log('✓ Purchase orders created');

  // ─── Bills ────────────────────────────────────────────────
  const bill1 = await prisma.bill.create({
    data: {
      number: 'BILL-2026-0001', contactId: vendor1.id,
      purchaseOrderId: po1.id, branchId: hq.id, billNo: 'TD-INV-4567',
      date: new Date('2026-05-18'), dueDate: new Date('2026-06-17'),
      status: 'RECEIVED', subtotal: 510000, taxTotal: 91800, discount: 0,
      total: 601800, amountPaid: 0, amountDue: 601800,
      lines: { create: [
        { itemId: laptop.id, description: 'ThinkPad X1 Carbon Gen 12', qty: 5, rate: 85000, taxAmount: 76500, amount: 501500, sortOrder: 0 },
        { itemId: stationery.id, description: 'Office Stationery Pack', qty: 50, rate: 800, taxAmount: 7200, amount: 47200, sortOrder: 1 },
      ]},
    },
  });

  await prisma.bill.create({
    data: {
      number: 'BILL-2026-0002', contactId: vendor2.id,
      billNo: 'OM-8899',
      date: new Date('2026-06-05'), dueDate: new Date('2026-06-20'),
      status: 'PAID', subtotal: 15000, taxTotal: 2700, discount: 0,
      total: 17700, amountPaid: 17700, amountDue: 0,
      lines: { create: [
        { description: 'Printer Cartridges', qty: 10, rate: 1500, taxAmount: 2700, amount: 17700, sortOrder: 0 },
      ]},
    },
  });

  console.log('✓ Bills created');

  // ─── Expenses ─────────────────────────────────────────────
  if (acctMap['52200']) {
    await prisma.expense.create({
      data: {
        date: new Date('2026-06-02'), accountId: acctMap['52200'].id,
        amount: 3500, paymentMethod: 'UPI', description: 'Office internet subscription',
        referenceNo: 'UPI-REF-11223',
      },
    });
    await prisma.expense.create({
      data: {
        date: new Date('2026-06-08'), accountId: acctMap['52200'].id,
        contactId: cust1.id, amount: 12000, paymentMethod: 'CREDIT_CARD',
        description: 'Client meeting travel expenses',
        isBillable: true, billableContactId: cust1.id, category: 'Travel',
      },
    });
  }
  console.log('✓ Expenses created');

  // ─── Payments Made ────────────────────────────────────────
  await prisma.paymentMade.create({
    data: {
      number: 'PM-2026-0001', contactId: vendor2.id,
      date: new Date('2026-06-12'), amount: 17700,
      paymentMethod: 'BANK_TRANSFER', referenceNo: 'NEFT-REF-99887',
    },
  });

  console.log('✓ Payments made created');

  // ─── Projects ─────────────────────────────────────────────
  const proj1 = await prisma.project.create({
    data: {
      name: 'ERP Implementation - Acme Tech', contactId: cust1.id, branchId: hq.id,
      billingMethod: 'PROJECT_HOURLY', budget: 500000, status: 'ACTIVE',
      startDate: new Date('2026-05-01'), endDate: new Date('2026-09-30'),
      description: 'Full ERP implementation and training for Acme Technologies',
      tasks: { create: [
        { name: 'Requirements Gathering', assignee: 'John', hourlyRate: 5000, budgetHours: 20, loggedHours: 12, status: 'IN_PROGRESS', sortOrder: 0 },
        { name: 'System Configuration', assignee: 'Sarah', hourlyRate: 4500, budgetHours: 40, loggedHours: 0, status: 'TODO', sortOrder: 1 },
        { name: 'Data Migration', assignee: 'Mike', hourlyRate: 4000, budgetHours: 30, loggedHours: 0, status: 'TODO', sortOrder: 2 },
        { name: 'User Training', assignee: 'Lisa', hourlyRate: 3500, budgetHours: 15, loggedHours: 0, status: 'TODO', sortOrder: 3 },
      ]},
    },
    include: { tasks: true },
  });

  const proj2 = await prisma.project.create({
    data: {
      name: 'IT Infrastructure Audit', contactId: cust2.id, branchId: branch2.id,
      billingMethod: 'FIXED', budget: 200000, status: 'ACTIVE',
      startDate: new Date('2026-06-01'), endDate: new Date('2026-07-31'),
      description: 'Security and infrastructure audit for Global Solutions',
      tasks: { create: [
        { name: 'Network Assessment', assignee: 'John', hourlyRate: 5000, budgetHours: 10, loggedHours: 5, status: 'IN_PROGRESS', sortOrder: 0 },
        { name: 'Security Review', assignee: 'Mike', hourlyRate: 4000, budgetHours: 15, loggedHours: 0, status: 'TODO', sortOrder: 1 },
        { name: 'Report & Recommendations', assignee: 'Sarah', hourlyRate: 4500, budgetHours: 8, loggedHours: 0, status: 'TODO', sortOrder: 2 },
      ]},
    },
    include: { tasks: true },
  });

  console.log('✓ Projects created');

  // ─── Timesheets ───────────────────────────────────────────
  const task1 = proj1.tasks[0]; // Requirements Gathering
  const task2 = proj2.tasks[0]; // Network Assessment

  const tsEntries = [
    { projectId: proj1.id, taskId: task1.id, date: new Date('2026-06-02'), hours: 4, description: 'Initial client workshop', hourlyRate: 5000, totalAmount: 20000, approvalStatus: 'APPROVED' },
    { projectId: proj1.id, taskId: task1.id, date: new Date('2026-06-03'), hours: 6, description: 'Process mapping sessions', hourlyRate: 5000, totalAmount: 30000, approvalStatus: 'APPROVED' },
    { projectId: proj1.id, taskId: task1.id, date: new Date('2026-06-05'), hours: 2, description: 'Requirements documentation', hourlyRate: 5000, totalAmount: 10000, approvalStatus: 'PENDING' },
    { projectId: proj2.id, taskId: task2.id, date: new Date('2026-06-04'), hours: 3, description: 'Firewall config review', hourlyRate: 5000, totalAmount: 15000, approvalStatus: 'APPROVED' },
    { projectId: proj2.id, taskId: task2.id, date: new Date('2026-06-06'), hours: 2, description: 'Switch infrastructure audit', hourlyRate: 5000, totalAmount: 10000, approvalStatus: 'PENDING' },
  ];

  await prisma.timesheet.createMany({ data: tsEntries });
  console.log('✓ Timesheets created');

  // ─── Budgets ──────────────────────────────────────────────
  const fy = await prisma.fiscalYear.findFirst({ orderBy: { startDate: 'desc' } });
  if (fy && acctMap['41000'] && acctMap['51000'] && acctMap['52200']) {
    const budgetData = [
      { name: 'Revenue Target', fiscalYearId: fy.id, accountId: acctMap['41000'].id, month: 6, year: 2026, amount: 2000000 },
      { name: 'Revenue Target', fiscalYearId: fy.id, accountId: acctMap['41000'].id, month: 7, year: 2026, amount: 2500000 },
      { name: 'COGS Budget', fiscalYearId: fy.id, accountId: acctMap['51000'].id, month: 6, year: 2026, amount: 1200000 },
      { name: 'Utilities Budget', fiscalYearId: fy.id, accountId: acctMap['52200'].id, month: 6, year: 2026, amount: 50000 },
      { name: 'Utilities Budget', fiscalYearId: fy.id, accountId: acctMap['52200'].id, month: 7, year: 2026, amount: 55000 },
    ];
    await prisma.budget.createMany({ data: budgetData });
    console.log('✓ Budgets created');
  }

  // ─── Notifications ────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { title: 'Invoice Overdue', message: 'INV-2026-0002 for Startup Innovations is approaching due date', type: 'WARNING', entityType: 'Invoice', entityId: inv2.id },
      { title: 'Low Stock Alert', message: 'HP LaserJet Pro MFP stock is at reorder level', type: 'ACTION_REQUIRED', entityType: 'Item', entityId: printer.id },
      { title: 'PO Delivery Expected', message: 'PO-2026-0002 from TechDistributors expected by June 25', type: 'INFO', entityType: 'PurchaseOrder' },
    ],
  });
  console.log('✓ Notifications created');

  console.log('\n✅ Full ERP seed complete!');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
