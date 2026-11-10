import { prisma } from "./prisma";
import { getNextCode } from "./codes";
import { calculateSale } from "./sale-calc";

const DEMO_MODELS = [
  { brand: "Ola Electric", model: "S1 Pro", variant: "Gen 2", batteryType: "Lithium-ion", batteryCapacity: "4 kWh", motorPower: "6 kW", range: "195 km", topSpeed: "120 km/h", exShowroomPrice: 147000, gstRate: 5, defaultPurchasePrice: 118000, defaultSellingPrice: 147000 },
  { brand: "Ather Energy", model: "450X", variant: "3.7 kWh", batteryType: "Lithium-ion", batteryCapacity: "3.7 kWh", motorPower: "6.4 kW", range: "150 km", topSpeed: "90 km/h", exShowroomPrice: 139000, gstRate: 5, defaultPurchasePrice: 112000, defaultSellingPrice: 139000 },
  { brand: "TVS", model: "iQube", variant: "ST", batteryType: "Lithium-ion", batteryCapacity: "3.4 kWh", motorPower: "4.4 kW", range: "145 km", topSpeed: "82 km/h", exShowroomPrice: 128000, gstRate: 5, defaultPurchasePrice: 102000, defaultSellingPrice: 128000 },
  { brand: "Bajaj", model: "Chetak", variant: "Premium", batteryType: "Lithium-ion", batteryCapacity: "3 kWh", motorPower: "4 kW", range: "113 km", topSpeed: "73 km/h", exShowroomPrice: 135000, gstRate: 5, defaultPurchasePrice: 108000, defaultSellingPrice: 135000 },
  { brand: "Hero Vida", model: "V1", variant: "Pro", batteryType: "Lithium-ion", batteryCapacity: "3.94 kWh", motorPower: "6 kW", range: "165 km", topSpeed: "80 km/h", exShowroomPrice: 132000, gstRate: 5, defaultPurchasePrice: 105000, defaultSellingPrice: 132000 },
];

const DEMO_SUPPLIERS = [
  { companyName: "Greenline EV Distributors Pvt Ltd", contactPerson: "Vikram Rao", phone: "9812345001", gstin: "27ABCPD1234F1Z5", address: "Plot 14, MIDC Industrial Area, Pune" },
  { companyName: "Volt Mobility Traders", contactPerson: "Sunita Nair", phone: "9812345002", gstin: "29ABCPD5678F1Z2", address: "45 Electronic City, Bengaluru" },
];

const DEMO_CUSTOMERS = [
  { name: "Rohit Deshmukh", phone: "9900011122", city: "Pune", pin: "411045", occupation: "Software Engineer" },
  { name: "Priya Iyer", phone: "9900011123", city: "Pune", pin: "411001", occupation: "Teacher" },
  { name: "Arjun Mehta", phone: "9900011124", city: "Pune", pin: "411057", occupation: "Business Owner" },
];

