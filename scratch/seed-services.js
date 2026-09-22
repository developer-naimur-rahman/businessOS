const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found");
    return;
  }

  // Create new services
  const services = [
    {
      name: "Graphics Design",
      description: "Professional graphics design services for your brand, marketing materials, and digital presence.",
      sellingPrice: 5000,
      imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Motion Graphics",
      description: "Engaging motion graphics and animations to bring your ideas to life and captivate your audience.",
      sellingPrice: 15000,
      imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Video Editing",
      description: "High-quality video editing for commercials, corporate videos, YouTube content, and more.",
      sellingPrice: 12000,
      imageUrl: "https://images.unsplash.com/photo-1574717024453-354056a3df3f?q=80&w=800&auto=format&fit=crop",
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
