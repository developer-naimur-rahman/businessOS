const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found");
    return;
  }

  // Create new typical shop services
  const services = [
    {
      name: "Online Application (Passport/Visa)",
      description: "Assistance with filling out and submitting online applications for Passport, Visa, and other official documents.",
      sellingPrice: 500,
      imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Professional CV & Resume Making",
      description: "Get a professional and modern CV or Resume designed to stand out to employers.",
      sellingPrice: 300,
      imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Birth Certificate Registration",
      description: "Complete assistance for online birth certificate registration and corrections.",
      sellingPrice: 400,
      imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Typing & Data Entry",
      description: "Fast and accurate typing services for documents, assignments, and data entry work.",
      sellingPrice: 150,
      imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Color Printing & Photocopy",
      description: "High-quality color printing, scanning, and photocopy services for all your document needs.",
      sellingPrice: 50,
      imageUrl: "https://images.unsplash.com/photo-1595183348633-cece9d63c22b?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Tax Return & TIN Registration",
      description: "Expert assistance for e-TIN registration, tax return filing, and related financial services.",
      sellingPrice: 1000,
      imageUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=800&auto=format&fit=crop",
    }
  ];

  for (const s of services) {
    const exists = await prisma.product.findFirst({
      where: { organizationId: org.id, type: "SERVICE", name: s.name }
    });
    
    if (!exists) {
      await prisma.product.create({
        data: {
          organizationId: org.id,
          type: "SERVICE",
          name: s.name,
          description: s.description,
          sellingPrice: s.sellingPrice,
          imageUrl: s.imageUrl,
          isActive: true,
          isOnlineVisible: true,
          status: "ACTIVE"
        }
      });
      console.log(`Added ${s.name}`);
    } else {
      console.log(`${s.name} already exists`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
