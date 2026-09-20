export interface DesignState {
  version: number;
  width: number;
  height: number;
  unit: string;
  templateId: string;
  content: {
    businessName: string;
    mainHeading: string;
    subheading: string;
    promotionalText: string;
    customText: string;
    contactInfo: string;
    address: string;
    website: string;
  };
  brand: {
    logoUrl: string | null;
    logoAssetId: string | null;
    backgroundImageUrl: string | null;
  };
  typography: {
    fontFamily: string;
    headingSize: string; // css scale value, e.g. "large" or "2rem"
    bodySize: string;
    priceSize: string;
    fontWeight: string;
    textAlignment: 'left' | 'center' | 'right';
  };
  colors: {
    background: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
    priceColor: string;
  };
  layout: {
    horizontalAlignment: 'left' | 'center' | 'right';
    verticalAlignment: 'top' | 'center' | 'bottom';
    contentSpacing: string;
    sectionSpacing: string;
    padding: string;
    serviceListMode: 'list' | 'grid';
    logoPlacement: 'top-left' | 'top-center' | 'top-right' | 'hidden';
    safeAreaEnabled: boolean;
    serviceSpacing: string;
  };
  services: {
    serviceId: string;
    name: string;
    price: number;
    unit: string | null;
    categoryName?: string;
    displayOrder: number;
  }[];
}

export const defaultDesignState: DesignState = {
  version: 1,
  width: 36,
  height: 96,
  unit: 'IN',
  templateId: 'StandardListTemplate',
  content: {
    businessName: 'My Business',
    mainHeading: 'Our Services',
    subheading: 'Premium Quality Guaranteed',
    promotionalText: '',
    customText: '',
    contactInfo: '+880 1234 567890',
    address: '123 Business Avenue, City',
    website: 'www.mybusiness.com',
  },
  brand: {
    logoUrl: null,
    logoAssetId: null,
    backgroundImageUrl: null,
  },
  typography: {
    fontFamily: '"Noto Sans Bengali", sans-serif',
    headingSize: '1.5rem',
    bodySize: '1rem',
    priceSize: '1.25rem',
    fontWeight: 'normal',
    textAlignment: 'left',
  },
  colors: {
    background: '#ffffff',
    primaryText: '#0f172a',
    secondaryText: '#475569',
    accent: '#2563eb',
    priceColor: '#0f172a',
  },
  layout: {
    horizontalAlignment: 'left',
    verticalAlignment: 'top',
    contentSpacing: '1rem',
    sectionSpacing: '2rem',
    padding: '2rem',
    serviceListMode: 'list',
    logoPlacement: 'top-center',
    safeAreaEnabled: true,
    serviceSpacing: '0.5em',
  },
  services: [],
};
