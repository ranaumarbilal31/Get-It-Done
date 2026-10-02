const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Get It Done...');

  // Clean existing tables (order matters for foreign keys)
  try {
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.task.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  } catch (err) {
    console.log('No prior tables to clear, proceeding...');
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Home Cleaning',
        slug: 'home-cleaning',
        icon: 'Sparkles',
        description: 'End of lease, deep cleaning, regular house keeping',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Handyman & Repairs',
        slug: 'handyman-repairs',
        icon: 'Wrench',
        description: 'Picture hanging, door fixes, small plaster & paint repairs',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Furniture Assembly',
        slug: 'furniture-assembly',
        icon: 'Hammer',
        description: 'IKEA flatpacks, office desks, bed frames, outdoor furniture',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Removals & Delivery',
        slug: 'removals-delivery',
        icon: 'Truck',
        description: 'Couches, mattresses, single items, small apartment moves',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Gardening & Lawns',
        slug: 'gardening-lawns',
        icon: 'Trees',
        description: 'Lawn mowing, hedge trimming, weeding, green waste removal',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Tech Support & IT',
        slug: 'tech-support',
        icon: 'Laptop',
        description: 'Wi-Fi setups, printer issues, computer tune-ups, data backup',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories.`);

  // 2. Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@getitdone.com',
      password: passwordHash,
      role: 'ADMIN',
      isVerified: true,
      verificationStatus: 'APPROVED',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Get It Done Platform Administrator and Trust & Safety Moderator.',
    },
  });

  await prisma.user.create({
    data: {
      name: 'System Admin (Legacy Alias)',
      email: 'admin@taskconnect.com',
      password: passwordHash,
      role: 'ADMIN',
      isVerified: true,
      verificationStatus: 'APPROVED',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Get It Done Platform Administrator and Trust & Safety Moderator.',
    },
  });

  const posterSarah = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'sarah@example.com',
      password: passwordHash,
      role: 'POSTER',
      isVerified: true,
      verificationStatus: 'APPROVED',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: 'Busy interior designer living in Manhattan. Regularly hire taskers for moves, painting, and assemblies.',
      ratingAvg: 5.0,
      ratingCount: 3,
    },
  });

  const taskerAlex = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password: passwordHash,
      role: 'USER',
      isVerified: true,
      verificationStatus: 'APPROVED',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Master Carpenter & IKEA Flatpack Specialist with 6+ years experience. Fast, punctual, and carry my own tools.',
      ratingAvg: 4.9,
      ratingCount: 16,
      walletBalance: 450.0,
    },
  });

  const taskerElena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena@example.com',
      password: passwordHash,
      role: 'USER',
      isVerified: true,
      verificationStatus: 'APPROVED',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      bio: 'Eco-friendly cleaning expert. 5-star perfectionist with high attention to detail for bond refunds.',
      ratingAvg: 5.0,
      ratingCount: 22,
      walletBalance: 280.0,
    },
  });

  const applicantJessica = await prisma.user.create({
    data: {
      name: 'Jessica Wong',
      email: 'jessica@example.com',
      password: passwordHash,
      role: 'USER',
      isVerified: false,
      verificationStatus: 'PENDING',
      idDocument: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
      verificationNotes: 'Submitted Driver License (Front & Back) for Tasker Verification Badge',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Passionate gardener and landscape designer looking to take on local lawn care tasks.',
    },
  });

  const applicantDavid = await prisma.user.create({
    data: {
      name: 'David Miller',
      email: 'david@example.com',
      password: passwordHash,
      role: 'USER',
      isVerified: false,
      verificationStatus: 'NONE',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: 'New Tasker applicant eager to submit verification documents.',
    },
  });

  console.log('✅ Created users: Admin, Posters, and Verified Taskers.');

  // 3. Tasks
  // Task 1: Open Furniture Assembly
  const task1 = await prisma.task.create({
    data: {
      title: 'Assemble 3-door IKEA Pax Wardrobe & Queen Bed',
      description: 'Need experienced flatpack assembler to build a Pax wardrobe (hinged doors) and a Queen Malm bed frame with 4 storage drawers. Boxes are in the bedroom. Please bring your own drill/tools.',
      budget: 180.0,
      status: 'OPEN',
      isRemote: false,
      location: 'Greenwich Village, New York, NY',
      latitude: 40.7335,
      longitude: -74.0027,
      dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      images: JSON.stringify(['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600']),
      posterId: posterSarah.id,
      categoryId: categories[2].id, // Furniture Assembly
    },
  });

  // Task 2: Open Cleaning
  const task2 = await prisma.task.create({
    data: {
      title: 'End of Lease Deep Clean - 2 Bedroom 1 Bath',
      description: 'Looking for a comprehensive bond return clean for a 2BR apartment. Includes oven degreasing, bathroom scrubbing, interior window panes, and vacuuming throughout.',
      budget: 220.0,
      status: 'OPEN',
      isRemote: false,
      location: 'Williamsburg, Brooklyn, NY',
      latitude: 40.7081,
      longitude: -73.9571,
      dueDate: new Date(Date.now() + 86400000 * 2),
      images: JSON.stringify(['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600']),
      posterId: posterSarah.id,
      categoryId: categories[0].id, // Cleaning
    },
  });

  // Task 3: Remote Tech Support
  const task3 = await prisma.task.create({
    data: {
      title: 'Fix WordPress Slow Loading Speed & SSL Certificate',
      description: 'My WooCommerce boutique store is taking 8+ seconds to load. Need a web developer to optimize caching, images, and ensure HTTPS / SSL redirect works flawlessly.',
      budget: 150.0,
      status: 'OPEN',
      isRemote: true,
      location: 'Remote / Online',
      latitude: null,
      longitude: null,
      dueDate: new Date(Date.now() + 86400000 * 5),
      posterId: posterSarah.id,
      categoryId: categories[5].id, // Tech Support
    },
  });

  // Task 4: Completed Task with Escrow & Review
  const task4 = await prisma.task.create({
    data: {
      title: 'Mount 65-inch Samsung Frame TV on Drywall',
      description: 'Mount TV onto drywall with metal studs. Heavy duty bracket provided, need someone with stud finder and proper toggle bolts.',
      budget: 120.0,
      status: 'COMPLETED',
      isRemote: false,
      location: 'SoHo, New York, NY',
      latitude: 40.7233,
      longitude: -74.0030,
      dueDate: new Date(Date.now() - 86400000 * 2),
      posterId: posterSarah.id,
      categoryId: categories[1].id, // Handyman
    },
  });

  // 4. Offers
  // Offer on Task 1 from Alex
  await prisma.offer.create({
    data: {
      taskId: task1.id,
      taskerId: taskerAlex.id,
      amount: 175.0,
      message: 'Hi Sarah! I have assembled over 40 IKEA Pax systems and Malm beds. I have my own DeWalt power tools and can come this Saturday at 10 AM. Guaranteed neat and fast!',
      status: 'PENDING',
    },
  });

  // Offer on Task 2 from Elena
  await prisma.offer.create({
    data: {
      taskId: task2.id,
      taskerId: taskerElena.id,
      amount: 220.0,
      message: 'Hello! I specialize in end-of-lease bond cleans with a 100% guarantee. I bring all eco-friendly cleaning supplies, steamers, and HEPA vacuums. Happy to help!',
      status: 'PENDING',
    },
  });

  // Offer on Completed Task 4
  const acceptedOffer = await prisma.offer.create({
    data: {
      taskId: task4.id,
      taskerId: taskerAlex.id,
      amount: 120.0,
      message: 'I have mounted dozens of Frame TVs flush against walls with concealed cables. Can do this today.',
      status: 'ACCEPTED',
    },
  });

  // Link assigned offer
  await prisma.task.update({
    where: { id: task4.id },
    data: { assignedOfferId: acceptedOffer.id },
  });

  // 5. Payment for Task 4
  await prisma.payment.create({
    data: {
      taskId: task4.id,
      amount: 120.0,
      platformFee: 12.0,
      status: 'RELEASED',
      stripePaymentIntentId: 'pi_test_seed_12345',
    },
  });

  // 6. Review for Task 4
  await prisma.review.create({
    data: {
      taskId: task4.id,
      reviewerId: posterSarah.id,
      revieweeId: taskerAlex.id,
      rating: 5,
      comment: 'Alex did a sensational job! Perfect alignment with the laser level, super clean wire hiding, and very friendly. 10/10 recommend!',
    },
  });

  // 7. Messages on Task 1
  await prisma.message.create({
    data: {
      taskId: task1.id,
      senderId: taskerAlex.id,
      receiverId: posterSarah.id,
      content: 'Hi Sarah, are the wardrobe doors glass or solid oak? Also what floor is the apartment on?',
    },
  });

  await prisma.message.create({
    data: {
      taskId: task1.id,
      senderId: posterSarah.id,
      receiverId: taskerAlex.id,
      content: 'Hi Alex! They are white hinged doors and we have an elevator in the building, 3rd floor.',
    },
  });

  console.log('✅ Database seeded successfully with realistic marketplace records!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