export async function seedDemoData() {
  const profile = await prisma.businessProfile.findFirst();

  const models = [];
  for (const m of DEMO_MODELS) {
    const existing = await prisma.vehicleModel.findFirst({ where: { brand: m.brand, model: m.model, variant: m.variant } });
    const model = existing ?? (await prisma.vehicleModel.create({ data: { ...m, isDemo: true } }));
    models.push(model);
  }

  const suppliers = [];
  for (const s of DEMO_SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({ where: { companyName: s.companyName } });
    const supplier = existing ?? (await prisma.supplier.create({ data: { ...s, isDemo: true } }));
    suppliers.push(supplier);
  }

  const customers = [];
  for (const c of DEMO_CUSTOMERS) {
    const existing = await prisma.customer.findFirst({ where: { phone: c.phone } });
    if (existing) {
      customers.push(existing);
      continue;
    }
    const customerCode = await getNextCode("CUSTOMER");
    const customer = await prisma.customer.create({ data: { ...c, customerCode, isDemo: true } });
    customers.push(customer);
  }

  const vehicles = [];
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const supplier = suppliers[i % suppliers.length];
    for (let unit = 0; unit < 2; unit++) {
      const vehicleCode = await getNextCode("VEHICLE");
      const vehicle = await prisma.vehicle.create({
        data: {
          vehicleCode,
          modelId: model.id,
          colour: unit === 0 ? "Pearl White" : "Stealth Black",
          batteryType: model.batteryType,
          batteryCapacity: model.batteryCapacity,
          motorPower: model.motorPower,
          range: model.range,
          topSpeed: model.topSpeed,
          exShowroomPrice: model.exShowroomPrice,
          sellingPrice: model.defaultSellingPrice ?? 130000,
          purchasePrice: model.defaultPurchasePrice ?? 105000,
          gstRate: model.gstRate,
          chassisNumber: `DEMO${vehicleCode.replace(/[^0-9]/g, "")}CH${unit}`,
          motorNumber: `DEMO${vehicleCode.replace(/[^0-9]/g, "")}MO${unit}`,
          batteryNumber: `DEMO${vehicleCode.replace(/[^0-9]/g, "")}BA${unit}`,
          supplierId: supplier.id,
          purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          location: "Showroom",
          isDemo: true,
        },
      });
      vehicles.push(vehicle);
    }
  }

  // Sell the first two demo vehicles to demo customers
  for (let i = 0; i < Math.min(2, vehicles.length, customers.length); i++) {
    const vehicle = vehicles[i];
    const customer = customers[i];
    const calc = calculateSale({
      basePrice: vehicle.sellingPrice,
      discount: 1000,
      exchangeValue: 0,
      gstRate: vehicle.gstRate,
      amountPaid: vehicle.sellingPrice - 1000,
      gstType: "INTRA",
    });

    const saleNumber = await getNextCode("SALE");
    const fy = new Date().getFullYear();
    const invoiceNumber = `${profile?.invoicePrefix ?? "MEV"}/DEMO-${fy}/${String(i + 1).padStart(4, "0")}`;

    await prisma.sale.create({
      data: {
        saleNumber,
        invoiceNumber,
        customerId: customer.id,
        vehicleId: vehicle.id,
        basePrice: calc.basePrice,
        discount: calc.discount,
        exchangeValue: calc.exchangeValue,
        taxableValue: calc.taxableValue,
        gstRate: calc.gstRate,
        cgst: calc.cgst,
        sgst: calc.sgst,
        igst: calc.igst,
        totalGst: calc.totalGst,
        grandTotal: calc.grandTotal,
        amountPaid: calc.amountPaid,
        balanceAmount: calc.balanceAmount,
        paymentStatus: calc.paymentStatus,
        isDemo: true,
      },
    });

    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: "SOLD" } });

    const paymentCode = await getNextCode("PAYMENT");
    await prisma.payment.create({
      data: {
        paymentCode,
        customerId: customer.id,
        amount: calc.amountPaid,
        method: "UPI",
        notes: `Demo payment for ${saleNumber}`,
        isDemo: true,
      },
    });
  }

  // A few demo expenses
  const rentCategory = await prisma.expenseCategory.findUnique({ where: { name: "Rent" } });
  const electricityCategory = await prisma.expenseCategory.findUnique({ where: { name: "Electricity" } });
  if (rentCategory) {
    const code = await getNextCode("EXPENSE");
    await prisma.expense.create({
      data: { expenseCode: code, categoryId: rentCategory.id, description: "Showroom rent", amount: 35000, isDemo: true },
    });
  }
  if (electricityCategory) {
    const code = await getNextCode("EXPENSE");
    await prisma.expense.create({
      data: { expenseCode: code, categoryId: electricityCategory.id, description: "Electricity bill", amount: 6500, isDemo: true },
    });
  }

  await prisma.businessProfile.updateMany({ data: { demoDataSeeded: true } });
}

export async function deleteDemoData() {
  await prisma.payment.deleteMany({ where: { isDemo: true } });
  await prisma.sale.deleteMany({ where: { isDemo: true } });
  await prisma.booking.deleteMany({ where: { isDemo: true } });
  await prisma.serviceRecord.deleteMany({ where: { isDemo: true } });
  await prisma.testRide.deleteMany({ where: { isDemo: true } });
  await prisma.lead.deleteMany({ where: { isDemo: true } });
  await prisma.expense.deleteMany({ where: { isDemo: true } });
  await prisma.vehicle.deleteMany({ where: { isDemo: true } });
  await prisma.customer.deleteMany({ where: { isDemo: true } });
  await prisma.vehicleModel.deleteMany({ where: { isDemo: true } });
  await prisma.supplier.deleteMany({ where: { isDemo: true } });
  await prisma.businessProfile.updateMany({ data: { demoDataSeeded: false } });
}
