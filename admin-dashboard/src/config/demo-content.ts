import { MediaAsset } from "../types/media";

// Helper to create external demo assets
const createExternalDemoAsset = (url: string, title: string): MediaAsset => ({
  sourceType: "external",
  url,
  title,
  alt: title,
});

export const demoContent = {
  hero: {
    title: "Curated excellence for the modern professional.",
    subtitle: "Discover our collection of premium products, designed with precision and built to elevate your daily workspace.",
    primaryActionText: "Shop Collection",
    primaryActionLink: "/products",
    secondaryActionText: "Our Story",
    secondaryActionLink: "/about",
    // We use a high-quality external URL isolated here so UI components are clean.
    image: createExternalDemoAsset(
      "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2070&auto=format&fit=crop", 
      "Premium Workspace Setup"
    )
  },
  
  categories: [
    {
      title: "Computers",
      link: "/categories/computers",
      image: createExternalDemoAsset("https://images.unsplash.com/photo-1531297172864-459c7accc8e5?q=80&w=800&auto=format&fit=crop", "Computers")
    },
    {
      title: "Accessories",
      link: "/categories/accessories",
      image: createExternalDemoAsset("https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop", "Accessories")
    },
    {
      title: "Printing",
      link: "/categories/printing",
      image: createExternalDemoAsset("https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=800&auto=format&fit=crop", "Printing Services")
    },
    {
      title: "Photography",
      link: "/categories/photography",
      image: createExternalDemoAsset("https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop", "Studio Photography")
    }
  ],
  
  featuredServices: [
    {
      title: "Document Printing",
      description: "High-quality bulk and custom printing for your business needs.",
      priceText: "From ৳5 / page",
      link: "/services/document-printing",
      image: createExternalDemoAsset("https://images.unsplash.com/photo-1562564055-71e051d33c19?q=80&w=800&auto=format&fit=crop", "Printing")
    },
    {
      title: "Studio Photography",
      description: "Professional portrait and product photography in our advanced studio.",
      priceText: "From ৳1000 / session",
      link: "/services/studio-photography",
      image: createExternalDemoAsset("https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop", "Photography")
    }
  ],

  promotionalBanner: {
    title: "Design is not just what it looks like.",
    description: "We believe in removing the unnecessary so that the necessary may speak. Every detail is carefully considered to provide you with an exceptional experience.",
    image: createExternalDemoAsset("https://images.unsplash.com/photo-1507764923504-cd90bf7da772?q=80&w=1600&auto=format&fit=crop", "Design philosophy")
  }
};
