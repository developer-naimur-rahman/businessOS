const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.storefrontConfig.findFirst();
  if (config) {
    const serviceSlides = [
      {
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
        title: "Passport Photography",
        subtitle: "Instant passport size photos for your urgent needs.",
        buttonText: "View Details",
        link: "/products/4008052d-e011-4145-aa51-d96249a23eae" // Passport Photography ID
      },
      {
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop",
        title: "Graphics Design",
        subtitle: "Professional branding and design services.",
        buttonText: "Learn More",
        link: "/products/6a205ecd-2afa-452f-908f-22c14523cec5" // Graphics Design ID
      }
    ];

    await prisma.storefrontConfig.update({
      where: { id: config.id },
      data: { serviceSlides }
    });
    console.log("Seeded service slides");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
