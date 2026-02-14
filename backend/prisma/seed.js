const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ============================================================
  // USERS
  // ============================================================

  const adminUser = await prisma.user.upsert({
    where: { phone: '+18033723614' },
    update: { role: 'SUPER_ADMIN' },
    create: {
      phone: '+18033723614',
      email: 'uobinna@gmail.com',
      firstName: 'Obinna',
      lastName: 'Uzoechi',
      role: 'SUPER_ADMIN',
      accountType: 'INDIVIDUAL',
      isVerified: true,
      state: 'Lagos',
      city: 'Ikeja',
    },
  });
  console.log('Created super admin user:', adminUser.id);

  const subAdminUser = await prisma.user.upsert({
    where: { phone: '+2348001000002' },
    update: { role: 'SUB_ADMIN' },
    create: {
      phone: '+2348001000002',
      email: 'subadmin@medsource.ng',
      firstName: 'Tunde',
      lastName: 'Balogun',
      role: 'SUB_ADMIN',
      accountType: 'INDIVIDUAL',
      isVerified: true,
      state: 'Lagos',
      city: 'Lekki',
      address: '5 Admiralty Way, Lekki Phase 1, Lagos',
    },
  });
  console.log('Created sub-admin user:', subAdminUser.id);

  const buyer1 = await prisma.user.upsert({
    where: { phone: '+2348031234567' },
    update: {},
    create: {
      phone: '+2348031234567',
      email: 'adaeze.nwosu@gmail.com',
      firstName: 'Adaeze',
      lastName: 'Nwosu',
      role: 'BUYER',
      accountType: 'HOSPITAL',
      isVerified: true,
      state: 'Lagos',
      city: 'Victoria Island',
      address: '45 Adeola Odeku Street, Victoria Island, Lagos',
    },
  });

  const buyer2 = await prisma.user.upsert({
    where: { phone: '+2348051234568' },
    update: {},
    create: {
      phone: '+2348051234568',
      email: 'ibrahim.yusuf@yahoo.com',
      firstName: 'Ibrahim',
      lastName: 'Yusuf',
      role: 'BUYER',
      accountType: 'PHARMACY',
      isVerified: true,
      state: 'Kano',
      city: 'Kano Municipal',
      address: '8 Murtala Mohammed Way, Kano',
    },
  });

  const buyer3 = await prisma.user.upsert({
    where: { phone: '+2349061234569' },
    update: {},
    create: {
      phone: '+2349061234569',
      firstName: 'Blessing',
      lastName: 'Eze',
      role: 'BUYER',
      accountType: 'INDIVIDUAL',
      isVerified: true,
      state: 'Rivers',
      city: 'Port Harcourt',
      address: '22 Aba Road, Port Harcourt, Rivers',
    },
  });

  const sellerUser1 = await prisma.user.upsert({
    where: { phone: '+2348071234570' },
    update: {},
    create: {
      phone: '+2348071234570',
      email: 'emeka.pharma@medsource.ng',
      firstName: 'Emeka',
      lastName: 'Obi',
      role: 'SELLER',
      accountType: 'PHARMACY',
      isVerified: true,
      state: 'Lagos',
      city: 'Surulere',
      address: '15 Adeniran Ogunsanya Street, Surulere, Lagos',
    },
  });

  const sellerUser2 = await prisma.user.upsert({
    where: { phone: '+2348081234571' },
    update: {},
    create: {
      phone: '+2348081234571',
      email: 'fatima.bloodbank@medsource.ng',
      firstName: 'Fatima',
      lastName: 'Abdullahi',
      role: 'SELLER',
      accountType: 'BLOOD_BANK',
      isVerified: true,
      state: 'Abuja',
      city: 'Garki',
      address: '3 Nnamdi Azikiwe Street, Garki, Abuja',
    },
  });

  const sellerUser3 = await prisma.user.upsert({
    where: { phone: '+2348091234572' },
    update: {},
    create: {
      phone: '+2348091234572',
      email: 'kola.distributors@medsource.ng',
      firstName: 'Kolawole',
      lastName: 'Adeyemi',
      role: 'SELLER',
      accountType: 'DISTRIBUTOR',
      isVerified: true,
      state: 'Oyo',
      city: 'Ibadan',
      address: '7 Ring Road, Challenge, Ibadan, Oyo',
    },
  });

  console.log('Created buyer and seller users');

  // ============================================================
  // CLEAN NON-USER TABLES (for idempotency)
  // ============================================================

  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.seller.deleteMany();

  console.log('Cleaned existing records');

  // ============================================================
  // SELLERS
  // ============================================================

  const seller1 = await prisma.seller.create({
    data: {
      userId: sellerUser1.id,
      businessName: 'MedPharm Nigeria Ltd',
      businessType: 'PHARMACY',
      description: 'Licensed pharmaceutical distributor specializing in oncology and rare disease medications. NAFDAC certified with over 10 years of experience serving hospitals across Nigeria.',
      isVerified: true,
      nafdacLicense: 'PH-8842',
      cacNumber: 'RC-1234567',
      verifiedAt: new Date('2025-06-15'),
      state: 'Lagos',
      city: 'Surulere',
      address: '15 Adeniran Ogunsanya Street, Surulere, Lagos',
      businessPhone: '+2348071234570',
      businessEmail: 'orders@medpharmnigeria.com',
      whatsapp: '+2348071234570',
      rating: 4.7,
      totalSales: 342,
      responseTime: 25,
    },
  });

  const seller2 = await prisma.seller.create({
    data: {
      userId: sellerUser2.id,
      businessName: 'Abuja Central Blood Bank',
      businessType: 'BLOOD_BANK',
      description: 'NBTS-accredited blood bank providing fully screened blood products with strict cold chain protocols. 24/7 availability for emergency blood needs.',
      isVerified: true,
      nafdacLicense: 'BB-3201',
      cacNumber: 'RC-7654321',
      verifiedAt: new Date('2025-03-20'),
      state: 'Abuja',
      city: 'Garki',
      address: '3 Nnamdi Azikiwe Street, Garki, Abuja',
      businessPhone: '+2348081234571',
      businessEmail: 'supply@abujabloodbank.org',
      whatsapp: '+2348081234571',
      rating: 4.9,
      totalSales: 187,
      responseTime: 10,
    },
  });

  const seller3 = await prisma.seller.create({
    data: {
      userId: sellerUser3.id,
      businessName: 'Adeyemi Health Distributors',
      businessType: 'DISTRIBUTOR',
      description: 'Wholesale pharmaceutical distributor covering the South-West region. Specializing in anti-infectives and essential medicines with competitive pricing for hospitals.',
      isVerified: true,
      nafdacLicense: 'DT-5567',
      cacNumber: 'RC-9988776',
      verifiedAt: new Date('2025-08-10'),
      state: 'Oyo',
      city: 'Ibadan',
      address: '7 Ring Road, Challenge, Ibadan, Oyo',
      businessPhone: '+2348091234572',
      businessEmail: 'sales@adeyemihealth.com',
      whatsapp: '+2348091234572',
      rating: 4.3,
      totalSales: 518,
      responseTime: 45,
    },
  });

  console.log('Created sellers');

  // ============================================================
  // PHARMACEUTICAL PRODUCTS
  // ============================================================

  const pharmaProducts = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        type: 'PHARMACEUTICAL',
        name: 'Imatinib Mesylate 400mg Tablets',
        description: 'Tyrosine kinase inhibitor for treatment of chronic myeloid leukemia (CML) and gastrointestinal stromal tumors (GIST). 30 tablets per pack.',
        price: 285000,
        currency: 'NGN',
        quantity: 24,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/imatinib_400mg.jpg'],
        genericName: 'Imatinib Mesylate',
        category: 'Oncology',
        dosageForm: 'Tablet',
        strength: '400mg',
        manufacturer: 'Novartis Pharma AG',
        nafdacNumber: 'A4-0915',
        nafdacVerified: true,
        batchNumber: 'NVS-2025-IM400-A1',
        expiryDate: new Date('2027-09-30'),
        tags: ['oncology', 'leukemia', 'CML', 'imatinib', 'gleevec'],
        isActive: true,
        isFeatured: true,
        viewCount: 156,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        type: 'PHARMACEUTICAL',
        name: 'Rituximab 500mg/50ml Injection',
        description: 'Monoclonal antibody for non-Hodgkin lymphoma, CLL, and rheumatoid arthritis. Single-use vial for IV infusion. Cold chain required.',
        price: 750000,
        currency: 'NGN',
        quantity: 8,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/rituximab_500mg.jpg'],
        genericName: 'Rituximab',
        category: 'Oncology',
        dosageForm: 'Injection',
        strength: '500mg/50ml',
        manufacturer: 'Roche Products Ltd',
        nafdacNumber: 'B1-2204',
        nafdacVerified: true,
        batchNumber: 'ROC-2025-RT500-B3',
        expiryDate: new Date('2027-03-15'),
        tags: ['oncology', 'lymphoma', 'rituximab', 'monoclonal', 'biologic'],
        isActive: true,
        isFeatured: true,
        viewCount: 89,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        type: 'PHARMACEUTICAL',
        name: 'Sorafenib 200mg Tablets',
        description: 'Multi-kinase inhibitor for advanced hepatocellular carcinoma, renal cell carcinoma, and thyroid carcinoma. 60 tablets per bottle.',
        price: 420000,
        currency: 'NGN',
        quantity: 12,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/sorafenib_200mg.jpg'],
        genericName: 'Sorafenib Tosylate',
        category: 'Oncology',
        dosageForm: 'Tablet',
        strength: '200mg',
        manufacturer: 'Bayer HealthCare',
        nafdacNumber: 'A4-3387',
        nafdacVerified: true,
        batchNumber: 'BAY-2025-SF200-C2',
        expiryDate: new Date('2027-06-20'),
        tags: ['oncology', 'liver cancer', 'hepatocellular', 'sorafenib', 'nexavar'],
        isActive: true,
        isFeatured: false,
        viewCount: 67,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller3.id,
        type: 'PHARMACEUTICAL',
        name: 'Nusinersen 12mg/5ml Injection',
        description: 'Antisense oligonucleotide for treatment of spinal muscular atrophy (SMA) in pediatric and adult patients. Intrathecal injection.',
        price: 12500000,
        currency: 'NGN',
        quantity: 3,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/nusinersen_12mg.jpg'],
        genericName: 'Nusinersen',
        category: 'Rare Disease',
        dosageForm: 'Injection',
        strength: '12mg/5ml',
        manufacturer: 'Biogen Inc',
        nafdacNumber: 'B7-1108',
        nafdacVerified: true,
        batchNumber: 'BIO-2025-NU12-A1',
        expiryDate: new Date('2027-12-01'),
        tags: ['rare disease', 'SMA', 'spinal muscular atrophy', 'nusinersen', 'spinraza'],
        isActive: true,
        isFeatured: true,
        viewCount: 203,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller3.id,
        type: 'PHARMACEUTICAL',
        name: 'Eculizumab 300mg/30ml Concentrate',
        description: 'Complement inhibitor for paroxysmal nocturnal haemoglobinuria (PNH) and atypical haemolytic uraemic syndrome (aHUS). IV infusion.',
        price: 9800000,
        currency: 'NGN',
        quantity: 5,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/eculizumab_300mg.jpg'],
        genericName: 'Eculizumab',
        category: 'Rare Disease',
        dosageForm: 'Injection',
        strength: '300mg/30ml',
        manufacturer: 'Alexion Pharmaceuticals',
        nafdacNumber: 'B1-4452',
        nafdacVerified: true,
        batchNumber: 'ALX-2025-EC300-D1',
        expiryDate: new Date('2027-08-25'),
        tags: ['rare disease', 'PNH', 'complement inhibitor', 'eculizumab', 'soliris'],
        isActive: true,
        isFeatured: false,
        viewCount: 134,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller3.id,
        type: 'PHARMACEUTICAL',
        name: 'Meropenem 1g Powder for Injection',
        description: 'Broad-spectrum carbapenem antibiotic for severe hospital-acquired infections, meningitis, and complicated intra-abdominal infections. 10 vials per pack.',
        price: 45000,
        currency: 'NGN',
        quantity: 150,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/meropenem_1g.jpg'],
        genericName: 'Meropenem',
        category: 'Anti-infective',
        dosageForm: 'Powder for Injection',
        strength: '1g',
        manufacturer: 'AstraZeneca Plc',
        nafdacNumber: 'A4-6671',
        nafdacVerified: true,
        batchNumber: 'AZN-2025-MR1G-E4',
        expiryDate: new Date('2028-01-15'),
        tags: ['anti-infective', 'antibiotic', 'carbapenem', 'meropenem', 'hospital'],
        isActive: true,
        isFeatured: false,
        viewCount: 312,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        type: 'PHARMACEUTICAL',
        name: 'Amphotericin B Liposomal 50mg Injection',
        description: 'Liposomal antifungal for systemic fungal infections, visceral leishmaniasis, and cryptococcal meningitis in immunocompromised patients.',
        price: 185000,
        currency: 'NGN',
        quantity: 18,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/amphotericin_b_50mg.jpg'],
        genericName: 'Amphotericin B (Liposomal)',
        category: 'Anti-infective',
        dosageForm: 'Powder for Injection',
        strength: '50mg',
        manufacturer: 'Gilead Sciences',
        nafdacNumber: 'B1-7793',
        nafdacVerified: true,
        batchNumber: 'GIL-2025-AB50-F2',
        expiryDate: new Date('2027-11-30'),
        tags: ['anti-infective', 'antifungal', 'amphotericin', 'fungal', 'ambisome'],
        isActive: true,
        isFeatured: false,
        viewCount: 78,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller3.id,
        type: 'PHARMACEUTICAL',
        name: 'Colistimethate Sodium 1MIU Injection',
        description: 'Last-resort polymyxin antibiotic for multi-drug resistant Gram-negative infections including carbapenem-resistant organisms. 10 vials.',
        price: 62000,
        currency: 'NGN',
        quantity: 40,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/colistin_1miu.jpg'],
        genericName: 'Colistimethate Sodium',
        category: 'Anti-infective',
        dosageForm: 'Powder for Injection',
        strength: '1 MIU',
        manufacturer: 'Xellia Pharmaceuticals',
        nafdacNumber: 'A4-8824',
        nafdacVerified: true,
        batchNumber: 'XEL-2025-CS1M-G1',
        expiryDate: new Date('2027-07-10'),
        tags: ['anti-infective', 'antibiotic', 'colistin', 'MDR', 'last resort'],
        isActive: true,
        isFeatured: false,
        viewCount: 95,
      },
    }),
  ]);

  console.log(`Created ${pharmaProducts.length} pharmaceutical products`);

  // ============================================================
  // BLOOD PRODUCTS
  // ============================================================

  const bloodProducts = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: seller2.id,
        type: 'BLOOD_PRODUCT',
        name: 'Whole Blood - O Negative (Universal Donor)',
        description: 'Fully screened O- whole blood unit (450ml). Tested for HIV, Hepatitis B & C, Syphilis, and Malaria. Cold chain maintained.',
        price: 35000,
        currency: 'NGN',
        quantity: 15,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/blood_o_neg.jpg'],
        bloodType: 'O-',
        bloodProduct: 'WHOLE_BLOOD',
        screeningStatus: 'Fully Screened',
        coldChain: true,
        collectionDate: new Date('2026-02-10'),
        storageTemp: '2-6\u00B0C',
        tags: ['blood', 'O negative', 'universal donor', 'whole blood', 'emergency'],
        isActive: true,
        isFeatured: true,
        viewCount: 245,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.id,
        type: 'BLOOD_PRODUCT',
        name: 'Packed Red Blood Cells - A Positive',
        description: 'Packed RBCs from A+ donor, leukoreduced. 280ml per unit. Full infectious disease screening completed.',
        price: 30000,
        currency: 'NGN',
        quantity: 22,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/prbc_a_pos.jpg'],
        bloodType: 'A+',
        bloodProduct: 'PACKED_RED_CELLS',
        screeningStatus: 'Fully Screened',
        coldChain: true,
        collectionDate: new Date('2026-02-08'),
        storageTemp: '2-6\u00B0C',
        tags: ['blood', 'A positive', 'packed red cells', 'PRBC', 'transfusion'],
        isActive: true,
        isFeatured: false,
        viewCount: 178,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.id,
        type: 'BLOOD_PRODUCT',
        name: 'Fresh Frozen Plasma - B Positive',
        description: 'FFP from B+ donor, separated within 8 hours of collection. 200ml per unit. For coagulopathy and massive transfusion protocols.',
        price: 25000,
        currency: 'NGN',
        quantity: 10,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/ffp_b_pos.jpg'],
        bloodType: 'B+',
        bloodProduct: 'FRESH_FROZEN_PLASMA',
        screeningStatus: 'Fully Screened',
        coldChain: true,
        collectionDate: new Date('2026-02-05'),
        storageTemp: '-18\u00B0C',
        tags: ['blood', 'B positive', 'plasma', 'FFP', 'coagulopathy'],
        isActive: true,
        isFeatured: false,
        viewCount: 92,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.id,
        type: 'BLOOD_PRODUCT',
        name: 'Platelet Concentrate - AB Positive',
        description: 'Single-donor apheresis platelets from AB+ donor. 250ml per unit. 5-day shelf life from collection. Stored on continuous agitator.',
        price: 45000,
        currency: 'NGN',
        quantity: 6,
        inStock: true,
        images: ['https://res.cloudinary.com/medsource/image/upload/platelets_ab_pos.jpg'],
        bloodType: 'AB+',
        bloodProduct: 'PLATELET_CONCENTRATE',
        screeningStatus: 'Fully Screened',
        coldChain: true,
        collectionDate: new Date('2026-02-12'),
        storageTemp: '20-24\u00B0C',
        tags: ['blood', 'AB positive', 'platelets', 'thrombocytopenia', 'apheresis'],
        isActive: true,
        isFeatured: false,
        viewCount: 64,
      },
    }),
  ]);

  console.log(`Created ${bloodProducts.length} blood products`);

  // ============================================================
  // ORDERS
  // ============================================================

  // Order 1: PENDING - buyer1 ordering from seller1
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'MSN-20260214-0001',
      buyerId: buyer1.id,
      sellerId: seller1.id,
      subtotal: 285000,
      deliveryFee: 5000,
      serviceFee: 4275,
      totalAmount: 294275,
      currency: 'NGN',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      deliveryAddress: '45 Adeola Odeku Street, Victoria Island, Lagos',
      deliveryState: 'Lagos',
      deliveryCity: 'Victoria Island',
      deliveryPhone: '+2348031234567',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: pharmaProducts[0].id, // Imatinib
      quantity: 1,
      unitPrice: 285000,
      totalPrice: 285000,
    },
  });

  // Order 2: CONFIRMED - buyer2 ordering from seller3
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'MSN-20260213-0002',
      buyerId: buyer2.id,
      sellerId: seller3.id,
      subtotal: 107000,
      deliveryFee: 8000,
      serviceFee: 1605,
      totalAmount: 116605,
      currency: 'NGN',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentProvider: 'PAYSTACK',
      paymentRef: 'PSK_ref_msn_20260213_002',
      paidAt: new Date('2026-02-13T10:30:00Z'),
      confirmedAt: new Date('2026-02-13T10:31:00Z'),
      deliveryAddress: '8 Murtala Mohammed Way, Kano',
      deliveryState: 'Kano',
      deliveryCity: 'Kano Municipal',
      deliveryPhone: '+2348051234568',
    },
  });

  await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: order2.id,
        productId: pharmaProducts[5].id, // Meropenem
        quantity: 1,
        unitPrice: 45000,
        totalPrice: 45000,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: order2.id,
        productId: pharmaProducts[7].id, // Colistin
        quantity: 1,
        unitPrice: 62000,
        totalPrice: 62000,
      },
    }),
  ]);

  // Order 3: DELIVERED - buyer1 ordering blood product from seller2
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'MSN-20260210-0003',
      buyerId: buyer1.id,
      sellerId: seller2.id,
      subtotal: 70000,
      deliveryFee: 3000,
      serviceFee: 1050,
      totalAmount: 74050,
      currency: 'NGN',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentProvider: 'PAYSTACK',
      paymentRef: 'PSK_ref_msn_20260210_003',
      paidAt: new Date('2026-02-10T08:15:00Z'),
      confirmedAt: new Date('2026-02-10T08:20:00Z'),
      shippedAt: new Date('2026-02-10T09:00:00Z'),
      deliveredAt: new Date('2026-02-10T11:30:00Z'),
      deliveryAddress: '45 Adeola Odeku Street, Victoria Island, Lagos',
      deliveryState: 'Lagos',
      deliveryCity: 'Victoria Island',
      deliveryPhone: '+2348031234567',
      deliveryNotes: 'Urgent delivery - cold chain must be maintained. Deliver to blood bank reception.',
    },
  });

  await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: order3.id,
        productId: bloodProducts[0].id, // O- Whole Blood
        quantity: 2,
        unitPrice: 35000,
        totalPrice: 70000,
      },
    }),
  ]);

  // Order 4: CANCELLED - buyer3 ordering from seller1
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'MSN-20260211-0004',
      buyerId: buyer3.id,
      sellerId: seller1.id,
      subtotal: 750000,
      deliveryFee: 10000,
      serviceFee: 11250,
      totalAmount: 771250,
      currency: 'NGN',
      status: 'CANCELLED',
      paymentStatus: 'FAILED',
      cancelledAt: new Date('2026-02-11T16:00:00Z'),
      deliveryAddress: '22 Aba Road, Port Harcourt, Rivers',
      deliveryState: 'Rivers',
      deliveryCity: 'Port Harcourt',
      deliveryPhone: '+2349061234569',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order4.id,
      productId: pharmaProducts[1].id, // Rituximab
      quantity: 1,
      unitPrice: 750000,
      totalPrice: 750000,
    },
  });

  console.log('Created 4 orders with order items');

  // ============================================================
  // PAYMENTS
  // ============================================================

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      provider: 'PAYSTACK',
      reference: 'PSK_ref_msn_20260213_002',
      amount: 116605,
      currency: 'NGN',
      status: 'PAID',
      paidAt: new Date('2026-02-13T10:30:00Z'),
      providerData: {
        gateway_response: 'Successful',
        channel: 'card',
        ip_address: '102.89.45.123',
        authorization: {
          bin: '408408',
          last4: '4081',
          brand: 'visa',
          bank: 'First Bank of Nigeria',
        },
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      provider: 'PAYSTACK',
      reference: 'PSK_ref_msn_20260214_001',
      amount: 294275,
      currency: 'NGN',
      status: 'PENDING',
      providerData: null,
    },
  });

  console.log('Created 2 payments');

  // ============================================================
  // INQUIRIES
  // ============================================================

  await Promise.all([
    prisma.inquiry.create({
      data: {
        buyerId: buyer2.id,
        sellerId: seller1.id,
        productId: pharmaProducts[1].id, // Rituximab
        buyerName: 'Ibrahim Yusuf',
        buyerPhone: '+2348051234568',
        message: 'Good day. We need 5 units of Rituximab 500mg for our oncology ward at Aminu Kano Teaching Hospital. Can you confirm availability and provide bulk pricing? We would need delivery to Kano within the week.',
        quantity: 5,
        urgency: 'urgent',
        status: 'RESPONDED',
        response: 'Thank you for your inquiry. We currently have 8 units in stock. For 5 units, we can offer a 5% discount at N712,500 per unit (N3,562,500 total). Delivery to Kano takes 2-3 business days via our cold chain logistics partner. Shall I proceed with the order?',
        respondedAt: new Date('2026-02-12T14:30:00Z'),
      },
    }),
    prisma.inquiry.create({
      data: {
        buyerId: buyer3.id,
        sellerId: seller2.id,
        productId: bloodProducts[0].id, // O- Whole Blood
        buyerName: 'Blessing Eze',
        buyerPhone: '+2349061234569',
        message: 'Emergency request. My mother needs O- blood for surgery at UPTH tomorrow morning. Do you have any units available? Can you ship to Port Harcourt overnight?',
        quantity: 3,
        urgency: 'emergency',
        status: 'PENDING',
      },
    }),
    prisma.inquiry.create({
      data: {
        buyerId: buyer1.id,
        sellerId: seller3.id,
        productId: pharmaProducts[3].id, // Nusinersen
        buyerName: 'Adaeze Nwosu',
        buyerPhone: '+2348031234567',
        message: 'Our pediatric neurology department is managing a newly diagnosed SMA Type 1 patient. We need to commence Nusinersen treatment immediately. Please confirm availability, storage requirements, and whether you can supply the loading dose schedule (4 doses over 2 months).',
        quantity: 4,
        urgency: 'urgent',
        status: 'CLOSED',
        response: 'We have 3 units currently in stock and can source the 4th unit within 5 business days. The medication requires refrigerated storage at 2-8 degrees Celsius. We recommend scheduling the loading doses at Day 0, Day 14, Day 28, and Day 63. Total cost for 4 units: N50,000,000. We have completed this order through a separate arrangement.',
        respondedAt: new Date('2026-02-08T09:15:00Z'),
      },
    }),
  ]);

  console.log('Created 3 inquiries');

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  await Promise.all([
    prisma.notification.create({
      data: {
        userId: buyer1.id,
        orderId: order1.id,
        type: 'ORDER_PLACED',
        title: 'Order Placed Successfully',
        body: 'Your order MSN-20260214-0001 for Imatinib Mesylate 400mg has been placed. Complete payment to confirm.',
        data: { orderNumber: 'MSN-20260214-0001' },
        isRead: false,
        sentViaPush: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: buyer2.id,
        orderId: order2.id,
        type: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        body: 'Your order MSN-20260213-0002 has been confirmed. The seller is preparing your items.',
        data: { orderNumber: 'MSN-20260213-0002' },
        isRead: true,
        sentViaPush: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: buyer1.id,
        orderId: order3.id,
        type: 'ORDER_DELIVERED',
        title: 'Order Delivered',
        body: 'Your order MSN-20260210-0003 has been delivered. Please confirm receipt and leave a review.',
        data: { orderNumber: 'MSN-20260210-0003' },
        isRead: true,
        sentViaPush: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: sellerUser1.id,
        type: 'INQUIRY_RECEIVED',
        title: 'New Inquiry Received',
        body: 'Ibrahim Yusuf from Kano has inquired about Rituximab 500mg/50ml Injection. Urgency: Urgent.',
        data: { buyerName: 'Ibrahim Yusuf', productName: 'Rituximab 500mg/50ml Injection' },
        isRead: true,
        sentViaPush: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: sellerUser2.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        body: 'Payment of N74,050 received for order MSN-20260210-0003. Please prepare the items for dispatch.',
        data: { orderNumber: 'MSN-20260210-0003', amount: 74050 },
        isRead: true,
        sentViaPush: true,
      },
    }),
  ]);

  console.log('Created 5 notifications');

  // ============================================================
  // REVIEWS
  // ============================================================

  await Promise.all([
    prisma.review.create({
      data: {
        userId: buyer1.id,
        sellerId: seller2.id,
        rating: 5,
        comment: 'Excellent blood bank service. O- blood was delivered within 3 hours of placing the order. Cold chain was properly maintained and all screening documentation was provided. Highly recommended for emergency blood needs.',
      },
    }),
    prisma.review.create({
      data: {
        userId: buyer2.id,
        sellerId: seller3.id,
        rating: 4,
        comment: 'Good selection of anti-infective medications at competitive prices. Delivery to Kano took 3 days which was reasonable. The Meropenem was genuine and well within expiry. Would order again.',
      },
    }),
  ]);

  console.log('Created 2 reviews');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
