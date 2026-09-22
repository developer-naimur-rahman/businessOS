const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating products...");
  const products = await prisma.product.findMany();
  for (const product of products) {
      const isService = product.type === 'SERVICE';
      const fallbackUrl = isService ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: product.imageUrl || fallbackUrl }
      });
  }

  console.log("Updating StorefrontConfig hero and service slides...");
  const config = await prisma.storefrontConfig.findFirst();
  if (config) {
    await prisma.storefrontConfig.update({
      where: { id: config.id },
      data: {
        heroSlides: [
          {
            image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop",
            title: "Super Sale - Up to 50% Off",
            subtitle: "Discover the best products at unbeatable prices. Limited time offer.",
            buttonText: "Shop Collection",
            link: "/products"
          },
          {
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
            title: "New Arrivals for You",
            subtitle: "Upgrade your lifestyle with our latest curated premium items.",
            buttonText: "View Products",
            link: "/products?category=new"
          }
        ],
        serviceSlides: [
          {
            image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=1200&auto=format&fit=crop",
            title: "Professional Tax & Finance",
            subtitle: "Expert assistance for e-TIN, tax return, and compliance.",
            buttonText: "Book Service",
            link: "/products"
          },
          {
            image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop",
            title: "Corporate Design & Branding",
            subtitle: "Logo, motion graphics, and full digital branding services.",
            buttonText: "Learn More",
            link: "/products"
          }
        ]
      }
    });
  }

  console.log("Images seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
